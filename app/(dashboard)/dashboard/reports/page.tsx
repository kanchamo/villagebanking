"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

interface Report {
  id: string;
  title: string;
  description: string;
  type: "financial" | "activity" | "member";
  date: string;
  downloadUrl: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement API call to fetch reports
    // For now using mock data
    const mockReports: Report[] = [
      {
        id: "1",
        title: "Monthly Financial Summary",
        description: "Overview of group savings, loans, and repayments",
        type: "financial",
        date: "2024-01-31",
        downloadUrl: "#",
      },
      {
        id: "2",
        title: "Member Activity Report",
        description: "Member participation and contribution statistics",
        type: "activity",
        date: "2024-01-31",
        downloadUrl: "#",
      },
      {
        id: "3",
        title: "Loan Performance Report",
        description: "Analysis of loan disbursements and repayments",
        type: "financial",
        date: "2024-01-31",
        downloadUrl: "#",
      },
      {
        id: "4",
        title: "Member Status Report",
        description: "Current status and history of all group members",
        type: "member",
        date: "2024-01-31",
        downloadUrl: "#",
      },
    ];
    setReports(mockReports);
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports</h1>
        <Button>Generate New Report</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>{report.title}</span>
                </CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Generated on {new Date(report.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    Type:{" "}
                    <span className="capitalize font-medium">{report.type}</span>
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
