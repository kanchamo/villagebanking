import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all groups where the user is a member
    const userGroups = await prisma.member.findMany({
      where: {
        userId,
      },
      select: {
        groupId: true,
      },
    });

    const groupIds = userGroups.map((group) => group.groupId);

    // Get all meetings for these groups
    const meetings = await prisma.meeting.findMany({
      where: {
        groupId: {
          in: groupIds,
        },
      },
      include: {
        group: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("[MEETINGS_GET] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
