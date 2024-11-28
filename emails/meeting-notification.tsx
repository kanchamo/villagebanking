import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface MeetingNotificationEmailProps {
  groupName: string;
  title: string;
  date: string;
  time: string;
  location: string;
  link: string;
  agenda: string[];
}

export const MeetingNotificationEmail = ({
  groupName,
  title,
  date,
  time,
  location,
  link,
  agenda,
}: MeetingNotificationEmailProps) => {
  const previewText = `New meeting scheduled for ${groupName}: ${title}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Meeting Scheduled</Heading>
          
          <Section style={section}>
            <Text style={groupNameText}>{groupName}</Text>
            <Text style={meetingTitle}>{title}</Text>
            
            <Hr style={hr} />
            
            <Text style={detailsTitle}>Meeting Details</Text>
            <Text style={text}>
              <strong>Date:</strong> {date}
            </Text>
            <Text style={text}>
              <strong>Time:</strong> {time}
            </Text>
            <Text style={text}>
              <strong>Location:</strong> {location}
            </Text>
            
            <Button
              pX={20}
              pY={12}
              style={button}
              href={link}
            >
              Join Meeting
            </Button>
            
            <Hr style={hr} />
            
            <Text style={detailsTitle}>Agenda</Text>
            {agenda.map((item, index) => (
              <Text key={index} style={agendaItem}>
                • {item}
              </Text>
            ))}
          </Section>
          
          <Text style={footer}>
            This email was sent by Village Banking. If you did not expect this email,
            please contact support.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default MeetingNotificationEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const section = {
  padding: "0 48px",
};

const h1 = {
  color: "#333",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const groupNameText = {
  color: "#666",
  fontSize: "16px",
  margin: "16px 0",
  textAlign: "center" as const,
};

const meetingTitle = {
  color: "#333",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "16px 0",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  margin: "16px 0",
};

const button = {
  backgroundColor: "#5850ec",
  borderRadius: "5px",
  color: "#fff",
  display: "block",
  fontSize: "16px",
  fontWeight: "bold",
  textAlign: "center" as const,
  textDecoration: "none",
  width: "100%",
  margin: "32px 0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const detailsTitle = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "16px 0",
};

const agendaItem = {
  color: "#333",
  fontSize: "16px",
  margin: "8px 0",
  paddingLeft: "16px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "32px 0 0",
  textAlign: "center" as const,
};
