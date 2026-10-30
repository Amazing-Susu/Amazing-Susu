import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getCurrentMember();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { image } = await request.json();
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    // Save the Base64 string to the database
    await prisma.member.update({
      where: { id: session.id as string },
      data: { profilePicture: image },
    });

    return NextResponse.json({ success: true, message: "Profile picture updated." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update picture" }, { status: 500 });
  }
}
