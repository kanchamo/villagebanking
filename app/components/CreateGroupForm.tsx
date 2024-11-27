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

const groupFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  maxMembers: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(2, "Group must allow at least 2 members")),
  contributionAmount: z
    .string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().min(0, "Contribution amount must be positive")),
  rules: z.string().min(1, "At least one rule is required"),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

interface CreateGroupFormProps {
  onSuccess: () => void;
}

export function CreateGroupForm({ onSuccess }: CreateGroupFormProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: "",
      description: "",
      maxMembers: 0,
      contributionAmount: 0,
      rules: "",
    },
  });

  async function onSubmit(data: GroupFormValues) {
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          rules: data.rules.split("\n").filter((rule) => rule.trim() !== ""), // Split rules by newline
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create group");
      }

      form.reset();
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating group:", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create New Group</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter group name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Describe the group's purpose"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxMembers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Members</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="2"
                      placeholder="Enter max members"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contributionAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contribution Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter contribution amount"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rules (one per line)</FormLabel>
                  <FormControl>
                    <Input
                      as="textarea"
                      placeholder="Enter group rules"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Group</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
