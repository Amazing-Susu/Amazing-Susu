import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getCurrentAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing member id" }, { status: 400 });
  }

  try {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        group: { select: { id: true, contributionAmount: true, maxMembers: true } },
        payments: { orderBy: { submittedAt: "desc" }, take: 50 },
        payouts: { orderBy: { createdAt: "desc" }, take: 10 },
        notes: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const contributionAmount = Number(member.group.contributionAmount);
    const expectedPayout = 20 * contributionAmount - 50;

    return NextResponse.json({
      member: {
        id: member.id,
        fullName: member.fullName,
        phone: member.phone,
        whatsappNumber: member.whatsappNumber,
        dateOfBirth: member.dateOfBirth.toISOString(),
        address: member.address,
        emergencyContact: member.emergencyContact,
        status: member.status,
        preferredPayoutWeek: member.preferredPayoutWeek,
        joinedAt: member.joinedAt.toISOString(),
        group: {
          id: member.group.id,
          contributionAmount: member.group.contributionAmount.toString(),
          maxMembers: member.group.maxMembers,
        },
        expectedPayout,
        payments: member.payments.map((p) => ({
          id: p.id,
          reference: p.reference,
          amount: p.amount.toString(),
          method: p.paymentMethod,
          status: p.status,
          paymentDate: p.paymentDate.toISOString(),
          rejectionReason: p.rejectionReason,
        })),
        payouts: member.payouts.map((p) => ({
          id: p.id,
          expectedAmount: p.expectedAmount.toString(),
          actualAmount: p.actualAmount?.toString() || null,
          status: p.status,
          paidAt: p.paidAt?.toISOString() || null,
        })),
        notes: member.notes.map((n) => ({
          id: n.id,
          note: n.note,
          createdAt: n.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Member detail error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch member" },
      { status: 500 }
    );
  }
}
