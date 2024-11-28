import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    console.log("[CONTRIBUTE] Starting contribution process");
    const { userId } = await auth();

    if (!userId) {
      console.log("[CONTRIBUTE] No userId found");
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.log("[CONTRIBUTE] User authenticated:", userId);

    const body = await req.json();
    const { amount, notes } = body;
    console.log("[CONTRIBUTE] Contribution details:", { amount, notes, groupId: params.groupId });

    // Find the member record
    console.log("[CONTRIBUTE] Finding member record");
    const member = await prisma.member.findFirst({
      where: {
        groupId: params.groupId,
        userId: userId,
      },
      include: {
        group: true,
      },
    });
    console.log("[CONTRIBUTE] Member found:", member ? {
      memberId: member.id,
      currentSavings: member.totalSavings,
      groupCurrentSavings: member.group.totalSavings,
    } : "Not found");

    if (!member) {
      return new NextResponse("Member not found", { status: 404 });
    }

    // Create the contribution and update related records in a transaction
    console.log("[CONTRIBUTE] Starting transaction");
    const result = await prisma.$transaction(async (tx) => {
      // Create the contribution
      console.log("[CONTRIBUTE] Creating contribution record");
      const contribution = await tx.contribution.create({
        data: {
          amount,
          notes,
          memberId: member.id,
          groupId: params.groupId,
          status: "COMPLETED",
        },
      });
      console.log("[CONTRIBUTE] Contribution created:", contribution);

      // Update member's total savings and last payment
      console.log("[CONTRIBUTE] Updating member savings");
      const updatedMember = await tx.member.update({
        where: { id: member.id },
        data: {
          totalSavings: { increment: amount },
          lastPayment: new Date(),
        },
      });
      console.log("[CONTRIBUTE] Member savings updated:", {
        oldSavings: member.totalSavings,
        newSavings: updatedMember.totalSavings,
      });

      // Update group's total savings
      console.log("[CONTRIBUTE] Updating group savings");
      const updatedGroup = await tx.group.update({
        where: { id: params.groupId },
        data: {
          totalSavings: { increment: amount },
        },
      });
      console.log("[CONTRIBUTE] Group savings updated:", {
        oldSavings: member.group.totalSavings,
        newSavings: updatedGroup.totalSavings,
      });

      return contribution;
    });

    console.log("[CONTRIBUTE] Transaction completed successfully");
    return NextResponse.json(result);
  } catch (error) {
    console.error("[CONTRIBUTE] Error processing contribution:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
