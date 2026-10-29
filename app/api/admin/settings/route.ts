import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.admin.findUnique({
    where: { id: session.id as string },
    select: { fullName: true, email: true, phone: true, businessName: true, supportPhone: true, supportWhatsapp: true }
  });

  return NextResponse.json({ settings: admin });
}

export async function POST(request: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { fullName, email, phone, newPassword, businessName, supportPhone, supportWhatsapp } = await request.json();

    if (!fullName || !email || !phone) {
      return NextResponse.json({ error: "Admin name, email, and phone are required." }, { status: 400 });
    }

    const adminId = session.id as string;

    const existing = await prisma.admin.findFirst({
      where: { OR: [{ email }, { phone }], NOT: { id: adminId } }
    });

    if (existing) {
      return NextResponse.json({ error: "That email or phone is already in use." }, { status: 409 });
    }

    const updateData: any = { 
      fullName, 
      email, 
      phone,
      businessName: businessName || "Amazing Grace Susu",
      supportPhone: supportPhone || null,
      supportWhatsapp: supportWhatsapp || null
    };

    if (newPassword && newPassword.trim().length > 0) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
      }
      updateData.passwordHash = await hashPassword(newPassword);
    }

    await prisma.admin.update({
      where: { id: adminId },
      data: updateData,
    });

    return NextResponse.json({ success: true, message: "Settings saved successfully." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
