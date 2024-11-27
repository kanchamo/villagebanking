import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const group = await prisma.group.findUnique({
      where: {
        id: params.groupId,
      },
      include: {
        members: true,
        contributions: {
          orderBy: {
            date: 'desc'
          },
          include: {
            member: true
          }
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!group) {
      return new NextResponse("Group not found", { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error fetching group:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
