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

    const { amount, reason, type } = await req.json();

    // Get member and group details
    const member = await prisma.member.findFirst({
      where: {
        groupId: params.groupId,
        userId,
      },
      include: {
        group: {
          include: {
            members: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
    });

    if (!member) {
      return new NextResponse("Member not found", { status: 404 });
    }

    // Validate request amount
    if (amount > member.totalSavings * 2) {
      return new NextResponse(
        "Request amount cannot exceed twice your total contributions",
        { status: 400 }
      );
    }

    if (amount > member.group.totalSavings) {
      return new NextResponse(
        "Request amount cannot exceed the group's total savings",
        { status: 400 }
      );
    }

    // Create fund request
    const fundRequest = await prisma.fundRequest.create({
      data: {
        type,
        amount,
        reason,
        groupId: params.groupId,
        memberId: member.id,
      },
      include: {
        member: true,
      },
    });

    // Create notifications for all group members
    await prisma.notification.createMany({
      data: member.group.members.map((m) => ({
        type: "FUND_REQUEST",
        userId: m.userId,
        title: `New ${type} Request`,
        message: `${userId} has requested a ${type.toLowerCase()} of $${amount.toLocaleString()}. Please review and vote.`,
        metadata: {
          requestId: fundRequest.id,
          groupId: params.groupId,
          amount,
          type,
        },
      })),
    });

    return NextResponse.json(fundRequest);
  } catch (error) {
    console.error("Error creating fund request:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Get all fund requests for a group
export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const requests = await prisma.fundRequest.findMany({
      where: {
        groupId: params.groupId,
      },
      include: {
        member: true,
        approvals: {
          include: {
            member: true,
          },
        },
        group: {
          include: {
            members: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate voting status for each request
    const requestsWithStatus = requests.map((request) => {
      const totalMembers = request.group.members.length;
      const requiredApprovals = Math.ceil(totalMembers * 0.5);
      const currentApprovals = request.approvals.filter((a) => a.approved).length;
      const approvalPercentage = (currentApprovals / totalMembers) * 100;

      return {
        ...request,
        votingStatus: {
          totalMembers,
          requiredApprovals,
          currentApprovals,
          approvalPercentage,
          hasVoted: request.approvals.some(
            (a) => a.member.userId === userId
          ),
          approved: currentApprovals >= requiredApprovals,
        },
      };
    });

    return NextResponse.json(requestsWithStatus);
  } catch (error) {
    console.error("Error fetching fund requests:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Vote on a fund request
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

    // Record the vote
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
            members: {
              where: { status: "ACTIVE" },
            },
          },
        },
        member: true,
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

      // Notify the requester
      await prisma.notification.create({
        data: {
          type: "REQUEST_APPROVED",
          userId: request.member.userId,
          title: `${request.type} Request Approved`,
          message: `Your ${request.type.toLowerCase()} request for $${request.amount.toLocaleString()} has been approved by the group`,
          metadata: {
            requestId,
            groupId: params.groupId,
            amount: request.amount,
            type: request.type,
          },
        },
      });

      // Notify admin(s)
      const admins = request.group.members.filter((m) => m.isAdmin);
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            type: "ADMIN_ACTION_REQUIRED",
            userId: admin.userId,
            title: `Action Required: ${request.type} Payout`,
            message: `A ${request.type.toLowerCase()} request for $${request.amount.toLocaleString()} has been approved and requires your action`,
            metadata: {
              requestId,
              groupId: params.groupId,
              amount: request.amount,
              type: request.type,
            },
          })),
        });
      }
    }

    return NextResponse.json({
      approval,
      status: approvalCount >= requiredApprovals ? "APPROVED" : "PENDING",
    });
  } catch (error) {
    console.error("Error processing vote:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Process approved request (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    console.log('1. Starting PATCH request processing');
    const { userId } = await auth();
    if (!userId) {
      console.log('Error: No userId found');
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.log('2. UserId found:', userId);

    // Verify admin status
    console.log('3. Verifying admin status for groupId:', params.groupId);
    const admin = await prisma.member.findFirst({
      where: {
        groupId: params.groupId,
        userId,
        isAdmin: true,
      },
    });

    if (!admin) {
      console.log('Error: User is not an admin');
      return new NextResponse("Unauthorized - Admin only", { status: 403 });
    }
    console.log('4. Admin verification successful');

    const body = await req.json();
    console.log('5. Request body:', body);
    const { requestId } = body;

    if (!requestId) {
      console.log('Error: No requestId provided in body');
      return new NextResponse("Request ID is required", { status: 400 });
    }

    console.log('6. Finding fund request:', requestId);
    const request = await prisma.fundRequest.findUnique({
      where: { id: requestId },
      include: {
        member: true,
      },
    });

    console.log('7. Found request:', request);

    if (!request) {
      console.log('Error: Request not found');
      return new NextResponse("Request not found", { status: 404 });
    }

    if (request.status !== "APPROVED") {
      console.log('Error: Request status is not APPROVED:', request.status);
      return new NextResponse("Request must be approved first", { status: 400 });
    }

    console.log('8. Starting transaction');
    // Update request status to completed
    const updatedRequest = await prisma.fundRequest.update({
      where: { id: requestId },
      data: { status: "COMPLETED" },
      include: { member: true },
    });
    console.log('9. Request updated:', updatedRequest);

    // Update group savings for both loans and payouts
    console.log('10. Updating group savings for', request.type);
    try {
      const updatedGroup = await prisma.group.update({
        where: { id: params.groupId },
        data: {
          totalSavings: {
            decrement: request.amount // Both loans and payouts decrease total savings
          }
        }
      });
      console.log('11. Group savings updated successfully:', updatedGroup);
    } catch (error) {
      console.error('Error updating group savings:', error);
      return new NextResponse("Failed to update group savings", { status: 500 });
    }

    console.log('12. Creating notification');
    // Notify the requester
    await prisma.notification.create({
      data: {
        type: "REQUEST_COMPLETED",
        userId: request.member.userId,
        title: `${request.type} Processed`,
        message: `Your ${request.type.toLowerCase()} request for $${request.amount.toLocaleString()} has been processed`,
        metadata: {
          requestId,
          groupId: params.groupId,
          amount: request.amount,
          type: request.type,
        },
      },
    });
    console.log('13. Notification created');

    console.log('14. Sending response');
    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error in PATCH endpoint:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
