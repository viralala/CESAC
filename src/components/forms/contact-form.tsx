"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputField, TextareaField } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select-field";

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setFieldErrors({});
    setFormError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: data.get("name"),
      email: data.get("email"),
      topic: data.get("topic"),
      message: data.get("message"),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus("success");
        form.reset();
        return;
      }

      const body = await response.json().catch(() => null);
      if (body?.errors) {
        setFieldErrors(body.errors);
        setFormError("Check the fields below and try again.");
      } else {
        setFormError("Something went wrong sending your message. Please try again.");
      }
      setStatus("error");
    } catch {
      setStatus("error");
      setFormError("Could not reach the server. Check your connection and try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-start gap-3 border border-success/40 bg-success/10 p-8">
        <CheckCircle2 className="size-6 text-success" aria-hidden />
        <h3 className="font-display text-xl font-medium text-fg">Message received.</h3>
        <p className="text-sm leading-relaxed text-fg-muted">
          Thanks for reaching out. We will get back to you soon.
        </p>
        <Button variant="secondary" onClick={() => setStatus("idle")}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField label="Name" name="name" type="text" required error={fieldErrors.name} />
        <InputField label="Email" name="email" type="email" required error={fieldErrors.email} />
      </div>
      <SelectField label="Topic" name="topic" defaultValue="General">
        <option value="General">General inquiry</option>
        <option value="Events">Events</option>
        <option value="Membership">Membership</option>
        <option value="Partnerships">Partnerships</option>
      </SelectField>
      <TextareaField
        label="Message"
        name="message"
        required
        hint="At least 10 characters."
        error={fieldErrors.message}
      />

      {formError ? (
        <p className="flex items-center gap-2 text-sm text-danger">
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          {formError}
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="lg" disabled={status === "submitting"} className="self-start">
        {status === "submitting" ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Sending
          </>
        ) : (
          "Send message"
        )}
      </Button>
    </form>
  );
}
