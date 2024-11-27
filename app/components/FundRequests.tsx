import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FundRequest {
  id: string;
  type: "LOAN" | "PAYOUT";
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  member: {
    userId: string;
    isAdmin: boolean;
  };
  votingStatus: {
    totalMembers: number;
    requiredApprovals: number;
    currentApprovals: number;
    approvalPercentage: number;
    hasVoted: boolean;
    approved: boolean;
  };
}

interface FundRequestsProps {
  groupId: string;
  isAdmin: boolean;
  onSuccess?: () => void;
}

export function FundRequests({ groupId, isAdmin, onSuccess }: FundRequestsProps) {
  const { userId } = useAuth();
  const [requests, setRequests] = useState<FundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/fund-requests`);
      if (!response.ok) throw new Error("Failed to fetch requests");
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [groupId]);

  const handleVote = async (requestId: string, approved: boolean) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/fund-requests`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId, approved }),
      });

      if (!response.ok) throw new Error("Failed to submit vote");
      
      fetchRequests();
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  };

  const handleProcess = async (requestId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/fund-requests`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) throw new Error("Failed to process request");
      
      setShowProcessDialog(false);
      fetchRequests();
      onSuccess?.();
    } catch (error) {
      console.error("Error processing request:", error);
    }
  };

  if (loading) {
    return <div>Loading requests...</div>;
  }

  return (
    <div className="space-y-4">
      {requests.length === 0 ? (
        <p className="text-gray-500">No fund requests</p>
      ) : (
        requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {request.type} Request - ${request.amount.toLocaleString()}
                </span>
                <span
                  className={`text-sm px-3 py-1 rounded-full ${
                    request.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : request.status === "APPROVED"
                      ? "bg-blue-100 text-blue-700"
                      : request.status === "COMPLETED"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {request.status}
                </span>
              </CardTitle>
              <CardDescription>
                Requested by:{" "}
                {request.member.userId === userId ? "You" : request.member.userId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">{request.reason}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>
                      {request.votingStatus.currentApprovals} of{" "}
                      {request.votingStatus.requiredApprovals} required approvals
                    </span>
                    <span>
                      {request.votingStatus.approvalPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={request.votingStatus.approvalPercentage}
                    className="h-2"
                  />
                </div>

                {request.status === "PENDING" && (
                  <div className="flex justify-end space-x-2">
                    {!request.votingStatus.hasVoted && request.member.userId !== userId && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleVote(request.id, false)}
                        >
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleVote(request.id, true)}
                        >
                          Approve
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {isAdmin && request.status === "APPROVED" && (
                  <div className="flex justify-end">
                    <Button
                      onClick={() => {
                        setSelectedRequest(request.id);
                        setShowProcessDialog(true);
                      }}
                    >
                      Process Request
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <AlertDialog
        open={showProcessDialog}
        onOpenChange={setShowProcessDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process Fund Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this request as processed? This action
              indicates that you have manually transferred the funds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequest && handleProcess(selectedRequest)}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
