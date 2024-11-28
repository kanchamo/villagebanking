"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PiggyBank, TrendingUp, Target, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface GroupSavings {
  groupId: string;
  groupName: string;
  totalSavings: number;
  contributionAmount: number;
}

interface Contribution {
  id: string;
  amount: number;
  date: string;
  group: {
    name: string;
  };
}

interface SavingsData {
  savingsGoal: number;
  totalSavings: number;
  groupSavings: GroupSavings[];
  recentContributions: Contribution[];
}

export default function SavingsPage() {
  const [savingsData, setSavingsData] = useState<SavingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState("");

  const fetchSavingsData = async () => {
    try {
      const response = await fetch('/api/savings');
      if (!response.ok) throw new Error('Failed to fetch savings data');
      const data = await response.json();
      setSavingsData(data);
    } catch (error) {
      console.error('Error fetching savings data:', error);
      toast({
        title: "Error",
        description: "Failed to load savings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSavingsGoal = async () => {
    try {
      const goal = parseFloat(newGoal);
      if (isNaN(goal) || goal < 0) {
        throw new Error('Invalid savings goal');
      }

      const response = await fetch('/api/savings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ savingsGoal: goal }),
      });

      if (!response.ok) throw new Error('Failed to update savings goal');

      await fetchSavingsData();
      setIsEditingGoal(false);
      setNewGoal("");
      toast({
        title: "Success",
        description: "Savings goal updated successfully",
      });
    } catch (error) {
      console.error('Error updating savings goal:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update savings goal",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSavingsData();
  }, []);

  if (loading) {
    return <div>Loading savings data...</div>;
  }

  if (!savingsData) {
    return <div>Failed to load savings data</div>;
  }

  const savingsRate = savingsData.savingsGoal > 0 
    ? savingsData.totalSavings / savingsData.savingsGoal 
    : 0;

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
            {savingsData.savingsGoal > 0 && (
              <>
                <p className="text-xs text-muted-foreground">
                  {(savingsRate * 100).toFixed(0)}% of goal reached
                </p>
                <div className="mt-4 h-2 w-full bg-secondary">
                  <div
                    className="h-2 bg-primary"
                    style={{ width: `${Math.min(savingsRate * 100, 100)}%` }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Goal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isEditingGoal ? (
              <div className="space-y-2">
                <Input
                  type="number"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Enter savings goal"
                />
                <div className="flex gap-2">
                  <Button onClick={updateSavingsGoal}>Save</Button>
                  <Button variant="outline" onClick={() => setIsEditingGoal(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-2xl font-bold">${savingsData.savingsGoal.toLocaleString()}</div>
                <Button variant="outline" onClick={() => setIsEditingGoal(true)}>
                  Update Goal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Group Savings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Your savings across different groups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savingsData.groupSavings.map((group) => (
                <div key={group.groupId} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{group.groupName}</span>
                    <span>${group.totalSavings.toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Contribution: ${group.contributionAmount.toLocaleString()} per cycle
                  </div>
                  <div className="h-2 w-full bg-secondary">
                    <div
                      className="h-2 bg-primary"
                      style={{
                        width: `${Math.min((group.totalSavings / savingsData.totalSavings) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Contributions</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Your latest savings contributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savingsData.recentContributions.map((contribution) => (
                <div key={contribution.id} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{contribution.group.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(contribution.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="font-medium">
                    ${contribution.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
