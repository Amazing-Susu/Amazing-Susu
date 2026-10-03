import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function GET() {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groups = await prisma.group.findMany({
    orderBy: { contributionAmount: "asc" },
    include: {
      cycles: {
        where: { status: "ACTIVE" },
        orderBy: { cycleNumber: "desc" },
        take: 1,
        include: {
          weeks: {
            orderBy: { weekNumber: "asc" },
            include: {
              payoutMember: { select: { id: true, fullName: true, phone: true } },
            },
          },
          payouts: true,
        },
      },
      members: {
        where: { status: "ACTIVE" },
        select: { id: true, fullName: true, phone: true },
        orderBy: { fullName: "asc" },
      },
    },
  });

  const result = groups.map((g) => {
    const cycle = g.cycles[0];
    const contribution = Number(g.contributionAmount);
    const expectedAmount = 20 * contribution - 50;

    return {
      id: g.id,
      contributionAmount: contribution,
      expectedPayout: expectedAmount,
      maxMembers: g.maxMembers,
      memberCount: g.members.length,
      members: g.members.map((m) => ({
        id: m.id,
        fullName: m.fullName,
        phone: m.phone,
      })),
      cycleId: cycle?.id || null,
      weeks: (cycle?.weeks || []).map((w) => {
        const payout = cycle?.payouts.find((p) => p.weekId === w.id);
        return {
          weekNumber: w.weekNumber,
          weekId: w.id,
          dueDate: w.dueDate.toISOString(),
          assignedMember: w.payoutMember
            ? { id: w.payoutMember.id, fullName: w.payoutMember.fullName, phone: w.payoutMember.phone }
            : null,
          payout: payout
            ? {
                id: payout.id,
                status: payout.status,
                expectedAmount: Number(payout.expectedAmount),
                actualAmount: payout.actualAmount ? Number(payout.actualAmount) : null,
                paidAt: payout.paidAt?.toISOString() || null,
              }
            : null,
        };
      }),
    };
  });

  return NextResponse.json({ groups: result });
}
