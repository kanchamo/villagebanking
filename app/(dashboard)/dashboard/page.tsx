import { Card } from "@/components/ui/card";
import { Users, PiggyBank, Calendar, TrendingUp } from "lucide-react";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { formatCurrency } from "@/lib/utils";

type Activity = {
  id: string;
  type: 'CONTRIBUTION' | 'LOAN' | 'FUND_REQUEST';
  amount: number;
  date: Date;
  status: string;
  groupName: string;
  description: string;
}

async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) return null;

  const memberData = await prisma.member.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          members: true,
          loans: {
            where: {
              status: "ACTIVE"
            }
          },
          meetings: {
            where: {
              date: {
                gte: new Date()
              }
            },
            orderBy: {
              date: 'asc'
            },
            take: 5
          }
        }
      }
    }
  });

  // Calculate totals
  const totalMembers = memberData.reduce((acc, curr) => acc + curr.group.members.length, 0);
  const totalSavings = memberData.reduce((acc, curr) => acc + curr.totalSavings, 0);
  const activeGroups = memberData.length;
  const activeLoans = memberData.reduce((acc, curr) => acc + curr.group.loans.length, 0);
  
  // Get upcoming meetings
  const upcomingMeetings = memberData.flatMap(m => m.group.meetings).sort((a, b) => 
    a.date.getTime() - b.date.getTime()
  ).slice(0, 5);

  // Get recent activities
  const memberIds = memberData.map(m => m.id);
  const [recentContributions, recentLoans, recentFundRequests] = await Promise.all([
    prisma.contribution.findMany({
      where: { memberId: { in: memberIds } },
      include: { group: true },
      orderBy: { date: 'desc' },
      take: 5
    }),
    prisma.loan.findMany({
      where: { borrowerId: { in: memberIds } },
      include: { group: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.fundRequest.findMany({
      where: { memberId: { in: memberIds } },
      include: { group: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ]);

  const activities: Activity[] = [
    ...recentContributions.map(c => ({
      id: c.id,
      type: 'CONTRIBUTION' as const,
      amount: c.amount,
      date: c.date,
      status: c.status,
      groupName: c.group.name,
      description: `Contribution to ${c.group.name}`
    })),
    ...recentLoans.map(l => ({
      id: l.id,
      type: 'LOAN' as const,
      amount: l.amount,
      date: l.createdAt,
      status: l.status,
      groupName: l.group.name,
      description: `Loan from ${l.group.name}`
    })),
    ...recentFundRequests.map(f => ({
      id: f.id,
      type: 'FUND_REQUEST' as const,
      amount: f.amount,
      date: f.createdAt,
      status: f.status,
      groupName: f.group.name,
      description: `${f.type} request in ${f.group.name}`
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime())
   .slice(0, 10);

  return {
    totalMembers,
    totalSavings,
    activeGroups,
    activeLoans,
    upcomingMeetings,
    activities
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  
  if (!data) return <div>Please sign in to view dashboard</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-green-100 p-3">
              <Users className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <h3 className="text-2xl font-bold text-gray-900">{data.totalMembers}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-primary-100 p-3">
              <PiggyBank className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Savings</p>
              <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalSavings)}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-purple-100 p-3">
              <Calendar className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Groups</p>
              <h3 className="text-2xl font-bold text-gray-900">{data.activeGroups}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-yellow-100 p-3">
              <TrendingUp className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Loans</p>
              <h3 className="text-2xl font-bold text-gray-900">{data.activeLoans}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Recent Activities</h2>
          {data.activities.length > 0 ? (
            <div className="space-y-4">
              {data.activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h3 className="font-medium">{activity.description}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      activity.status === 'COMPLETED' || activity.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : activity.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {activity.status}
                    </span>
                    <p className="mt-1 font-medium">{formatCurrency(activity.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent activities</p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Upcoming Meetings</h2>
          {data.upcomingMeetings.length > 0 ? (
            <div className="space-y-4">
              {data.upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h3 className="font-medium">{meeting.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(meeting.date).toLocaleDateString()} at {meeting.time}
                    </p>
                  </div>
                  {meeting.location && (
                    <span className="text-sm text-gray-500">{meeting.location}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No upcoming meetings</p>
          )}
        </Card>
      </div>
    </div>
  );
}
