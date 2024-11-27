"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  PiggyBank,
  Calendar,
  FileText,
  Settings,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "text-blue-500",
  },
  {
    title: "Groups",
    href: "/dashboard/groups",
    icon: Users,
    color: "text-green-500",
  },
  {
    title: "Savings",
    href: "/dashboard/savings",
    icon: PiggyBank,
    color: "text-primary",
  },
  {
    title: "Meetings",
    href: "/dashboard/meetings",
    icon: Calendar,
    color: "text-purple-500",
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: FileText,
    color: "text-yellow-500",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    color: "text-gray-500",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col border-r border-gray-200 bg-white transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center border-b px-3">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        {!isCollapsed && (
          <span className="ml-2 text-lg font-semibold">Village Banking</span>
        )}
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors",
              pathname === item.href
                ? "bg-gray-100 text-gray-900"
                : "hover:bg-gray-50 text-gray-700",
              isCollapsed && "justify-center"
            )}
          >
            <item.icon className={cn("h-5 w-5", item.color)} />
            {!isCollapsed && <span>{item.title}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}
