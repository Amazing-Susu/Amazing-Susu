import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { paymentId, amount, paymentMethod, weekNumber, status } = await request.json();
    if (!paymentId || !amount || !paymentMethod || !weekNumber || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { member: true, cycle: { include: { weeks: true } } }
    });

    if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    const week = payment.cycle.weeks.find(w => w.weekNumber === Number(weekNumber));
    if (!week) return NextResponse.json({ error: "Invalid week number" }, { status: 400 });

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        amount: Number(amount),
        paymentMethod,
        weekId: week.id,
        status,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id as string,
        actorType: "admin",
        action: "payment.updated",
        targetType: "Payment",
        targetId: payment.id,
        details: { newAmount: amount, newStatus: status }
      },
    });

    return NextResponse.json({ success: true, message: "Payment updated." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}
