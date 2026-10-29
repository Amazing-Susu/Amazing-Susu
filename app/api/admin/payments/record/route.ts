import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

function generateReference(): string {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AGS-${year}-${rand}`;
}

export async function POST(request: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { memberId, amount, paymentMethod, weekNumber, transactionId } = await request.json();
    if (!memberId || !amount || !paymentMethod || !weekNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        group: {
          include: {
            cycles: { where: { status: "ACTIVE" }, orderBy: { cycleNumber: "desc" }, take: 1, include: { weeks: true } },
          },
        },
      },
    });

    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    
    const cycle = member.group.cycles[0];
    if (!cycle) return NextResponse.json({ error: "No active cycle." }, { status: 400 });

    // Find the specific week chosen by the admin
    const week = cycle.weeks.find((w) => w.weekNumber === Number(weekNumber));
    
    if (!week) return NextResponse.json({ error: "Week not found in this cycle." }, { status: 400 });

    let reference = generateReference();
    for (let i = 0; i < 3; i++) {
      const dup = await prisma.payment.findUnique({ where: { reference } });
      if (!dup) break;
      reference = generateReference();
    }

    // Instantly record as VERIFIED
    const payment = await prisma.payment.create({
      data: {
        reference,
        memberId: member.id,
        groupId: member.groupId,
        cycleId: cycle.id,
        weekId: week.id,
        amount: Number(amount),
        paymentMethod,
        paymentDate: new Date(),
        transactionId: transactionId || null,
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
    });

    // Notify member
    await prisma.notification.create({
      data: {
        memberId: member.id,
        type: "PAYMENT_VERIFIED",
        title: "Payment Recorded",
        message: `Admin recorded a payment of GH₵${Number(amount).toLocaleString()} for Week ${week.weekNumber}.`,
        relatedId: payment.id,
      }
    });

    return NextResponse.json({ success: true, message: "Payment recorded." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
