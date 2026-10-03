import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      memberId, fullName, phone, whatsappNumber, dateOfBirth,
      address, emergencyContact, preferredPayoutWeek, groupId,
    } = body;

    if (!memberId || !fullName || !phone || !dateOfBirth || !address || !emergencyContact) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (phone !== member.phone) {
      const dup = await prisma.member.findUnique({ where: { phone } });
      if (dup) {
        return NextResponse.json({ error: "Another member already uses that phone number." }, { status: 409 });
      }
    }

    // If group is changing, verify the new group has space
    if (groupId && groupId !== member.groupId) {
      const newGroup = await prisma.group.findUnique({ where: { id: groupId } });
      if (!newGroup) {
        return NextResponse.json({ error: "Selected group not found." }, { status: 404 });
      }
      const activeCount = await prisma.member.count({
        where: { groupId, status: "ACTIVE", id: { not: memberId } },
      });
      if (activeCount >= newGroup.maxMembers) {
        return NextResponse.json(
          { error: `That group is full (${activeCount}/${newGroup.maxMembers}).` },
          { status: 409 }
        );
      }
    }

    await prisma.member.update({
      where: { id: memberId },
      data: {
        fullName,
        phone,
        whatsappNumber: whatsappNumber || null,
        dateOfBirth: new Date(dateOfBirth),
        address,
        emergencyContact,
        preferredPayoutWeek: preferredPayoutWeek ? Number(preferredPayoutWeek) : null,
        ...(groupId ? { groupId } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id as string,
        actorType: "admin",
        action: "member.updated",
        targetType: "Member",
        targetId: memberId,
      },
    });

    return NextResponse.json({ success: true, message: "Member updated" });
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update" },
      { status: 500 }
    );
  }
}
