import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { memberId, newPassword } = await request.json();

    if (!memberId || !newPassword || newPassword.length < 4) {
      return NextResponse.json(
        { error: "Member ID and a password of at least 4 characters are required." },
        { status: 400 }
      );
    }

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });

    const passwordHash = await hashPassword(newPassword);

    await prisma.member.update({
      where: { id: memberId },
      data: { passwordHash },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id as string,
        actorType: "admin",
        action: "member.password_reset",
        targetType: "Member",
        targetId: memberId,
      },
    });

    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
