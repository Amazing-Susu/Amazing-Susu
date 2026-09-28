import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      fullName,
      phone,
      whatsappNumber,
      ghanaCardNumber,
      dateOfBirth,
      address,
      emergencyContact,
      password,
      groupId,
      preferredPayoutWeek,
    } = body;

    if (
      !fullName || !phone || !ghanaCardNumber || !dateOfBirth ||
      !address || !emergencyContact || !password || !groupId
    ) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const existing = await prisma.member.findFirst({
      where: { OR: [{ phone }, { ghanaCardNumber }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A member with that phone number or Ghana Card already exists." },
        { status: 409 }
      );
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    const memberCount = await prisma.member.count({
      where: { groupId, status: "ACTIVE" },
    });

    if (memberCount >= group.maxMembers) {
      return NextResponse.json(
        {
          error: `This group is full (${memberCount}/${group.maxMembers}). It cannot accept new members. Wait for the next cycle or open a new group.`,
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const member = await prisma.member.create({
      data: {
        fullName,
        phone,
        whatsappNumber: whatsappNumber || null,
        ghanaCardNumber,
        dateOfBirth: new Date(dateOfBirth),
        address,
        emergencyContact,
        passwordHash,
        groupId,
        preferredPayoutWeek: preferredPayoutWeek
          ? Number(preferredPayoutWeek)
          : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Member created successfully",
      member: { id: member.id, fullName: member.fullName, phone: member.phone },
    });
  } catch (error) {
    console.error("Create member error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create member" },
      { status: 500 }
    );
  }
}
