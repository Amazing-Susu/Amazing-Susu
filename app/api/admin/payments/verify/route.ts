import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { paymentId } = await request.json();
    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID required" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { error: `Payment is already ${payment.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
        rejectionReason: null,
      },
    });

    await prisma.notification.create({
      data: {
        memberId: payment.memberId,
        type: "PAYMENT_VERIFIED",
        title: "Payment verified",
        message: `Your payment of GH₵${Number(payment.amount).toLocaleString()} has been verified.`,
        relatedId: payment.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id as string,
        actorType: "admin",
        action: "payment.verified",
        targetType: "Payment",
        targetId: payment.id,
      },
    });

    return NextResponse.json({ success: true, message: "Payment verified" });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to verify" },
      { status: 500 }
    );
  }
}
