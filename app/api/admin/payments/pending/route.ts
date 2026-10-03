import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function GET() {
  const session = await getCurrentAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payments = await prisma.payment.findMany({
    where: { status: "PENDING" },
    orderBy: { submittedAt: "asc" },
    include: {
      member: { select: { id: true, fullName: true, phone: true } },
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
      submittedAt: p.submittedAt.toISOString(),
      paymentDate: p.paymentDate.toISOString(),
      transactionId: p.transactionId,
      memberId: p.member.id,
      memberName: p.member.fullName,
      memberPhone: p.member.phone,
      groupAmount: Number(p.group.contributionAmount),
      weekNumber: p.week.weekNumber,
    })),
  });
}
