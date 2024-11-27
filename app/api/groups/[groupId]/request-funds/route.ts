import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const requestSchema = z.object({
  type: z.enum(["LOAN", "PAYOUT"]),
  amount: z.number().positive(),
  reason: z.string().min(10),
});

export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = requestSchema.parse(body);

    // Find member record
    const member = await prisma.member.findFirst({
      where: {
        groupId: params.groupId,
        userId: userId,
      },
      include: {
        group: true,
      },
    });

    if (!member) {
      return new NextResponse("Member not found", { status: 404 });
    }

    // Validate request amount
    if (validatedData.type === "LOAN" && validatedData.amount > member.totalSavings * 2) {
      return new NextResponse(
        "Loan amount cannot exceed twice your total contributions",
        { status: 400 }
      );
    }

    if (validatedData.type === "PAYOUT" && validatedData.amount > member.totalSavings) {
      return new NextResponse(
        "Payout amount cannot exceed your total contributions",
        { status: 400 }
      );
    }

    // Create request in database
    const request = await prisma.fundRequest.create({
      data: {
        type: validatedData.type,
        amount: validatedData.amount,
        reason: validatedData.reason,
        status: "PENDING",
        memberId: member.id,
        groupId: params.groupId,
      },
    });

    return NextResponse.json(request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    console.error("Error processing fund request:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
