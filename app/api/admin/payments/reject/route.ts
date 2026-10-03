import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { paymentId, reason } = await request.json();
    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID required" }, { status: 400 });
    }
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: "A rejection reason is required." },
        { status: 400 }
      );
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

    const cleanReason = reason.trim();

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "REJECTED",
        rejectionReason: cleanReason,
        verifiedAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        memberId: payment.memberId,
        type: "PAYMENT_REJECTED",
        title: "Payment rejected",
        message: `Your payment of GH₵${Number(payment.amount).toLocaleString()} was rejected. Reason: ${cleanReason}`,
        relatedId: payment.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id as string,
        actorType: "admin",
        action: "payment.rejected",
        targetType: "Payment",
        targetId: payment.id,
        details: { reason: cleanReason },
      },
    });

    return NextResponse.json({ success: true, message: "Payment rejected" });
  } catch (error) {
    console.error("Reject error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reject" },
      { status: 500 }
    );
  }
}
