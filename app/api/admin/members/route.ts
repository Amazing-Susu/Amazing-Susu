import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function GET() {
  const session = await getCurrentAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const members = await prisma.member.findMany({
      include: {
        group: {
          select: { contributionAmount: true, maxMembers: true },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const serialized = members.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      phone: m.phone,
      groupAmount: m.group.contributionAmount.toString(),
      status: m.status,
      preferredPayoutWeek: m.preferredPayoutWeek,
      joinedAt: m.joinedAt.toISOString(),
    }));

    return NextResponse.json({ members: serialized });
  } catch (error) {
    console.error("Fetch members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
