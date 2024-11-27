"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, PiggyBank, Calendar } from "lucide-react";
import { CreateGroupForm } from "@/app/components/CreateGroupForm";

export default function GroupsPage() {
  const groups = [
    {
      id: 1,
      name: "Community Savers",
      members: 32,
      totalSavings: 12500,
      nextMeeting: "2024-03-25",
    },
    {
      id: 2,
      name: "Village Progress",
      members: 28,
      totalSavings: 9800,
      nextMeeting: "2024-03-27",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
        <CreateGroupForm onSuccess={() => {}} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {group.name}
                </h3>
                <div className="rounded-full bg-primary-100 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-gray-600">
                  <Users className="mr-2 h-4 w-4" />
                  <span>{group.members} members</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <PiggyBank className="mr-2 h-4 w-4" />
                  <span>${group.totalSavings.toLocaleString()}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>
                    Next meeting:{" "}
                    {new Date(group.nextMeeting).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button className="flex-1" variant="outline">
                  View Details
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary-600">
                  Join Group
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
