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

import { LoanStatus } from "@prisma/client";
import { loadStripe } from "@stripe/stripe-js";

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

  const handlePayment = async (loan: Loan) => {
    try {
      setIsLoading(true);
      const remainingAmount = calculateRemainingAmount(loan);
      
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          amount: remainingAmount,
          notes: `Loan payment for loan ${loan.id}`,
          loanId: loan.id,
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
    }
  };

  return (
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
                    onClick={() => handlePayment(loan)}
                    disabled={isLoading}
                    size="sm"
                  >
                    {isLoading ? 'Processing...' : 'Pay'}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
