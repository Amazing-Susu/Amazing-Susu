import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";

function generateReference(): string {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AGS-${year}-${rand}`;
}

export async function POST(request: NextRequest) {
  const session = await getCurrentMember();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { amount, paymentMethod, transactionId } = body;

    if (!amount || !paymentMethod) {
      return NextResponse.json(
        { error: "Amount and payment method are required" },
        { status: 400 }
      );
    }

    const amt = Number(amount);
    if (amt <= 0 || amt > 1000000) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const member = await prisma.member.findUnique({
      where: { id: session.id as string },
      include: {
        group: {
          include: {
            cycles: {
              where: { status: "ACTIVE" },
              orderBy: { cycleNumber: "desc" },
              take: 1,
              include: { weeks: { orderBy: { weekNumber: "asc" } } },
            },
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const cycle = member.group.cycles[0];
    if (!cycle) {
      return NextResponse.json(
        { error: "No active cycle for this group." },
        { status: 400 }
      );
    }

    const now = new Date();
    const start = new Date(cycle.startDate).getTime();
    const weeksSince = Math.floor((now.getTime() - start) / (7 * 24 * 60 * 60 * 1000));
    const currentWeekNumber = Math.min(Math.max(weeksSince + 1, 1), 20);

    const week = cycle.weeks.find((w) => w.weekNumber === currentWeekNumber);
    if (!week) {
      return NextResponse.json({ error: "Week not found" }, { status: 400 });
    }

    let reference = generateReference();
    for (let i = 0; i < 3; i++) {
      const dup = await prisma.payment.findUnique({ where: { reference } });
      if (!dup) break;
      reference = generateReference();
    }

    const payment = await prisma.payment.create({
      data: {
        reference,
        memberId: member.id,
        groupId: member.groupId,
        cycleId: cycle.id,
        weekId: week.id,
        amount: amt,
        paymentMethod,
        paymentDate: new Date(),
        transactionId: transactionId || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment submitted. Awaiting admin verification.",
      payment: {
        id: payment.id,
        reference: payment.reference,
        amount: Number(payment.amount),
        status: payment.status,
      },
    });
  } catch (error) {
    console.error("Payment submit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit payment" },
      { status: 500 }
    );
  }
}
