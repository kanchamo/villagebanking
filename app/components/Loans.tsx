import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { LoanStatus } from "@prisma/client";

interface Loan {
  id: string;
  amount: number;
  dueDate: string;
  status: LoanStatus;
  interest: number;
  paidAmount: number;
  borrower: {
    userId: string;
  };
  request: {
    reason: string;
  };
}

interface LoansProps {
  groupId: string;
}

export default function Loans({ groupId }: LoansProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const { toast } = useToast();
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");

  useEffect(() => {
    fetchLoans();
  }, [groupId]);

  const fetchLoans = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/loans`);
      if (!response.ok) throw new Error("Failed to fetch loans");
      const data = await response.json();
      setLoans(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch loans",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeColor = (status: LoanStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500";
      case "OVERDUE":
        return "bg-red-500";
      case "PAID":
        return "bg-blue-500";
      case "DEFAULTED":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const calculateRemainingAmount = (loan: Loan) => {
    const totalDue = loan.amount + loan.interest;
    return totalDue - loan.paidAmount;
  };

  const handlePaymentSubmit = async () => {
    if (!selectedLoan) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    const remainingAmount = calculateRemainingAmount(selectedLoan);
    if (amount > remainingAmount) {
      toast({
        title: "Invalid amount",
        description: "Payment amount cannot exceed the remaining loan amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          amount,
          notes: `Loan payment for loan ${selectedLoan.id}`,
          loanId: selectedLoan.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment session');
      }

      const { sessionId } = await response.json();
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate payment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setSelectedLoan(null);
      setPaymentAmount("");
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableCaption>A list of all loans in the group</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Amount</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Interest</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map((loan) => (
              <TableRow key={loan.id}>
                <TableCell>${loan.amount.toLocaleString()}</TableCell>
                <TableCell>{loan.request?.reason || 'N/A'}</TableCell>
                <TableCell>{format(new Date(loan.dueDate), "PPP")}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeColor(loan.status)}>
                    {loan.status}
                  </Badge>
                </TableCell>
                <TableCell>${loan.interest.toLocaleString()}</TableCell>
                <TableCell>${loan.paidAmount.toLocaleString()}</TableCell>
                <TableCell>${calculateRemainingAmount(loan).toLocaleString()}</TableCell>
                <TableCell>
                  {loan.borrower.userId === userId && loan.status !== 'PAID' && (
                    <Button
                      onClick={() => {
                        setSelectedLoan(loan);
                        setPaymentAmount(calculateRemainingAmount(loan).toString());
                      }}
                      disabled={isLoading}
                      size="sm"
                    >
                      Pay
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={selectedLoan !== null} onOpenChange={(open) => !open && setSelectedLoan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make a Loan Payment</DialogTitle>
            <DialogDescription>
              Enter the amount you want to pay towards your loan.
              {selectedLoan && (
                <div className="mt-2">
                  <p>Remaining amount: ${calculateRemainingAmount(selectedLoan).toLocaleString()}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={selectedLoan ? calculateRemainingAmount(selectedLoan) : 0}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedLoan(null);
                setPaymentAmount("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              disabled={isLoading || !paymentAmount || parseFloat(paymentAmount) <= 0}
            >
              {isLoading ? "Processing..." : "Continue to Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
