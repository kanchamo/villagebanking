"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4">
      <div></div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5 text-gray-600" />
        </Button>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
