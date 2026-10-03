import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { memberId, status } = await request.json();

    if (!memberId || !["ACTIVE", "INACTIVE", "SUSPENDED"].includes(status)) {
      return NextResponse.json({ error: "Invalid member or status" }, { status: 400 });
    }

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    await prisma.member.update({
      where: { id: memberId },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id as string,
        actorType: "admin",
        action: `member.status.${status.toLowerCase()}`,
        targetType: "Member",
        targetId: memberId,
      },
    });

    return NextResponse.json({ success: true, message: `Member ${status.toLowerCase()}` });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
