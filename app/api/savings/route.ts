import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const savingsGoalSchema = z.object({
  savingsGoal: z.number().min(0),
});

export async function GET() {
  console.log("[SAVINGS_GET] Starting request");
  try {
    const { userId } = await auth();
    console.log("[SAVINGS_GET] Auth check completed, userId:", userId);
    
    if (!userId) {
      console.log("[SAVINGS_GET] No userId found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user's data including savings goal
    console.log("[SAVINGS_GET] Fetching user data for userId:", userId);
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });
    console.log("[SAVINGS_GET] User data fetch result:", user ? "Found" : "Not found");

    // If user doesn't exist, create them with their Clerk ID
    if (!user) {
      console.log("[SAVINGS_GET] Creating new user with Clerk ID:", userId);
      try {
        user = await prisma.user.create({
          data: {
            id: userId,
            savingsGoal: 0,
          },
        });
        console.log("[SAVINGS_GET] New user created successfully with ID:", user.id);
      } catch (createError) {
        console.error("[SAVINGS_GET] Error creating user:", createError);
        throw new Error("Failed to create user record");
      }
    }

    // Get all groups where user is a member
    console.log("[SAVINGS_GET] Fetching user memberships");
    const userMemberships = await prisma.member.findMany({
      where: { userId },
      include: {
        group: true,
        contributions: true,
      },
    });
    console.log("[SAVINGS_GET] Found", userMemberships.length, "group memberships");

    // Calculate total savings across all groups
    console.log("[SAVINGS_GET] Calculating total savings");
    const totalSavings = userMemberships.reduce((total, membership) => {
      return total + membership.totalSavings;
    }, 0);
    console.log("[SAVINGS_GET] Total savings calculated:", totalSavings);

    // Get recent contributions
    console.log("[SAVINGS_GET] Fetching recent contributions");
    const recentContributions = await prisma.contribution.findMany({
      where: {
        memberId: {
          in: userMemberships.map(m => m.id)
        }
      },
      include: {
        group: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: 5
    });
    console.log("[SAVINGS_GET] Found", recentContributions.length, "recent contributions");

    // Get savings breakdown by group
    console.log("[SAVINGS_GET] Creating group savings breakdown");
    const groupSavings = userMemberships.map(membership => ({
      groupId: membership.groupId,
      groupName: membership.group.name,
      totalSavings: membership.totalSavings,
      contributionAmount: membership.group.contributionAmount,
    }));
    console.log("[SAVINGS_GET] Created breakdown for", groupSavings.length, "groups");

    const response = {
      savingsGoal: user.savingsGoal,
      totalSavings,
      groupSavings,
      recentContributions,
    };
    console.log("[SAVINGS_GET] Preparing response:", {
      savingsGoal: response.savingsGoal,
      totalSavings: response.totalSavings,
      groupCount: response.groupSavings.length,
      contributionCount: response.recentContributions.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("[SAVINGS_GET] Error details:", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });

    if (error instanceof z.ZodError) {
      console.error("[SAVINGS_GET] Validation error:", error.errors);
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      console.error("[SAVINGS_GET] Application error:", error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.error("[SAVINGS_GET] Unknown error type:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  console.log("[SAVINGS_PUT] Starting request");
  try {
    const { userId } = await auth();
    console.log("[SAVINGS_PUT] Auth check completed, userId:", userId);

    if (!userId) {
      console.log("[SAVINGS_PUT] No userId found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log("[SAVINGS_PUT] Request body:", body);

    const { savingsGoal } = savingsGoalSchema.parse(body);
    console.log("[SAVINGS_PUT] Validated savings goal:", savingsGoal);

    console.log("[SAVINGS_PUT] Upserting user record with Clerk ID:", userId);
    const user = await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        savingsGoal,
      },
      update: {
        savingsGoal,
      },
    });
    console.log("[SAVINGS_PUT] User record upserted successfully");

    return NextResponse.json(user);
  } catch (error) {
    console.error("[SAVINGS_PUT] Error details:", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });

    if (error instanceof z.ZodError) {
      console.error("[SAVINGS_PUT] Validation error:", error.errors);
      return NextResponse.json(
        { error: "Invalid savings goal", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      console.error("[SAVINGS_PUT] Application error:", error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.error("[SAVINGS_PUT] Unknown error type:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
