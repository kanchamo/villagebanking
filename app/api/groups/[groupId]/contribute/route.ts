import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { amount, notes } = body;

    // Find the member record
    const member = await prisma.member.findFirst({
      where: {
        groupId: params.groupId,
        userId: userId,
      },
    });

    if (!member) {
      return new NextResponse("Member not found", { status: 404 });
    }

    // Create the contribution and update related records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the contribution
      const contribution = await tx.contribution.create({
        data: {
          amount,
          notes,
          memberId: member.id,
          groupId: params.groupId,
          status: "COMPLETED",
        },
      });

      // Update member's total savings and last payment
      await tx.member.update({
        where: { id: member.id },
        data: {
          totalSavings: { increment: amount },
          lastPayment: new Date(),
        },
      });

      // Update group's total savings
      await tx.group.update({
        where: { id: params.groupId },
        data: {
          totalSavings: { increment: amount },
        },
      });

      return contribution;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing contribution:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
