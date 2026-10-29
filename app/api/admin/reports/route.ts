import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function GET() {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Total Collected (Verified payments)
    const paymentsAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "VERIFIED" },
    });
    const totalCollected = Number(paymentsAgg._sum.amount || 0);

    // 2. Total Paid Out (Completed payouts)
    const payoutsAgg = await prisma.payout.aggregate({
      _sum: { actualAmount: true },
      where: { status: "PAID" },
    });
    const totalPaidOut = Number(payoutsAgg._sum.actualAmount || 0);

    // 3. Pending Payouts (Scheduled, not yet paid)
    const pendingPayoutsAgg = await prisma.payout.aggregate({
      _sum: { expectedAmount: true },
      where: { status: "SCHEDULED" },
    });
    const pendingPayouts = Number(pendingPayoutsAgg._sum.expectedAmount || 0);

    // 4. Group Breakdown
    const groups = await prisma.group.findMany({
      orderBy: { contributionAmount: "asc" },
      include: {
        payments: { where: { status: "VERIFIED" } },
        payouts: { where: { status: "PAID" } },
      },
    });

    const groupData = groups.map((g) => ({
      id: g.id,
      amount: Number(g.contributionAmount),
      collected: g.payments.reduce((sum, p) => sum + Number(p.amount), 0),
      paidOut: g.payouts.reduce((sum, p) => sum + Number(p.actualAmount || p.expectedAmount), 0),
    }));

    return NextResponse.json({
      totalCollected,
      totalPaidOut,
      pendingPayouts,
      balance: totalCollected - totalPaidOut,
      groupData,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}
