import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function GET() {
  const session = await getCurrentAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payments = await prisma.payment.findMany({
      orderBy: { submittedAt: "desc" },
      take: 100, // Last 100 payments
      include: {
        member: { select: { fullName: true, phone: true } },
        group: { select: { contributionAmount: true } },
        week: { select: { weekNumber: true } },
      },
    });

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        reference: p.reference,
        amount: Number(p.amount),
        method: p.paymentMethod,
        status: p.status,
        date: p.submittedAt.toISOString(),
        memberName: p.member.fullName,
        memberPhone: p.member.phone,
        groupAmount: Number(p.group.contributionAmount),
        weekNumber: p.week.weekNumber,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
