"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Users, PiggyBank, Calendar, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MakeContribution } from "@/app/components/MakeContribution";
import { RequestFunds } from "@/app/components/RequestFunds";
import { useAuth } from "@clerk/nextjs";

interface Contribution {
  id: string;
  amount: number;
  date: string;
  status: string;
  notes?: string;
  member: {
    userId: string;
  };
}

interface Member {
  id: string;
  userId: string;
  isAdmin: boolean;
  totalSavings: number;
  lastPayment: string | null;
  status: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  maxMembers: number;
  contributionAmount: number;
  totalSavings: number;
  nextMeeting: string | null;
  rules: string[];
  members: Member[];
  contributions: Contribution[];
  _count: {
    members: number;
  };
}

export default function GroupDetailsPage() {
  const params = useParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const { userId } = useAuth();

  const fetchGroupDetails = async () => {
    try {
      const response = await fetch(`/api/groups/${params.groupId}`);
      if (!response.ok) throw new Error("Failed to fetch group details");
      const data = await response.json();
      setGroup(data);
      
      // Find current member
      if (userId) {
        const member = data.members.find((m: Member) => m.userId === userId);
        setCurrentMember(member || null);
      }
    } catch (error) {
      console.error("Error fetching group details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [params.groupId, userId]);

  if (loading) {
    return <div>Loading group details...</div>;
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Group not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Members</p>
                    <p className="font-semibold">{group._count.members} / {group.maxMembers}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <PiggyBank className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Total Savings</p>
                    <p className="font-semibold">${group.totalSavings.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Next Meeting</p>
                    <p className="font-semibold">
                      {group.nextMeeting
                        ? new Date(group.nextMeeting).toLocaleDateString()
                        : "Not scheduled"}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Description</h3>
                <p className="mt-1 text-gray-600">{group.description}</p>
              </div>

              <div className="pt-4">
                <RequestFunds
                  groupId={group.id}
                  memberTotalSavings={currentMember?.totalSavings || 0}
                  hasContributions={currentMember?.totalSavings > 0}
                  onSuccess={fetchGroupDetails}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="grid gap-4">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-semibold">Member ID: {member.userId}</p>
                      <p className="text-sm text-gray-500">
                        Total Savings: ${member.totalSavings.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Last Payment:{" "}
                        {member.lastPayment
                          ? new Date(member.lastPayment).toLocaleDateString()
                          : "No payments yet"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {member.isAdmin && (
                        <span className="rounded-full bg-primary-100 px-3 py-1 text-sm text-primary">
                          Admin
                        </span>
                      )}
                      <span
                        className={`rounded-full px-3 py-1 text-sm ${
                          member.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {member.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="contributions" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">Contribution Amount</h3>
                  <p className="text-gray-600">${group.contributionAmount.toLocaleString()} per cycle</p>
                </div>
                <MakeContribution
                  groupId={group.id}
                  contributionAmount={group.contributionAmount}
                  onSuccess={fetchGroupDetails}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Contribution History</h3>
                <div className="space-y-4">
                  {!group.contributions || group.contributions.length === 0 ? (
                    <p className="text-gray-500">No contributions yet</p>
                  ) : (
                    group.contributions.map((contribution) => (
                      <div
                        key={contribution.id}
                        className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-semibold">
                            ${contribution.amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(contribution.date).toLocaleDateString()}
                          </p>
                          {contribution.notes && (
                            <p className="text-sm text-gray-600 mt-1">
                              {contribution.notes}
                            </p>
                          )}
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-sm ${
                            contribution.status === "COMPLETED"
                              ? "bg-green-100 text-green-700"
                              : contribution.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {contribution.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Group Rules</h3>
              <ul className="list-disc pl-5 space-y-2">
                {group.rules.map((rule, index) => (
                  <li key={index} className="text-gray-600">
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
