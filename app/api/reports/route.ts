import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const reports = await prisma.report.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("[REPORTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { type } = body;

    if (!type) {
      return new NextResponse("Type is required", { status: 400 });
    }

    // Generate report data based on type
    let reportData;
    switch (type) {
      case "financial":
        reportData = await generateFinancialReport(userId);
        break;
      case "activity":
        reportData = await generateActivityReport(userId);
        break;
      case "member":
        reportData = await generateMemberReport(userId);
        break;
      default:
        return new NextResponse("Invalid report type", { status: 400 });
    }

    const report = await prisma.$transaction(async (tx) => {
      return await tx.report.create({
        data: {
          userId,
          type,
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
          description: getReportDescription(type),
          data: reportData,
        },
      });
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("[REPORTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

async function generateFinancialReport(userId: string) {
  const member = await prisma.member.findFirst({
    where: { userId },
    include: { 
      contributions: true,
      group: true,
      loans: true 
    },
  });

  if (!member) {
    return {
      totalSavings: 0,
      totalLoans: 0,
      savingsBreakdown: [],
      loansBreakdown: [],
    };
  }

  const contributions = member.contributions;
  const loans = member.loans;

  return {
    totalSavings: member.totalSavings,
    totalLoans: loans.reduce((acc, curr) => acc + curr.amount, 0),
    savingsBreakdown: contributions.map((c) => ({
      groupName: c.group.name,
      amount: c.amount,
      date: c.date,
    })),
    loansBreakdown: loans.map((l) => ({
      groupName: l.group.name,
      amount: l.amount,
      status: l.status,
      date: l.createdAt,
    })),
  };
}

async function generateActivityReport(userId: string) {
  const meetings = await prisma.meeting.findMany({
    where: {
      group: {
        members: {
          some: {
            userId: userId
          }
        }
      }
    },
    include: { group: true },
    orderBy: { date: "desc" },
    take: 10,
  });

  const transactions = await prisma.contribution.findMany({
    where: { 
      member: {
        userId: userId
      }
    },
    include: { group: true },
    orderBy: { date: "desc" },
    take: 10,
  });

  return {
    recentMeetings: meetings.map((m) => ({
      groupName: m.group.name,
      date: m.date,
      attendees: m.attendees,
    })),
    recentTransactions: transactions.map((t) => ({
      groupName: t.group.name,
      type: "CONTRIBUTION",
      amount: t.amount,
      date: t.date,
    })),
  };
}

async function generateMemberReport(userId: string) {
  const members = await prisma.member.findMany({
    where: { userId },
    include: { group: true },
  });

  return {
    totalMembers: members.length,
    membersByGroup: members.reduce((acc, curr) => {
      const groupName = curr.group.name;
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push({
        name: curr.name,
        role: curr.role,
        joinedAt: curr.createdAt,
      });
      return acc;
    }, {} as Record<string, any[]>),
  };
}

function getReportDescription(type: string): string {
  switch (type) {
    case "financial":
      return "Overview of group savings, loans, and repayments";
    case "activity":
      return "Member participation and contribution statistics";
    case "member":
      return "Current status and history of all group members";
    default:
      return "Generated report";
  }
}
