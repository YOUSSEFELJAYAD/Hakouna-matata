import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
  verificationLink?: string;
}

/**
 * Welcome Email Template
 * Sent to new users upon registration
 */
export function WelcomeEmail({ name, verificationLink }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={h1}>Welcome to Hakouna Matata!</Heading>
            <Text style={text}>Hello {name},</Text>
            <Text style={text}>
              Thank you for joining Hakouna Matata. We're excited to have you on board!
            </Text>
            {verificationLink && (
              <>
                <Text style={text}>
                  To get started, please verify your email address by clicking the button below:
                </Text>
                <Button style={button} href={verificationLink}>
                  Verify Email
                </Button>
              </>
            )}
            <Text style={text}>
              If you have any questions, feel free to reach out to our support team.
            </Text>
            <Text style={footer}>
              Best regards,
              <br />
              The Hakouna Matata Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
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

const box = {
  padding: "0 48px",
};

const h1 = {
  color: "#1d1c1d",
  fontSize: "32px",
  fontWeight: "700",
  margin: "40px 0",
  padding: "0",
};

const text = {
  color: "#484848",
  fontSize: "16px",
  lineHeight: "26px",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
  margin: "20px 0",
};

const footer = {
  color: "#9ca299",
  fontSize: "14px",
  lineHeight: "24px",
  marginTop: "48px",
};

export default WelcomeEmail;
