import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { LoanStatus, RequestType } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const loans = await prisma.loan.findMany({
      where: {
        groupId: params.groupId,
      },
      include: {
        borrower: true,
        payments: true,
      },
    });

    return NextResponse.json(loans);
  } catch (error) {
    console.error("Error fetching loans:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

interface LoanRequest {
  amount: number;
  reason: string;
  duration: 'week' | 'twoWeeks' | 'month';
  interestRate?: number;
}

export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { amount, reason, duration, interestRate = 0.05 }: LoanRequest = await req.json();

    // Calculate due date based on duration
    const dueDate = new Date();
    switch (duration) {
      case 'week':
        dueDate.setDate(dueDate.getDate() + 7);
        break;
      case 'twoWeeks':
        dueDate.setDate(dueDate.getDate() + 14);
        break;
      case 'month':
        dueDate.setMonth(dueDate.getMonth() + 1);
        break;
    }

    // Get member details
    const member = await prisma.member.findFirst({
      where: {
        groupId: params.groupId,
        userId,
      },
      include: {
        group: {
          include: {
            members: true,
          },
        },
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
        type: RequestType.LOAN,
        amount,
        reason,
        groupId: params.groupId,
        memberId: member.id,
      },
    });

    // Create loan record
    const loan = await prisma.loan.create({
      data: {
        amount,
        dueDate,
        interest: amount * interestRate,
        groupId: params.groupId,
        borrowerId: member.id,
        requestId: loanRequest.id,
        status: LoanStatus.ACTIVE,
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
          loanId: loan.id,
          groupId: params.groupId,
          amount,
        },
      })),
    });

    return NextResponse.json({ loanRequest, loan });
  } catch (error) {
    console.error("Error creating loan request:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

interface ApprovalRequest {
  requestId: string;
  approved: boolean;
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

    const { requestId, approved }: ApprovalRequest = await req.json();

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
        loan: true,
        member: true,
      },
    });

    if (!request) {
      return new NextResponse("Request not found", { status: 404 });
    }

    const approvalCount = request.approvals.filter((a) => a.approved).length;
    const requiredApprovals = Math.ceil(request.group.members.length * 0.5);

    if (approvalCount >= requiredApprovals) {
      // Update request status and loan status
      await prisma.$transaction([
        prisma.fundRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED" },
        }),
        prisma.loan.update({
          where: { id: request.loan?.id },
          data: { status: LoanStatus.ACTIVE },
        }),
      ]);

      if (request.member) {
        // Create notification for requester
        await prisma.notification.create({
          data: {
            type: "LOAN_APPROVED",
            userId: request.member.userId,
            title: "Loan Request Approved",
            message: `Your loan request for $${request.amount.toLocaleString()} has been approved`,
            metadata: {
              requestId,
              loanId: request.loan?.id,
              groupId: params.groupId,
              amount: request.amount,
            },
          },
        });
      }
    }

    return NextResponse.json(approval);
  } catch (error) {
    console.error("Error processing loan approval:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
