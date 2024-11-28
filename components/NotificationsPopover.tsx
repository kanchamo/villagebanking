"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    groupId?: string;
    requestId?: string;
    requesterUserId?: string;
  };
}

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) throw new Error("Failed to mark notification as read");
      
      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      ));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleJoinRequest = async (notificationId: string, groupId: string, requestId: string, userId: string, status: "APPROVED" | "REJECTED") => {
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          status,
          userId,
        }),
      });

      if (!response.ok) throw new Error("Failed to process join request");

      await markAsRead(notificationId);
      toast({
        title: "Success",
        description: `Join request ${status.toLowerCase()}`,
      });
    } catch (error) {
      console.error("Error processing join request:", error);
      toast({
        title: "Error",
        description: "Failed to process join request",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Fetch notifications immediately when component mounts
    fetchNotifications();

    // Set up periodic fetching every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="font-medium">Notifications</div>
          {isLoading ? (
            <div className="py-6 text-center text-sm text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              No notifications
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-lg border p-3 ${
                      notification.read ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <div className="mb-1 font-medium">{notification.title}</div>
                    <p className="mb-2 text-sm text-gray-600">
                      {notification.message}
                    </p>
                    {notification.type === "JOIN_REQUEST" && !notification.read && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleJoinRequest(
                              notification.id,
                              notification.metadata?.groupId!,
                              notification.metadata?.requestId!,
                              notification.metadata?.requesterUserId!,
                              "APPROVED"
                            )
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleJoinRequest(
                              notification.id,
                              notification.metadata?.groupId!,
                              notification.metadata?.requestId!,
                              notification.metadata?.requesterUserId!,
                              "REJECTED"
                            )
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-400">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
