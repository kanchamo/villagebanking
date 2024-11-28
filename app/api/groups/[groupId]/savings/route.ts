import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    console.log('1. Starting savings update');
    const { userId } = await auth();
    if (!userId) {
      console.log('Error: No userId found');
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify admin status
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

    const { amount, operation } = await req.json();
    console.log('2. Update details:', { amount, operation, groupId: params.groupId });

    if (typeof amount !== 'number' || !['increment', 'decrement'].includes(operation)) {
      console.log('Error: Invalid parameters:', { amount, operation });
      return new NextResponse(
        "Invalid parameters. Amount must be a number and operation must be 'increment' or 'decrement'",
        { status: 400 }
      );
    }

    // Update group savings
    const updatedGroup = await prisma.group.update({
      where: { id: params.groupId },
      data: {
        totalSavings: {
          [operation]: amount,
        },
      },
    });

    console.log('3. Group updated:', updatedGroup);
    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Error updating group savings:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
