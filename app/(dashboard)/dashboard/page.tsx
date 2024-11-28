import { Card } from "@/components/ui/card";
import { Users, PiggyBank, Calendar, TrendingUp } from "lucide-react";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { formatCurrency } from "@/lib/utils";

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

  return {
    totalMembers,
    totalSavings,
    activeGroups,
    activeLoans,
    upcomingMeetings
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
          <p className="text-sm text-gray-500">Coming soon...</p>
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
