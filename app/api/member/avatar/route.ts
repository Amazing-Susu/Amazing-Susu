import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";

export async function POST(req: Request) {
  try {
    // 1. Check if the user is logged in
    const member = await getCurrentMember();
    if (!member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get the base64 image string from the request
    const { avatarBase64 } = await req.json();

    if (!avatarBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // 3. Update the member's avatar in the database
    const updatedMember = await prisma.member.update({
      where: { id: member.id },
      data: { avatarUrl: avatarBase64 },
    });

    return NextResponse.json({ success: true, avatarUrl: updatedMember.avatarUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
  }
}
