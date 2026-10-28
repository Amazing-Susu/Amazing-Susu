import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { memberId, note } = await request.json();
    if (!memberId || !note || !note.trim()) {
      return NextResponse.json({ error: "Note content is required." }, { status: 400 });
    }

    const newNote = await prisma.adminNote.create({
      data: {
        memberId,
        note: note.trim(),
      },
    });

    return NextResponse.json({ success: true, note: newNote });
  } catch (error) {
    console.error("Add note error:", error);
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}
