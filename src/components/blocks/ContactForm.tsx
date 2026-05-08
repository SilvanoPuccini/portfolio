"use client";

import { useEffect, useMemo, useState } from "react";
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

type ToastState = {
  type: "success" | "error" | "warning";
  message: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export default function ContactForm({
  locale,
  labels,
  defaultSubject,
}: {
  locale: string;
  labels: ContactFormLabels;
  defaultSubject?: string;
}) {
  const [values, setValues] = useState<FormState>({
    ...initialState,
    ...(defaultSubject ? { subject: defaultSubject } : {}),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [toast, setToast] = useState<ToastState | null>(null);
  const statusMeta = {
    success: {
      icon: CheckCircle2,
      accentClass: "text-emerald-400",
      borderClass: "border-emerald-400/50",
      labelKey: locale === "es" ? "Enviado" : "Sent",
    },
    error: {
      icon: AlertCircle,
      accentClass: "text-red-400",
      borderClass: "border-red-400/50",
      labelKey: locale === "es" ? "Error" : "Error",
    },
    warning: {
      icon: AlertCircle,
      accentClass: "text-amber-400",
      borderClass: "border-amber-400/40",
      labelKey: locale === "es" ? "Atención" : "Warning",
    },
  } as const;
  const currentStatusMeta = toast ? statusMeta[toast.type] : null;

  useEffect(() => {
    if (!toast) {
      return;
    }

    if (status === "submitting") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 4200);

    return () => window.clearTimeout(timeoutId);
  }, [status, toast]);

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
    if (toast) {
      setToast(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setToast({ type: "warning", message: labels.error });
      return;
    }

    setStatus("submitting");
    setToast({ type: "warning", message: labels.sending });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const payload = await response.json() as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? labels.error);
      }

      setValues(initialState);
      setErrors({});
      setStatus("idle");
      setToast({ type: "success", message: labels.success });
    } catch (error) {
      setStatus("idle");
      setToast({
        type: "error",
        message: error instanceof Error && error.message ? error.message : labels.error,
      });
    }
  }

  return (
    <div className="surface-panel no-line-stack h-full border border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.9),rgb(var(--surface)/0.76))] px-6 py-7 sm:px-7 sm:py-8 lg:px-8">
      <div>
        <h2 className="text-3xl font-semibold text-text-primary sm:text-4xl">{labels.title}</h2>
      </div>

      <form className="relative space-y-6" onSubmit={handleSubmit} noValidate aria-busy={status === "submitting"}>
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
              rows={5}
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

          <div className="grid gap-3 sm:grid-cols-[max-content_minmax(0,1fr)] sm:items-start sm:gap-4">
            <button
              type="submit"
              className="button-primary w-full sm:min-w-[13rem] sm:w-auto sm:shrink-0"
              disabled={status === "submitting"}
            >
              <span className="inline-flex items-center gap-2">
                {status === "submitting" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                <span>{status === "submitting" ? labels.sending : labels.submit}</span>
              </span>
            </button>

            {toast && currentStatusMeta ? (() => {
              const StatusIcon = currentStatusMeta.icon;

              return (
                <div
                  id="contact-form-status"
                  className={cn(
                    "w-full rounded-[var(--radius-soft)] border bg-[rgb(var(--surface-elevated)/0.85)] px-4 py-3.5",
                    currentStatusMeta.borderClass,
                  )}
                  role={toast.type === "error" ? "alert" : "status"}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <div className="flex items-start gap-3">
                    <StatusIcon className={cn("mt-0.5 h-4 w-4 shrink-0", currentStatusMeta.accentClass)} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className={cn("font-mono text-[11px] uppercase tracking-[0.18em] leading-none", currentStatusMeta.accentClass)}>
                        {currentStatusMeta.labelKey}
                      </p>
                      <p className="text-sm leading-5.5 text-text-secondary">
                        {toast.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })() : null}
          </div>
      </form>
    </div>
  );
}
