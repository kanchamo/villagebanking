"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Meeting {
  id: string;
  date: string;
  time: string;
  location: string;
  agenda: string[];
  attendees: number;
  status: "upcoming" | "completed" | "cancelled";
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement API call to fetch meetings
    // For now using mock data
    const mockMeetings: Meeting[] = [
      {
        id: "1",
        date: "2024-02-15",
        time: "14:00",
        location: "Community Center",
        agenda: [
          "Review monthly savings",
          "Discuss new loan applications",
          "Plan community event",
        ],
        attendees: 15,
        status: "upcoming",
      },
      {
        id: "2",
        date: "2024-02-01",
        time: "14:00",
        location: "Community Center",
        agenda: [
          "Monthly financial review",
          "New member introductions",
          "Vote on policy changes",
        ],
        attendees: 12,
        status: "completed",
      },
    ];
    setMeetings(mockMeetings);
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading meetings...</div>;
  }

  const upcomingMeetings = meetings.filter((m) => m.status === "upcoming");
  const pastMeetings = meetings.filter((m) => m.status === "completed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meetings</h1>
        <Button>Schedule Meeting</Button>
      </div>

      <div className="space-y-6">
        {upcomingMeetings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Meetings</CardTitle>
              <CardDescription>Next scheduled meetings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {upcomingMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex flex-col space-y-4 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-semibold">
                            {new Date(meeting.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">{meeting.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <p className="text-sm">{meeting.location}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-gray-500" />
                        <p className="text-sm">{meeting.attendees} attendees</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Agenda</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {meeting.agenda.map((item, index) => (
                          <li key={index} className="text-sm">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {pastMeetings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Past Meetings</CardTitle>
              <CardDescription>Previous meeting records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pastMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex flex-col space-y-4 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-semibold">
                            {new Date(meeting.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">{meeting.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <p className="text-sm">{meeting.location}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-gray-500" />
                        <p className="text-sm">{meeting.attendees} attended</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Agenda</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {meeting.agenda.map((item, index) => (
                          <li key={index} className="text-sm">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
