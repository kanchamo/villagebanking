import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// This endpoint should be called by a cron job at midnight on the 20th of each month
export async function GET() {
  try {
    // Get all active groups
    const groups = await prisma.group.findMany({
      where: {
        totalSavings: { gt: 0 },
      },
    });

    const results = await Promise.all(
      groups.map(async (group) => {
        try {
          const now = new Date();
          const payoutDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            20,
            12,
            0,
            0
          );

          // Get active members
          const members = await prisma.member.findMany({
            where: {
              groupId: group.id,
              status: "ACTIVE",
            },
          });

          // Calculate member percentages
          const memberPercentages = members.map((member) => ({
            memberId: member.id,
            percentage: (member.totalSavings / group.totalSavings) * 100,
            amount: (member.totalSavings / group.totalSavings) * group.totalSavings,
          }));

          // Create payout schedule
          const schedule = await prisma.payoutSchedule.create({
            data: {
              date: payoutDate,
              totalAmount: group.totalSavings,
              groupId: group.id,
              payouts: {
                create: memberPercentages.map((mp) => ({
                  amount: mp.amount,
                  percentage: mp.percentage,
                  memberId: mp.memberId,
                })),
              },
            },
          });

          // Notify members
          await prisma.notification.createMany({
            data: members.map((member) => {
              const payout = memberPercentages.find(
                (mp) => mp.memberId === member.id
              );
              return {
                type: "PAYOUT_SCHEDULED",
                userId: member.userId,
                title: "Monthly Payout Scheduled",
                message: `Your payout of $${payout?.amount.toLocaleString()} (${payout?.percentage.toFixed(
                  2
                )}%) is scheduled for ${payoutDate.toLocaleDateString()}`,
                metadata: {
                  scheduleId: schedule.id,
                  groupId: group.id,
                  amount: payout?.amount,
                  percentage: payout?.percentage,
                },
              };
            }),
          });

          return {
            groupId: group.id,
            status: "success",
            schedule,
          };
        } catch (error) {
          console.error(`Error scheduling payout for group ${group.id}:`, error);
          return {
            groupId: group.id,
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error in cron job:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
