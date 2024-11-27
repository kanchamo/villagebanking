import { Card } from "@/components/ui/card";
import { Users, PiggyBank, Calendar, TrendingUp } from "lucide-react";

export default function DashboardPage() {
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
              <h3 className="text-2xl font-bold text-gray-900">245</h3>
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
              <h3 className="text-2xl font-bold text-gray-900">$52,450</h3>
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
              <h3 className="text-2xl font-bold text-gray-900">12</h3>
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
              <h3 className="text-2xl font-bold text-gray-900">18</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Recent Activities</h2>
          {/* Activity list will go here */}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Upcoming Meetings</h2>
          {/* Meetings list will go here */}
        </Card>
      </div>
    </div>
  );
}
