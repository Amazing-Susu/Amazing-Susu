import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { payoutId, actualAmount } = await request.json();
    if (!payoutId) return NextResponse.json({ error: "Payout ID required." }, { status: 400 });

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { member: { select: { fullName: true } } },
    });
    if (!payout) return NextResponse.json({ error: "Payout not found." }, { status: 404 });
    if (payout.status === "PAID") {
      return NextResponse.json({ error: "This payout is already marked as paid." }, { status: 400 });
    }

    const amount = actualAmount ? Number(actualAmount) : Number(payout.expectedAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: "PAID",
          actualAmount: amount,
          paidAt: new Date(),
        },
      }),
      prisma.notification.create({
        data: {
          memberId: payout.memberId,
          type: "PAYOUT_COMPLETED",
          title: "Payout received",
          message: `Your Susu payout of GH₵${amount.toLocaleString()} has been sent. Congratulations!`,
          relatedId: payout.id,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: session.id as string,
          actorType: "admin",
          action: "payout.paid",
          targetType: "Payout",
          targetId: payoutId,
          details: { amount },
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Payout marked as paid." });
  } catch (error) {
    console.error("Mark paid error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to mark paid" },
      { status: 500 }
    );
  }
}
