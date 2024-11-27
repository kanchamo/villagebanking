"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MakeContributionProps {
  groupId: string;
  contributionAmount: number;
  onSuccess: () => void;
}

export function MakeContribution({
  groupId,
  contributionAmount,
  onSuccess,
}: MakeContributionProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/contribute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: contributionAmount,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to make contribution");
      }

      setOpen(false);
      setNotes("");
      onSuccess();
    } catch (error) {
      console.error("Error making contribution:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Make Contribution</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Make Contribution</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Contribution Amount</Label>
            <Input
              type="text"
              value={`$${contributionAmount.toLocaleString()}`}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this contribution..."
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processing..." : "Submit Contribution"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
