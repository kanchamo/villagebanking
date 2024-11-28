import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const meetingSchema = z.object({
  title: z.string().min(1),
  date: z.string(),
  time: z.string(),
  link: z.string().url().optional(),
  location: z.string().optional(),
  agenda: z.array(z.string()),
});

export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    console.log("[MEETINGS_POST] Starting request");
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const groupId = params.groupId;
    console.log("[MEETINGS_POST] GroupId:", groupId);

    // Check if user is admin of the group
    const membership = await prisma.member.findFirst({
      where: {
        userId,
        groupId,
        group: {
          adminId: userId
        }
      },
    });
    console.log("[MEETINGS_POST] Membership check:", !!membership);

    if (!membership) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log("[MEETINGS_POST] Request body:", body);

    const validatedData = meetingSchema.parse(body);
    console.log("[MEETINGS_POST] Validated data:", validatedData);

    // Create the meeting
    const meeting = await prisma.meeting.create({
      data: {
        groupId,
        ...validatedData,
        date: new Date(validatedData.date),
      },
    });
    console.log("[MEETINGS_POST] Created meeting:", meeting);

    return NextResponse.json({ success: true, meeting });
  } catch (error) {
    console.error("[MEETINGS_POST] Error details:", error);
    if (error instanceof z.ZodError) {
      console.error("[MEETINGS_POST] Validation error:", error.errors);
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    console.log("[MEETINGS_GET] Starting request");
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const groupId = params.groupId;
    console.log("[MEETINGS_GET] GroupId:", groupId);

    // Check if user is a member of the group
    const membership = await prisma.member.findFirst({
      where: {
        userId,
        groupId,
      },
    });
    console.log("[MEETINGS_GET] Membership check:", !!membership);

    if (!membership) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all meetings for the group
    const meetings = await prisma.meeting.findMany({
      where: { groupId },
      orderBy: { date: "desc" },
    });
    console.log("[MEETINGS_GET] Found meetings:", meetings);

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("[MEETINGS_GET] Error details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
