import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { weekId, memberId } = await request.json();
    if (!weekId || !memberId) {
      return NextResponse.json({ error: "Week and member are required." }, { status: 400 });
    }

    const week = await prisma.week.findUnique({
      where: { id: weekId },
      include: { cycle: { include: { group: true } } },
    });
    if (!week) return NextResponse.json({ error: "Week not found." }, { status: 404 });
    if (week.payoutMemberId) {
      return NextResponse.json({ error: "This week is already assigned. Unassign it first." }, { status: 409 });
    }

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });
    if (member.groupId !== week.cycle.groupId) {
      return NextResponse.json({ error: "Member belongs to a different group." }, { status: 400 });
    }

    const existingWeek = await prisma.week.findFirst({
      where: {
        cycleId: week.cycleId,
        payoutMemberId: memberId,
      },
    });
    if (existingWeek) {
      return NextResponse.json(
        { error: `${member.fullName} is already assigned to Week ${existingWeek.weekNumber}.` },
        { status: 409 }
      );
    }

    const contribution = Number(week.cycle.group.contributionAmount);
    const expectedAmount = 20 * contribution - 50;

    await prisma.$transaction([
      prisma.week.update({
        where: { id: weekId },
        data: { payoutMemberId: memberId },
      }),
      prisma.payout.create({
        data: {
          memberId,
          groupId: week.cycle.groupId,
          cycleId: week.cycleId,
          weekId,
          expectedAmount,
          status: "SCHEDULED",
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: session.id as string,
          actorType: "admin",
          action: "payout.assigned",
          targetType: "Week",
          targetId: weekId,
          details: { memberId, weekNumber: week.weekNumber },
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Payout week assigned." });
  } catch (error) {
    console.error("Assign error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to assign" },
      { status: 500 }
    );
  }
}
