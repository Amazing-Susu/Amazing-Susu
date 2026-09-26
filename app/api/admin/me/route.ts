import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function GET() {
  const session = await getCurrentAdmin();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.id as string },
    select: { id: true, fullName: true, email: true, phone: true },
  });

  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  return NextResponse.json({ admin });
}
