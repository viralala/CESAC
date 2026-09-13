import { NextResponse } from "next/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  topic?: unknown;
  message?: unknown;
};

export async function POST(request: Request) {
  let payload: ContactPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const topic = typeof payload.topic === "string" ? payload.topic.trim() : "General";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Name is required.";
  if (!email || !EMAIL_PATTERN.test(email)) errors.email = "A valid email is required.";
  if (!message || message.length < 10) errors.message = "Message must be at least 10 characters.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  // No email/notification provider is wired up yet. Submissions are logged
  // server-side so nothing is silently dropped; connect a real provider
  // (e.g. Resend, SMTP) before launch and replace this with an actual send.
  console.log("[contact] new submission", { name, email, topic, message });

  return NextResponse.json({ ok: true });
}
