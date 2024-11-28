"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Link as LinkIcon } from "lucide-react";
import { ScheduleMeeting } from "@/app/components/ScheduleMeeting";
import Link from "next/link";

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string | null;
  link: string | null;
  agenda: string[];
  group: {
    name: string;
  };
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeetings = async () => {
    try {
      const response = await fetch('/api/meetings');
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
  }, []);

  if (loading) {
    return <div>Loading meetings...</div>;
  }

  const upcomingMeetings = meetings.filter(
    (m) => new Date(m.date) >= new Date()
  );
  const pastMeetings = meetings.filter(
    (m) => new Date(m.date) < new Date()
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Upcoming Meetings</h2>
        {upcomingMeetings.length === 0 ? (
          <p>No upcoming meetings</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingMeetings.map((meeting) => (
              <Card key={meeting.id}>
                <CardHeader>
                  <CardTitle>{meeting.title}</CardTitle>
                  <CardDescription>{meeting.group.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(meeting.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{meeting.time}</span>
                  </div>
                  {meeting.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{meeting.location}</span>
                    </div>
                  )}
                  {meeting.link && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      <Link href={meeting.link} target="_blank" className="text-blue-500 hover:underline">
                        Join Meeting
                      </Link>
                    </div>
                  )}
                  {meeting.agenda.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Agenda:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {meeting.agenda.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Past Meetings</h2>
        {pastMeetings.length === 0 ? (
          <p>No past meetings</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastMeetings.map((meeting) => (
              <Card key={meeting.id} className="opacity-75">
                <CardHeader>
                  <CardTitle>{meeting.title}</CardTitle>
                  <CardDescription>{meeting.group.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(meeting.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{meeting.time}</span>
                  </div>
                  {meeting.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{meeting.location}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
