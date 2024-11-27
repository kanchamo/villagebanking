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

    const { amount, reason } = await req.json();

    // Get member details
    const member = await prisma.member.findFirst({
      where: {
        groupId: params.groupId,
        userId,
      },
      include: {
        group: true,
      },
    });

    if (!member) {
      return new NextResponse("Member not found", { status: 404 });
    }

    // Validate loan amount
    if (amount > member.totalSavings * 2) {
      return new NextResponse(
        "Loan amount cannot exceed twice your total contributions",
        { status: 400 }
      );
    }

    if (amount > member.group.totalSavings) {
      return new NextResponse(
        "Loan amount cannot exceed the group's total savings",
        { status: 400 }
      );
    }

    // Create loan request
    const loanRequest = await prisma.fundRequest.create({
      data: {
        type: "LOAN",
        amount,
        reason,
        groupId: params.groupId,
        memberId: member.id,
      },
    });

    // Create notifications for all group members
    await prisma.notification.createMany({
      data: member.group.members.map((m) => ({
        type: "LOAN_REQUEST",
        userId: m.userId,
        title: "New Loan Request",
        message: `${userId} has requested a loan of $${amount.toLocaleString()}`,
        metadata: {
          requestId: loanRequest.id,
          groupId: params.groupId,
          amount,
        },
      })),
    });

    return NextResponse.json(loanRequest);
  } catch (error) {
    console.error("Error creating loan request:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { requestId, approved } = await req.json();

    // Get member details
    const member = await prisma.member.findFirst({
      where: {
        groupId: params.groupId,
        userId,
      },
    });

    if (!member) {
      return new NextResponse("Member not found", { status: 404 });
    }

    // Create approval record
    const approval = await prisma.requestApproval.create({
      data: {
        approved,
        requestId,
        memberId: member.id,
      },
    });

    // Check if we have enough approvals
    const request = await prisma.fundRequest.findUnique({
      where: { id: requestId },
      include: {
        approvals: true,
        group: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!request) {
      return new NextResponse("Request not found", { status: 404 });
    }

    const approvalCount = request.approvals.filter((a) => a.approved).length;
    const requiredApprovals = Math.ceil(request.group.members.length * 0.5);

    if (approvalCount >= requiredApprovals) {
      // Update request status
      await prisma.fundRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" },
      });

      // Create notification for requester
      await prisma.notification.create({
        data: {
          type: "LOAN_APPROVED",
          userId: request.member.userId,
          title: "Loan Request Approved",
          message: `Your loan request for $${request.amount.toLocaleString()} has been approved`,
          metadata: {
            requestId,
            groupId: params.groupId,
            amount: request.amount,
          },
        },
      });
    }

    return NextResponse.json(approval);
  } catch (error) {
    console.error("Error processing loan approval:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
