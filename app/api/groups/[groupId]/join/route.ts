import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// POST /api/groups/[groupId]/join
export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user already has a pending request
    const existingRequest = await prisma.joinRequest.findFirst({
      where: {
        userId,
        groupId: params.groupId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return new NextResponse("Join request already exists", { status: 400 });
    }

    // Get the group and check if it exists
    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
      include: {
        _count: { select: { members: true } },
      },
    });

    if (!group) {
      return new NextResponse("Group not found", { status: 404 });
    }

    // Check if group is full
    if (group._count.members >= group.maxMembers) {
      return new NextResponse("Group is full", { status: 400 });
    }

    // Create join request
    const { message } = await req.json();
    const joinRequest = await prisma.joinRequest.create({
      data: {
        userId,
        groupId: params.groupId,
        message,
      },
    });

    // Create notification for group admin
    await prisma.notification.create({
      data: {
        type: "JOIN_REQUEST",
        userId: group.adminId,
        title: "New Join Request",
        message: `A user has requested to join your group "${group.name}"`,
        metadata: {
          groupId: params.groupId,
          requestId: joinRequest.id,
          requesterUserId: userId,
        },
      },
    });

    return NextResponse.json(joinRequest);
  } catch (error) {
    console.error("Error creating join request:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PUT /api/groups/[groupId]/join
export async function PUT(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { userId } = await auth();
    const { requestId, status, userId: requestUserId } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify admin permission
    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
    });

    if (!group || group.adminId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Update join request status
    const joinRequest = await prisma.joinRequest.update({
      where: { id: requestId },
      data: { status },
    });

    if (status === "APPROVED") {
      // Create new member
      await prisma.member.create({
        data: {
          userId: requestUserId,
          groupId: params.groupId,
        },
      });

      // Notify user of approval
      await prisma.notification.create({
        data: {
          type: "JOIN_REQUEST_APPROVED",
          userId: requestUserId,
          title: "Join Request Approved",
          message: `Your request to join "${group.name}" has been approved`,
          metadata: {
            groupId: params.groupId,
            requestId,
          },
        },
      });
    } else if (status === "REJECTED") {
      // Notify user of rejection
      await prisma.notification.create({
        data: {
          type: "JOIN_REQUEST_REJECTED",
          userId: requestUserId,
          title: "Join Request Rejected",
          message: `Your request to join "${group.name}" has been rejected`,
          metadata: {
            groupId: params.groupId,
            requestId,
          },
        },
      });
    }

    return NextResponse.json(joinRequest);
  } catch (error) {
    console.error("Error updating join request:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
