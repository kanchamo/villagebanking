"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { ScheduleMeeting } from "@/app/components/ScheduleMeeting";
import { useParams } from "next/navigation";

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string | null;
  link: string;
  agenda: string[];
}

export default function MeetingsPage() {
  const params = useParams();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeetings = async () => {
    try {
      const response = await fetch(`/api/groups/${params.groupId}/meetings`);
      if (!response.ok) throw new Error("Failed to fetch meetings");
      const data = await response.json();
      setMeetings(data);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [params.groupId]);

  if (loading) {
    return <div>Loading meetings...</div>;
  }

  const upcomingMeetings = meetings.filter(
    (m) => new Date(m.date) >= new Date()
  );
  const pastMeetings = meetings.filter(
    (m) => new Date(m.date) < new Date()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meetings</h1>
        <ScheduleMeeting groupId={params.groupId} onSuccess={fetchMeetings} />
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
                          <p className="font-semibold">{meeting.title}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(meeting.date).toLocaleDateString()} at {meeting.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <p className="text-sm">{meeting.location || 'Online'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Meeting Link</h4>
                      <a
                        href={meeting.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {meeting.link}
                      </a>
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
                          <p className="font-semibold">{meeting.title}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(meeting.date).toLocaleDateString()} at {meeting.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <p className="text-sm">{meeting.location || 'Online'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Meeting Link</h4>
                      <a
                        href={meeting.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {meeting.link}
                      </a>
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
