import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const member = await getCurrentMember();
    if (!member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { avatarBase64 } = await req.json();

    if (!avatarBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // FIXED: Changed avatarUrl to profilePicture, and added "as string" to member.id
    const updatedMember = await prisma.member.update({
      where: { id: member.id as string }, 
      data: { profilePicture: avatarBase64 }, 
    });

    return NextResponse.json({ success: true, profilePicture: updatedMember.profilePicture });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
  }
}
