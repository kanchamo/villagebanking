"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, PiggyBank, Calendar} from "lucide-react";
import { CreateGroupForm } from "@/app/components/CreateGroupForm";
import { JoinGroup } from "@/app/components/JoinGroup";

interface Group {
  id: string;
  name: string;
  totalSavings: number;
  nextMeeting: string | null;
  _count: {
    members: number;
  };
  members: Array<{
    userId: string;
    isAdmin: boolean;
  }>;
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups");
      if (!response.ok) throw new Error("Failed to fetch groups");
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  if (loading) {
    return <div>Loading groups...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
        <CreateGroupForm onSuccess={fetchGroups} />
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
                  <span>{group._count.members} members</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <PiggyBank className="mr-2 h-4 w-4" />
                  <span>${group.totalSavings.toLocaleString()}</span>
                </div>
                {group.nextMeeting && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>
                      Next meeting: {new Date(group.nextMeeting).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button 
                  className="flex-1" 
                  variant="outline"
                  onClick={() => router.push(`/dashboard/groups/${group.id}`)}
                >
                  View Details
                </Button>
                {!group.members.length && (
                  <JoinGroup groupId={group.id} onSuccess={fetchGroups} />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
