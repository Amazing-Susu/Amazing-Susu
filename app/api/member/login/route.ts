import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { error: "Phone and password are required" },
        { status: 400 }
      );
    }

    const member = await prisma.member.findUnique({
      where: { phone },
      include: { group: true },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Invalid phone or password" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, member.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid phone or password" },
        { status: 401 }
      );
    }

    const token = await createSession({ id: member.id, role: "member" });

    const response = NextResponse.json({
      success: true,
      member: {
        id: member.id,
        fullName: member.fullName,
        phone: member.phone,
        groupAmount: member.group.contributionAmount.toString(),
      },
    });

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Member login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
