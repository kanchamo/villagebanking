import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// Function to schedule monthly payouts
async function scheduleMonthlyPayout(groupId: string) {
  const now = new Date();
  const nextPayoutDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    20, // Schedule for the 20th of the month
    12, // At noon
    0,
    0
  );

  // If we're past the 20th, schedule for next month
  if (now.getDate() > 20) {
    nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        where: { status: "ACTIVE" },
      },
    },
  });

  if (!group) {
    throw new Error("Group not found");
  }

  // Calculate total contributions and member percentages
  const totalSavings = group.totalSavings;
  const memberPercentages = group.members.map((member) => ({
    memberId: member.id,
    percentage: (member.totalSavings / totalSavings) * 100,
    amount: (member.totalSavings / totalSavings) * totalSavings,
  }));

  // Create payout schedule
  const schedule = await prisma.payoutSchedule.create({
    data: {
      date: nextPayoutDate,
      totalAmount: totalSavings,
      groupId,
      payouts: {
        create: memberPercentages.map((mp) => ({
          amount: mp.amount,
          percentage: mp.percentage,
          memberId: mp.memberId,
        })),
      },
    },
    include: {
      payouts: {
        include: {
          member: true,
        },
      },
    },
  });

  // Create notifications for all members
  await prisma.notification.createMany({
    data: group.members.map((member) => {
      const memberPayout = memberPercentages.find((mp) => mp.memberId === member.id);
      return {
        type: "PAYOUT_SCHEDULED",
        userId: member.userId,
        title: "Monthly Payout Scheduled",
        message: `Your scheduled payout of $${memberPayout?.amount.toLocaleString()} (${memberPayout?.percentage.toFixed(2)}%) is scheduled for ${nextPayoutDate.toLocaleDateString()}`,
        metadata: {
          scheduleId: schedule.id,
          groupId,
          amount: memberPayout?.amount,
          percentage: memberPayout?.percentage,
        },
      };
    }),
  });

  return schedule;
}

// Endpoint to manually trigger payout scheduling (admin only)
export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is admin
    const member = await prisma.member.findFirst({
      where: {
        groupId: params.groupId,
        userId,
        isAdmin: true,
      },
    });

    if (!member) {
      return new NextResponse("Unauthorized - Admin only", { status: 403 });
    }

    const schedule = await scheduleMonthlyPayout(params.groupId);
    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Error scheduling payout:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Endpoint to process scheduled payouts
export async function PUT(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is admin
    const member = await prisma.member.findFirst({
      where: {
        groupId: params.groupId,
        userId,
        isAdmin: true,
      },
    });

    if (!member) {
      return new NextResponse("Unauthorized - Admin only", { status: 403 });
    }

    const { scheduleId } = await req.json();

    // Get schedule with payouts
    const schedule = await prisma.payoutSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        payouts: {
          include: {
            member: true,
          },
        },
      },
    });

    if (!schedule) {
      return new NextResponse("Schedule not found", { status: 404 });
    }

    // Update schedule and payouts status
    await prisma.$transaction([
      prisma.payoutSchedule.update({
        where: { id: scheduleId },
        data: { status: "COMPLETED" },
      }),
      ...schedule.payouts.map((payout) =>
        prisma.memberPayout.update({
          where: { id: payout.id },
          data: { status: "COMPLETED" },
        })
      ),
      // Create notifications for all members
      prisma.notification.createMany({
        data: schedule.payouts.map((payout) => ({
          type: "PAYOUT_COMPLETED",
          userId: payout.member.userId,
          title: "Payout Completed",
          message: `Your payout of $${payout.amount.toLocaleString()} has been processed`,
          metadata: {
            scheduleId,
            groupId: params.groupId,
            amount: payout.amount,
            percentage: payout.percentage,
          },
        })),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing payout:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
