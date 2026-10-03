import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { weekId } = await request.json();
    if (!weekId) return NextResponse.json({ error: "Week ID required." }, { status: 400 });

    const week = await prisma.week.findUnique({ where: { id: weekId } });
    if (!week) return NextResponse.json({ error: "Week not found." }, { status: 404 });
    if (!week.payoutMemberId) {
      return NextResponse.json({ error: "This week is not assigned." }, { status: 400 });
    }

    const payout = await prisma.payout.findFirst({ where: { weekId } });
    if (payout && payout.status === "PAID") {
      return NextResponse.json({ error: "Cannot unassign — this payout is already marked as paid." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.week.update({ where: { id: weekId }, data: { payoutMemberId: null } }),
      ...(payout ? [prisma.payout.delete({ where: { id: payout.id } })] : []),
      prisma.auditLog.create({
        data: {
          actorId: session.id as string,
          actorType: "admin",
          action: "payout.unassigned",
          targetType: "Week",
          targetId: weekId,
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Week unassigned." });
  } catch (error) {
    console.error("Unassign error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to unassign" },
      { status: 500 }
    );
  }
}
