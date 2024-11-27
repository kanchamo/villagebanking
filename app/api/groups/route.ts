import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  maxMembers: z.number().min(2),
  contributionAmount: z.number().min(0),
  rules: z.array(z.string()),
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = createGroupSchema.parse(body);

    const group = await prisma.group.create({
      data: {
        ...validatedData,
        adminId: userId,
        members: {
          create: {
            userId: userId,
            isAdmin: true,
          },
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    
    console.error("Error creating group:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}