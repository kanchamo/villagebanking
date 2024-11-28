"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PiggyBank, TrendingUp } from "lucide-react";

interface SavingsData {
  totalSavings: number;
  monthlySavings: {
    month: string;
    amount: number;
  }[];
  savingsGoal: number;
  savingsRate: number;
}

export default function SavingsPage() {
  const [savingsData, setSavingsData] = useState<SavingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement API call to fetch savings data
    // For now using mock data
    const mockData: SavingsData = {
      totalSavings: 25000,
      monthlySavings: [
        { month: "Jan 2024", amount: 5000 },
        { month: "Feb 2024", amount: 7000 },
        { month: "Mar 2024", amount: 8000 },
        { month: "Apr 2024", amount: 5000 },
      ],
      savingsGoal: 50000,
      savingsRate: 0.5, // 50% of goal achieved
    };
    setSavingsData(mockData);
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading savings data...</div>;
  }

  if (!savingsData) {
    return <div>Failed to load savings data</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Savings Overview</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${savingsData.totalSavings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {(savingsData.savingsRate * 100).toFixed(0)}% of goal reached
            </p>
            <div className="mt-4 h-2 w-full bg-secondary">
              <div
                className="h-2 bg-primary"
                style={{ width: `${savingsData.savingsRate * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Goal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${savingsData.savingsGoal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Target savings amount</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Savings History</CardTitle>
          <CardDescription>Track your savings progress over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {savingsData.monthlySavings.map((month) => (
              <div key={month.month} className="flex items-center">
                <div className="w-24 text-sm">{month.month}</div>
                <div className="flex-1">
                  <div className="h-2 w-full bg-secondary">
                    <div
                      className="h-2 bg-primary"
                      style={{
                        width: `${(month.amount / savingsData.savingsGoal) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right text-sm">
                  ${month.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
