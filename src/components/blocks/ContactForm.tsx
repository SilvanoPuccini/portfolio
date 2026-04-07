"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type ContactFormLabels = {
  title: string;
  fields: {
    name: string;
    email: string;
    subject: string;
    message: string;
  };
  placeholders: {
    name: string;
    email: string;
    subject: string;
    message: string;
  };
  submit: string;
  sending: string;
  success: string;
  error: string;
  helper: string;
  validation: {
    required: string;
    email: string;
  };
};

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export default function ContactForm({
  action,
  locale,
  labels,
}: {
  action: string;
  locale: string;
  labels: ContactFormLabels;
}) {
  const helperId = "contact-form-helper";
  const statusId = "contact-form-status";
  const [values, setValues] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const statusMeta = {
    idle: {
      icon: SendHorizontal,
      badgeTone: "text-text-tertiary",
      panelTone: "border-outline-ghost/12 bg-surface-dim/40",
      iconTone: "text-brand-primary",
      copyTone: "text-text-secondary",
    },
    submitting: {
      icon: LoaderCircle,
      badgeTone: "text-brand-secondary",
      panelTone: "border-brand-secondary/20 bg-brand-secondary/10",
      iconTone: "text-brand-secondary",
      copyTone: "text-text-secondary",
    },
    success: {
      icon: CheckCircle2,
      badgeTone: "text-brand-primary",
      panelTone: "border-brand-primary/25 bg-brand-primary/10",
      iconTone: "text-brand-primary",
      copyTone: "text-text-primary",
    },
    error: {
      icon: AlertCircle,
      badgeTone: "text-red-300",
      panelTone: "border-red-400/25 bg-red-400/8",
      iconTone: "text-red-300",
      copyTone: "text-text-primary",
    },
  } as const;
  const statusCopy =
    locale === "es"
      ? {
          idle: "Listo para recibir tu mensaje",
          submitting: "Enviando a Formspree",
          success: "Mensaje entregado",
          error: "Revisión requerida",
        }
      : {
          idle: "Ready to receive your message",
          submitting: "Sending to Formspree",
          success: "Message delivered",
          error: "Review required",
        };
  const currentStatusMeta = statusMeta[status];
  const StatusIcon = currentStatusMeta.icon;

  const fieldDescriptors = useMemo(
    () => [
      {
        key: "name" as const,
        type: "text",
        autoComplete: "name",
        label: labels.fields.name,
        placeholder: labels.placeholders.name,
      },
      {
        key: "email" as const,
        type: "email",
        autoComplete: "email",
        label: labels.fields.email,
        placeholder: labels.placeholders.email,
      },
    ],
    [labels.fields.email, labels.fields.name, labels.placeholders.email, labels.placeholders.name],
  );

  function validate(nextValues: FormState) {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    (Object.entries(nextValues) as [keyof FormState, string][]).forEach(([key, value]) => {
      if (!value.trim()) {
        nextErrors[key] = labels.validation.required;
      }
    });

    if (nextValues.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextValues.email)) {
      nextErrors.email = labels.validation.email;
    }

    return nextErrors;
  }

  function updateField(key: keyof FormState, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    if (status !== "idle") {
      setStatus("idle");
      setMessage("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      setMessage(labels.error);
      return;
    }

    setStatus("submitting");
    setMessage("");

    const formData = new FormData();
    formData.append("name", values.name.trim());
    formData.append("email", values.email.trim());
    formData.append("subject", values.subject.trim());
    formData.append("message", values.message.trim());
    formData.append("locale", locale);

    try {
      const response = await fetch(action, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Contact form submission failed");
      }

      setValues(initialState);
      setErrors({});
      setStatus("success");
      setMessage(labels.success);
    } catch {
      setStatus("error");
      setMessage(labels.error);
    }
  }

  return (
    <div className="surface-panel relative overflow-hidden px-6 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
      <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 translate-x-1/3 -translate-y-1/3 rounded-full bg-brand-secondary/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 -translate-x-1/3 translate-y-1/3 rounded-full bg-brand-primary/10 blur-3xl" />

      <div className="relative">
        <h2 className="text-2xl font-semibold text-text-primary sm:text-3xl">{labels.title}</h2>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate aria-describedby={`${helperId} ${statusId}`} aria-busy={status === "submitting"}>
          <div className="grid gap-6 md:grid-cols-2">
            {fieldDescriptors.map((field) => (
              <label key={field.key} htmlFor={field.key} className="block space-y-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{field.label}</span>
                <input
                  id={field.key}
                  type={field.type}
                  name={field.key}
                  autoComplete={field.autoComplete}
                  required
                  value={values[field.key]}
                  onChange={(event) => updateField(field.key, event.target.value)}
                  aria-invalid={errors[field.key] ? true : undefined}
                  aria-describedby={errors[field.key] ? `${field.key}-error` : undefined}
                  className={cn(
                    "field-shell",
                    errors[field.key] ? "border-red-400/60" : "border-outline-ghost/15",
                  )}
                  placeholder={field.placeholder}
                />
                {errors[field.key] ? (
                  <span id={`${field.key}-error`} className="text-xs text-red-300">
                    {errors[field.key]}
                  </span>
                ) : null}
              </label>
            ))}
          </div>

          <label htmlFor="subject" className="block space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{labels.fields.subject}</span>
            <input
              id="subject"
              type="text"
              name="subject"
              required
              value={values.subject}
              onChange={(event) => updateField("subject", event.target.value)}
              aria-invalid={errors.subject ? true : undefined}
              aria-describedby={errors.subject ? "subject-error" : undefined}
              className={cn(
                "field-shell",
                errors.subject ? "border-red-400/60" : "border-outline-ghost/15",
              )}
              placeholder={labels.placeholders.subject}
            />
            {errors.subject ? (
              <span id="subject-error" className="text-xs text-red-300">
                {errors.subject}
              </span>
            ) : null}
          </label>

          <label htmlFor="message" className="block space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{labels.fields.message}</span>
            <textarea
              id="message"
              name="message"
              rows={6}
              required
              value={values.message}
              onChange={(event) => updateField("message", event.target.value)}
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={errors.message ? "message-error" : undefined}
              className={cn(
                "field-shell min-h-[10rem] resize-none",
                errors.message ? "border-red-400/60" : "border-outline-ghost/15",
              )}
              placeholder={labels.placeholders.message}
            />
            {errors.message ? (
              <span id="message-error" className="text-xs text-red-300">
                {errors.message}
              </span>
            ) : null}
          </label>

          <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
            <button type="submit" className="button-primary w-full sm:min-w-[13rem] sm:w-auto" disabled={status === "submitting"}>
              <span className="inline-flex items-center gap-2">
                {status === "submitting" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                <span>{status === "submitting" ? labels.sending : labels.submit}</span>
              </span>
            </button>

            <div
              id={statusId}
              role={status === "error" ? "alert" : "status"}
              aria-live="polite"
              aria-atomic="true"
              className={cn(
                "rounded-[1.35rem] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:px-5",
                currentStatusMeta.panelTone,
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-current/10 bg-background/20", currentStatusMeta.iconTone)}>
                  <StatusIcon className={cn("h-4 w-4", status === "submitting" && "animate-spin")} />
                </div>

                <div className="min-w-0">
                  <p className={cn("font-mono text-[11px] uppercase tracking-[0.18em]", currentStatusMeta.badgeTone)}>{statusCopy[status]}</p>
                  <p id={helperId} className={cn("mt-3 text-sm leading-6", currentStatusMeta.copyTone)}>
                    {message || labels.helper}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
