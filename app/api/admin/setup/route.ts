import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  // Step 1: Check token
  if (!process.env.ADMIN_SETUP_TOKEN) {
    return NextResponse.json({
      step: "env-check",
      error: "ADMIN_SETUP_TOKEN is not set in environment",
    }, { status: 500 });
  }
  if (token !== process.env.ADMIN_SETUP_TOKEN) {
    return NextResponse.json({
      step: "token-check",
      error: "Token mismatch",
      received: token,
      expected: process.env.ADMIN_SETUP_TOKEN,
    }, { status: 401 });
  }

  // Step 2: Check database access
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    return NextResponse.json({
      step: "db-connection",
      error: e instanceof Error ? e.message : String(e),
    }, { status: 500 });
  }

  // Step 3: Check if Admin table exists / has records
  let existing: any = null;
  try {
    existing = await prisma.admin.findFirst();
  } catch (e) {
    return NextResponse.json({
      step: "admin-table",
      error: e instanceof Error ? e.message : String(e),
      hint: "The Admin table likely does not exist in the database. prisma db push may not have run.",
    }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({
      step: "already-exists",
      error: "An admin already exists. Setup can only run once.",
    }, { status: 409 });
  }

  // Step 4: Gather params
  const email = request.nextUrl.searchParams.get("email");
  const phone = request.nextUrl.searchParams.get("phone");
  const password = request.nextUrl.searchParams.get("password");
  const fullName = request.nextUrl.searchParams.get("name") || "Administrator";

  if (!email || !phone || !password) {
    return NextResponse.json({
      step: "params-check",
      error: "Token and database are OK. Now add email, phone, and password to the URL.",
    }, { status: 400 });
  }

  // Step 5: Hash password
  let passwordHash: string;
  try {
    passwordHash = await hashPassword(password);
  } catch (e) {
    return NextResponse.json({
      step: "password-hash",
      error: e instanceof Error ? e.message : String(e),
      hint: "bcryptjs may not have installed correctly.",
    }, { status: 500 });
  }

  // Step 6: Create admin
  try {
    const admin = await prisma.admin.create({
      data: { email, phone, passwordHash, fullName },
    });
    return NextResponse.json({
      success: true,
      message: "Admin account created. You can now log in.",
      adminId: admin.id,
    });
  } catch (e) {
    return NextResponse.json({
      step: "admin-create",
      error: e instanceof Error ? e.message : String(e),
    }, { status: 500 });
  }
}
