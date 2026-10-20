import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function GET() {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Total Members (Active only)
    const totalMembers = await prisma.member.count({
      where: { status: "ACTIVE" },
    });

    // 2. Total Contributions (Sum of VERIFIED payments)
    const contributionsAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "VERIFIED" },
    });
    const totalContributions = Number(contributionsAgg._sum.amount || 0);

    // 3. Total Weeks Paid
    // Group all verified payments by member and week, then check if sum >= expected
    const groupedPayments = await prisma.payment.groupBy({
      by: ['memberId', 'weekId'],
      where: { status: "VERIFIED" },
      _sum: { amount: true },
    });

    // Get member group amounts to compare
    const members = await prisma.member.findMany({
      select: { id: true, group: { select: { contributionAmount: true } } },
    });
    const memberMap = new Map(members.map(m => [m.id, Number(m.group.contributionAmount)]));

    let totalWeeksPaid = 0;
    for (const p of groupedPayments) {
      const expected = memberMap.get(p.memberId) || 0;
      const paid = Number(p._sum.amount || 0);
      if (paid >= expected && expected > 0) {
        totalWeeksPaid++;
      }
    }

    // 4. Active Groups (Groups with at least 1 active member)
    const activeGroups = await prisma.group.count({
      where: { members: { some: { status: "ACTIVE" } } },
    });

    return NextResponse.json({
      totalMembers,
      totalContributions,
      totalWeeksPaid,
      activeGroups,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
