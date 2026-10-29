import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { paymentId } = await request.json();
    if (!paymentId) return NextResponse.json({ error: "Payment ID required" }, { status: 400 });

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    await prisma.payment.delete({ where: { id: paymentId } });

    await prisma.auditLog.create({
      data: {
        actorId: session.id as string,
        actorType: "admin",
        action: "payment.deleted",
        targetType: "Payment",
        targetId: paymentId,
        details: { amount: payment.amount, reference: payment.reference }
      },
    });

    return NextResponse.json({ success: true, message: "Payment deleted." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
