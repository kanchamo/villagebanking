"use client";

import { UserButton } from "@clerk/nextjs";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { GroupSearch } from "@/components/group-search";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4">
      <div className="w-[300px]">
        <GroupSearch />
      </div>
      <div className="flex items-center space-x-4">
        <NotificationsPopover />
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
