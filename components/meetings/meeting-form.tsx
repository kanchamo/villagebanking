"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface MeetingFormProps {
  groupId: string;
}

export function MeetingForm({ groupId }: MeetingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const link = formData.get("link") as string;
      const payload = {
        title: formData.get("title"),
        date: formData.get("date"),
        time: formData.get("time"),
        location: formData.get("location") || undefined,
        link: link && link.trim() !== "" ? link : undefined,
        agenda: (formData.get("agenda") as string).split('\n').filter(item => item.trim() !== ""),
      };

      console.log("[MeetingForm] Submitting payload:", payload);

      const response = await fetch(`/api/groups/${groupId}/meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("[MeetingForm] Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to create meeting");
      }

      toast({
        title: "Success",
        description: "Meeting created successfully",
      });
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("[MeetingForm] Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Input
          name="title"
          placeholder="Meeting Title"
          required
          disabled={loading}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          name="date"
          type="date"
          required
          disabled={loading}
        />
        <Input
          name="time"
          type="time"
          required
          disabled={loading}
        />
      </div>
      <div>
        <Input
          name="location"
          placeholder="Location (optional)"
          disabled={loading}
        />
      </div>
      <div>
        <Input
          name="link"
          type="url"
          placeholder="Meeting Link (optional)"
          disabled={loading}
        />
      </div>
      <div>
        <Textarea
          name="agenda"
          placeholder="Meeting Agenda"
          required
          disabled={loading}
          rows={4}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating..." : "Create Meeting"}
      </Button>
    </form>
  );
}
