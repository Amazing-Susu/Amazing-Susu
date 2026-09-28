import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";

export async function GET() {
  const session = await getCurrentMember();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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
            include: {
              weeks: { orderBy: { weekNumber: "asc" } },
            },
          },
        },
      },
      payments: {
        orderBy: { submittedAt: "desc" },
        take: 100,
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const contributionAmount = Number(member.group.contributionAmount);
  const expectedPayout = 20 * contributionAmount - 50;

  const cycle = member.group.cycles[0];
  const now = new Date();

  // Determine current week (based on cycle start date)
  let currentWeekNumber = 1;
  if (cycle) {
    const start = new Date(cycle.startDate).getTime();
    const weeksSince = Math.floor((now.getTime() - start) / (7 * 24 * 60 * 60 * 1000));
    currentWeekNumber = Math.min(Math.max(weeksSince + 1, 1), 20);
  }

  // Build weekly summaries
  const weeklyStatus = (cycle?.weeks || []).map((w) => {
    const weekPayments = member.payments.filter((p) => p.weekId === w.id);
    const verified = weekPayments
      .filter((p) => p.status === "VERIFIED")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const pending = weekPayments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    let status: "NOT_PAID" | "PARTIAL" | "FULL" = "NOT_PAID";
    if (verified >= contributionAmount) status = "FULL";
    else if (verified > 0 || pending > 0) status = "PARTIAL";

    return {
      weekNumber: w.weekNumber,
      weekId: w.id,
      dueDate: w.dueDate.toISOString(),
      expected: contributionAmount,
      verified,
      pending,
      status,
    };
  });

  return NextResponse.json({
    member: {
      id: member.id,
      fullName: member.fullName,
      phone: member.phone,
      groupAmount: contributionAmount,
      expectedPayout,
      currentWeekNumber,
      cycleId: cycle?.id || null,
    },
    weeklyStatus,
    payments: member.payments.map((p) => ({
      id: p.id,
      reference: p.reference,
      amount: Number(p.amount),
      method: p.paymentMethod,
      status: p.status,
      paymentDate: p.paymentDate.toISOString(),
      rejectionReason: p.rejectionReason,
    })),
  });
}
