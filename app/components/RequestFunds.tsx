"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const requestSchema = z.object({
  type: z.enum(["LOAN", "PAYOUT"]),
  amount: z.string().transform((val) => parseFloat(val)),
  reason: z.string().min(10, "Please provide a detailed reason for your request"),
  duration: z.string().optional(),
});

type RequestValues = z.infer<typeof requestSchema>;

interface RequestFundsProps {
  groupId: string;
  memberTotalSavings: number;
  hasContributions: boolean;
  lastPaymentDate: string | null;
  onSuccess: () => void;
}

export function RequestFunds({
  groupId,
  memberTotalSavings,
  hasContributions,
  lastPaymentDate,
  onSuccess,
}: RequestFundsProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      type: "LOAN",
      amount: 0,
      reason: "",
      duration: "week",
    },
  });

  const canRequestPayout = () => {
    if (!hasContributions || memberTotalSavings <= 0) {
      return { allowed: false, reason: "You need to have made contributions first" };
    }

    if (!lastPaymentDate) {
      return { allowed: false, reason: "No payment history found" };
    }

    // Check if last payment was at least 30 days ago
    const lastPayment = new Date(lastPaymentDate);
    const daysSinceLastPayment = Math.floor((Date.now() - lastPayment.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastPayment < 30) {
      return { 
        allowed: false, 
        reason: `You need to wait ${30 - daysSinceLastPayment} more days before requesting a payout` 
      };
    }

    return { allowed: true, reason: "" };
  };

  const onSubmit = async (data: RequestValues) => {
    setError(null);

    if (data.type === "PAYOUT") {
      const payoutCheck = canRequestPayout();
      if (!payoutCheck.allowed) {
        setError(payoutCheck.reason);
        return;
      }

      if (data.amount > memberTotalSavings * 0.5) {
        setError("Payout amount cannot exceed 50% of your total contributions");
        return;
      }
    }

    // Check if amount is more than 2x total contributions for loans
    if (data.type === "LOAN" && data.amount > memberTotalSavings * 2) {
      setError("Loan amount cannot exceed twice your total contributions");
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/request-funds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit request");
      }

      setOpen(false);
      form.reset();
      onSuccess();
    } catch (error) {
      console.error("Error submitting request:", error);
      setError(error instanceof Error ? error.message : "Failed to submit request. Please try again.");
    }
  };

  if (!hasContributions) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You need to make contributions before requesting loans or payouts
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Request Loan/Payout</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Funds</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select request type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LOAN">Loan</SelectItem>
                      <SelectItem value="PAYOUT">Payout</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter amount"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why you need this loan/payout..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch("type") === "LOAN" && (
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Duration</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="week">1 Week</SelectItem>
                        <SelectItem value="twoWeeks">2 Weeks</SelectItem>
                        <SelectItem value="month">1 Month</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full">
              Submit Request
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
