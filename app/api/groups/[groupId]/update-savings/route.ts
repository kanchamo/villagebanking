import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    console.log('1. Starting update-savings PATCH request');
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

    const { amount } = await req.json();
    console.log('5. Request body:', { amount });

    if (typeof amount !== 'number') {
      console.log('Error: Invalid amount provided:', amount);
      return new NextResponse("Amount must be a number", { status: 400 });
    }

    console.log('6. Updating group savings');
    const updatedGroup = await prisma.group.update({
      where: { id: params.groupId },
      data: {
        totalSavings: {
          decrement: amount,
        },
      },
    });
    console.log('7. Group savings updated:', updatedGroup);

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Error in update-savings PATCH:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
