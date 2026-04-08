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
    success: {
      icon: CheckCircle2,
      badgeTone: "bg-emerald-500 text-emerald-950",
      panelTone: "border-emerald-500/30 bg-[rgb(var(--surface-elevated))]",
      iconTone: "bg-emerald-500 text-emerald-950",
      copyTone: "text-text-primary",
    },
    error: {
      icon: AlertCircle,
      badgeTone: "bg-red-500 text-red-950",
      panelTone: "border-red-500/30 bg-[rgb(var(--surface-elevated))]",
      iconTone: "bg-red-500 text-red-950",
      copyTone: "text-text-primary",
    },
    warning: {
      icon: AlertCircle,
      badgeTone: "bg-amber-400 text-amber-950",
      panelTone: "border-amber-400/30 bg-[rgb(var(--surface-elevated))]",
      iconTone: "bg-amber-400 text-amber-950",
      copyTone: "text-text-primary",
    },
  } as const;
  const statusCopy =
    locale === "es"
      ? {
          success: "Mensaje entregado",
          warning: "Revisión pendiente",
          error: "Revisión requerida",
        }
      : {
          success: "Message delivered",
          warning: "Needs review",
          error: "Delivery failed",
        };
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

    const formData = new FormData(event.currentTarget);
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
        let errorMessage = labels.error;

        try {
          const payload = (await response.json()) as { errors?: Array<{ message?: string }> };
          const formspreeMessage = payload.errors?.find((error) => error.message?.trim())?.message;

          if (formspreeMessage) {
            errorMessage = formspreeMessage;
          }
        } catch {
          // Keep the localized fallback if Formspree does not return JSON.
        }

        throw new Error(errorMessage);
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
                    "relative min-h-[3.75rem] w-full rounded-[var(--radius-soft)] border px-3.5 py-3 text-left shadow-[0_18px_40px_rgba(2,6,23,0.18)] sm:min-h-12 sm:px-4 sm:py-3",
                    currentStatusMeta.panelTone,
                  )}
                  role={toast.type === "error" ? "alert" : "status"}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <div className="flex items-start gap-3 sm:items-center">
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[calc(var(--radius-soft)-2px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] sm:mt-0",
                        currentStatusMeta.iconTone,
                      )}
                    >
                      <StatusIcon className={cn("h-4 w-4", status === "submitting" ? "animate-spin" : undefined)} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "inline-flex rounded-pill px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] leading-none sm:text-[11px]",
                          currentStatusMeta.badgeTone,
                        )}
                      >
                        {status === "submitting" ? labels.sending : statusCopy[toast.type]}
                      </p>
                      <p className={cn("mt-2 text-sm leading-6", currentStatusMeta.copyTone)}>
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
