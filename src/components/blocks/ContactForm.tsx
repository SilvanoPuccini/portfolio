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
  type: "success" | "error";
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
  const [values, setValues] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [toast, setToast] = useState<ToastState | null>(null);
  const statusMeta = {
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
          success: "Mensaje entregado",
          error: "Revisión requerida",
        }
      : {
          success: "Message delivered",
          error: "Review required",
        };
  const currentStatusMeta = toast ? statusMeta[toast.type] : null;

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 4200);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

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
      setToast({ type: "error", message: labels.error });
      return;
    }

    setStatus("submitting");
    setToast(null);

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
      setStatus("idle");
      setToast({ type: "success", message: labels.success });
    } catch {
      setStatus("idle");
      setToast({ type: "error", message: labels.error });
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

          <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
            <button type="submit" className="button-primary w-full sm:min-w-[13rem] sm:w-auto" disabled={status === "submitting"}>
              <span className="inline-flex items-center gap-2">
                {status === "submitting" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                <span>{status === "submitting" ? labels.sending : labels.submit}</span>
              </span>
            </button>
          </div>

        {toast && currentStatusMeta ? (() => {
          const StatusIcon = currentStatusMeta.icon;

          return (
            <div
              className="pointer-events-none fixed inset-x-4 bottom-4 z-50 sm:left-auto sm:right-6 sm:w-full sm:max-w-md"
              role={toast.type === "error" ? "alert" : "status"}
              aria-live="polite"
              aria-atomic="true"
            >
              <div
                className={cn(
                  "rounded-[var(--radius-soft)] border px-4 py-4 shadow-[0_18px_48px_rgba(0,0,0,0.26)] backdrop-blur-md sm:px-5",
                  currentStatusMeta.panelTone,
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-soft)] border border-current/10 bg-background/35", currentStatusMeta.iconTone)}>
                    <StatusIcon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className={cn("font-mono text-[11px] uppercase tracking-[0.18em]", currentStatusMeta.badgeTone)}>{statusCopy[toast.type]}</p>
                    <p className={cn("mt-3 text-sm leading-6", currentStatusMeta.copyTone)}>{toast.message}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })() : null}
      </form>
    </div>
  );
}
