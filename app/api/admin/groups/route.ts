import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function GET() {
  const session = await getCurrentAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groups = await prisma.group.findMany({
    orderBy: { contributionAmount: "asc" },
  });

  const withCounts = await Promise.all(
    groups.map(async (g) => {
      const count = await prisma.member.count({
        where: { groupId: g.id, status: "ACTIVE" },
      });
      return {
        id: g.id,
        contributionAmount: g.contributionAmount.toString(),
        maxMembers: g.maxMembers,
        currentMembers: count,
        availableSlots: g.maxMembers - count,
      };
    })
  );

  return NextResponse.json({ groups: withCounts });
}
