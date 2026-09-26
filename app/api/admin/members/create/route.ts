import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;

  if (p.get("token") !== process.env.ADMIN_SETUP_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const required = ["fullName", "phone", "ghanaCard", "dob", "address", "emergency", "password", "groupId"];
  const missing = required.filter((k) => !p.get(k));
  if (missing.length) {
    return NextResponse.json({ error: `Missing fields: ${missing.join(", ")}` }, { status: 400 });
  }

  try {
    const existing = await prisma.member.findFirst({
      where: { OR: [{ phone: p.get("phone")! }, { ghanaCardNumber: p.get("ghanaCard")! }] },
    });
    if (existing) {
      return NextResponse.json({ error: "Member with that phone or Ghana Card already exists" }, { status: 409 });
    }

    const group = await prisma.group.findUnique({ where: { id: p.get("groupId")! } });
    if (!group) {
      return NextResponse.json({ error: "Group not found. Use: grp-150, grp-200, grp-250, grp-300, grp-350, grp-500, grp-600, grp-700, or grp-1000" }, { status: 404 });
    }

    const passwordHash = await hashPassword(p.get("password")!);

    const member = await prisma.member.create({
      data: {
        fullName: p.get("fullName")!,
        phone: p.get("phone")!,
        whatsappNumber: p.get("whatsapp") || null,
        ghanaCardNumber: p.get("ghanaCard")!,
        dateOfBirth: new Date(p.get("dob")!),
        address: p.get("address")!,
        emergencyContact: p.get("emergency")!,
        passwordHash,
        groupId: p.get("groupId")!,
        preferredPayoutWeek: p.get("preferredWeek") ? Number(p.get("preferredWeek")) : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Member created. You can now log in at /member",
      member: { id: member.id, fullName: member.fullName, phone: member.phone, group: group.contributionAmount.toString() },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
