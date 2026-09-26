import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!process.env.ADMIN_SETUP_TOKEN || token !== process.env.ADMIN_SETUP_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.admin.findFirst();
  if (existing) {
    return NextResponse.json(
      { error: "An admin already exists. Setup can only run once." },
      { status: 409 }
    );
  }

  const email = request.nextUrl.searchParams.get("email");
  const phone = request.nextUrl.searchParams.get("phone");
  const password = request.nextUrl.searchParams.get("password");
  const fullName = request.nextUrl.searchParams.get("name") || "Administrator";

  if (!email || !phone || !password) {
    return NextResponse.json(
      { error: "Missing email, phone, or password" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.admin.create({
    data: { email, phone, passwordHash, fullName },
  });

  return NextResponse.json({
    success: true,
    message: "Admin account created. You can now log in.",
    adminId: admin.id,
  });
}
