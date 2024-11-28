import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json([]);
    }

    const groups = await prisma.group.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        maxMembers: true,
        contributionAmount: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      take: 5,
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("[GROUPS_SEARCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
