"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Bilingual labels                                                          */
/* -------------------------------------------------------------------------- */

const labels = {
  es: {
    steps: [
      "Sobre tu negocio",
      "Que vamos a construir",
      "Detalles practicos",
      "Tus datos",
    ],
    // Step 1
    s1_business_q: "Como describirias tu negocio en una oracion?",
    s1_business_ph: "Ej: Vendo ropa deportiva online y en local",
    s1_problem_q: "Que te gustaria que tu negocio pueda hacer y hoy no puede?",
    s1_problem_ph: "Ej: Quiero que mis clientes compren online y les llegue a domicilio",
    s1_current_q: "Como manejas eso hoy?",
    s1_current_opts: ["Papel", "Excel", "WhatsApp", "Sistema existente"],
    // Step 2
    s2_type_q: "Que tipo de producto tenes en mente?",
    s2_type_opts: ["Landing page", "E-commerce", "Plataforma", "Sistema interno", "No estoy seguro"],
    s2_sections_q: "Cuantas secciones o pantallas principales?",
    s2_sections_opts: ["1-3", "4-8", "9+"],
    s2_login_q: "Los usuarios se registran e inician sesion?",
    s2_payments_q: "Va a procesar pagos online?",
    s2_admin_q: "Necesitas un panel de administracion?",
    s2_integrations_q: "Se conecta con otras herramientas?",
    s2_integrations_opts: ["WhatsApp", "Email", "IA", "Otro sistema", "Ninguno"],
    s2_languages_q: "Cuantos idiomas?",
    // Step 3
    s3_brand_q: "Tenes logo y marca, o hay que crearlos?",
    s3_brand_yes: "Ya tengo",
    s3_brand_no: "Hay que crear",
    s3_content_q: "Tenes los textos e imagenes, o hay que generarlos?",
    s3_content_yes: "Ya tengo",
    s3_content_no: "Hay que generar",
    s3_budget_q: "Que presupuesto tenes en mente?",
    s3_budget_opts: ["< $300", "$300 - $800", "$800 - $2000", "> $2000", "No definido"],
    s3_timeline_q: "Para cuando lo necesitas?",
    s3_timeline_opts: ["Lo antes posible", "1 mes", "2-3 meses", "Sin apuro"],
    s3_call_q: "Zoom o WhatsApp para la llamada?",
    s3_call_opts: ["Zoom", "WhatsApp"],
    // Step 4
    s4_name_q: "Nombre",
    s4_name_ph: "Tu nombre completo",
    s4_email_q: "Email",
    s4_email_ph: "tu@email.com",
    s4_phone_q: "Telefono (opcional)",
    s4_phone_ph: "+54 9 11 1234-5678",
    // Buttons
    next: "Siguiente",
    back: "Anterior",
    submit: "Enviar",
    submitting: "Enviando...",
    // Validation
    required: "Este campo es requerido.",
    invalidEmail: "Email invalido.",
    // Success
    successTitle: "Recibimos tu informacion",
    successMessage: "Te vamos a contactar pronto para agendar la llamada de diagnostico.",
    successCta: "Agendar ahora",
    // Errors
    submitError: "Algo salio mal. Intenta de nuevo.",
    // Toggle
    yes: "Si",
    no: "No",
  },
  en: {
    steps: [
      "About your business",
      "What are we building",
      "Practical details",
      "Your info",
    ],
    // Step 1
    s1_business_q: "How would you describe your business in one sentence?",
    s1_business_ph: "E.g. I sell athletic wear online and in store",
    s1_problem_q: "What would you like your business to be able to do that it can't today?",
    s1_problem_ph: "E.g. I want my customers to buy online and get home delivery",
    s1_current_q: "How do you handle this today?",
    s1_current_opts: ["Paper", "Excel", "WhatsApp", "Existing system"],
    // Step 2
    s2_type_q: "What type of product do you have in mind?",
    s2_type_opts: ["Landing page", "E-commerce", "Platform", "Internal system", "Not sure"],
    s2_sections_q: "How many main sections or screens?",
    s2_sections_opts: ["1-3", "4-8", "9+"],
    s2_login_q: "Do users register and log in?",
    s2_payments_q: "Will it process online payments?",
    s2_admin_q: "Do you need an admin panel?",
    s2_integrations_q: "Does it connect with other tools?",
    s2_integrations_opts: ["WhatsApp", "Email", "AI", "Other system", "None"],
    s2_languages_q: "How many languages?",
    // Step 3
    s3_brand_q: "Do you have a logo and brand, or do we need to create it?",
    s3_brand_yes: "I have it",
    s3_brand_no: "Need to create",
    s3_content_q: "Do you have the text and images, or do they need to be generated?",
    s3_content_yes: "I have them",
    s3_content_no: "Need to generate",
    s3_budget_q: "What budget do you have in mind?",
    s3_budget_opts: ["< $300", "$300 - $800", "$800 - $2000", "> $2000", "Not defined"],
    s3_timeline_q: "When do you need it?",
    s3_timeline_opts: ["ASAP", "1 month", "2-3 months", "No rush"],
    s3_call_q: "Zoom or WhatsApp for the call?",
    s3_call_opts: ["Zoom", "WhatsApp"],
    // Step 4
    s4_name_q: "Name",
    s4_name_ph: "Your full name",
    s4_email_q: "Email",
    s4_email_ph: "you@email.com",
    s4_phone_q: "Phone (optional)",
    s4_phone_ph: "+1 555 123-4567",
    // Buttons
    next: "Next",
    back: "Back",
    submit: "Submit",
    submitting: "Submitting...",
    // Validation
    required: "This field is required.",
    invalidEmail: "Invalid email address.",
    // Success
    successTitle: "We received your information",
    successMessage: "We will reach out soon to schedule the diagnostic call.",
    successCta: "Schedule now",
    // Errors
    submitError: "Something went wrong. Please try again.",
    // Toggle
    yes: "Yes",
    no: "No",
  },
} as const;

type LabelSet = (typeof labels)[keyof typeof labels];

/* -------------------------------------------------------------------------- */
/*  Form data type                                                            */
/* -------------------------------------------------------------------------- */

type FormData = {
  que_construir: string;
  problema: string;
  current_situation: string;
  tipo_proyecto: string;
  secciones: string;
  tiene_login: boolean | null;
  tiene_pagos: boolean | null;
  tiene_admin: string | null;
  integraciones: string[];
  idiomas: number;
  tiene_marca: boolean | null;
  tiene_contenido: boolean | null;
  presupuesto_rango: string;
  plazo: string;
  canal_llamada: string;
  nombre: string;
  email: string;
  telefono: string;
  website: string; // honeypot
};

const initialFormData: FormData = {
  que_construir: "",
  problema: "",
  current_situation: "",
  tipo_proyecto: "",
  secciones: "",
  tiene_login: null,
  tiene_pagos: null,
  tiene_admin: null,
  integraciones: [],
  idiomas: 1,
  tiene_marca: null,
  tiene_contenido: null,
  presupuesto_rango: "",
  plazo: "",
  canal_llamada: "",
  nombre: "",
  email: "",
  telefono: "",
  website: "",
};

/* -------------------------------------------------------------------------- */
/*  Shared sub-components                                                     */
/* -------------------------------------------------------------------------- */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
      {children}
    </span>
  );
}

function PillToggle({
  value,
  onChange,
  yesLabel,
  noLabel,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "rounded-pill border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
          value === true
            ? "border-brand-primary/40 bg-brand-primary/10 text-brand-primary"
            : "border-outline-ghost/12 bg-transparent text-text-secondary hover:border-outline-ghost/20"
        )}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "rounded-pill border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
          value === false
            ? "border-brand-primary/40 bg-brand-primary/10 text-brand-primary"
            : "border-outline-ghost/12 bg-transparent text-text-secondary hover:border-outline-ghost/20"
        )}
      >
        {noLabel}
      </button>
    </div>
  );
}

function ChipSelect({
  options,
  selected,
  onChange,
  multi = false,
}: {
  options: readonly string[];
  selected: string | string[];
  onChange: (value: string | string[]) => void;
  multi?: boolean;
}) {
  function handleClick(option: string) {
    if (multi) {
      const current = selected as string[];
      if (current.includes(option)) {
        onChange(current.filter((o) => o !== option));
      } else {
        onChange([...current, option]);
      }
    } else {
      onChange(option);
    }
  }

  function isSelected(option: string) {
    return multi
      ? (selected as string[]).includes(option)
      : selected === option;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => handleClick(option)}
          className={cn(
            "rounded-pill border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
            isSelected(option)
              ? "border-brand-primary/40 bg-brand-primary/10 text-brand-primary"
              : "border-outline-ghost/12 bg-transparent text-text-secondary hover:border-outline-ghost/20"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step progress indicator                                                   */
/* -------------------------------------------------------------------------- */

function StepIndicator({
  steps,
  current,
}: {
  steps: readonly string[];
  current: number;
}) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:gap-4">
      {steps.map((label, index) => (
        <div key={label} className="flex items-center gap-2 sm:gap-3">
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px]",
              index === current
                ? "border-brand-primary/40 bg-brand-primary/10 text-brand-primary"
                : index < current
                  ? "border-brand-primary/30 bg-brand-primary/5 text-brand-primary/60"
                  : "border-outline-ghost/12 text-text-tertiary"
            )}
          >
            {index < current ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              index + 1
            )}
          </div>
          <span
            className={cn(
              "hidden font-mono text-[10px] uppercase tracking-[0.14em] sm:block",
              index === current ? "text-brand-primary" : "text-text-tertiary"
            )}
          >
            {label}
          </span>
          {index < steps.length - 1 && (
            <div className="h-px w-4 bg-outline-ghost/10 sm:w-6" />
          )}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step renderers                                                            */
/* -------------------------------------------------------------------------- */

function Step1({
  data,
  l,
  errors,
  onChange,
}: {
  data: FormData;
  l: LabelSet;
  errors: Record<string, string>;
  onChange: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <label className="block space-y-2">
        <FieldLabel>{l.s1_business_q}</FieldLabel>
        <input
          type="text"
          value={data.que_construir}
          onChange={(e) => onChange("que_construir", e.target.value)}
          className={cn("field-shell", errors.que_construir ? "border-red-400/60" : "border-outline-ghost/15")}
          placeholder={l.s1_business_ph}
        />
        {errors.que_construir && <span className="text-xs text-red-300">{errors.que_construir}</span>}
      </label>

      <label className="block space-y-2">
        <FieldLabel>{l.s1_problem_q}</FieldLabel>
        <textarea
          rows={3}
          value={data.problema}
          onChange={(e) => onChange("problema", e.target.value)}
          className={cn("field-shell min-h-[5rem] resize-none", errors.problema ? "border-red-400/60" : "border-outline-ghost/15")}
          placeholder={l.s1_problem_ph}
        />
        {errors.problema && <span className="text-xs text-red-300">{errors.problema}</span>}
      </label>

      <div className="space-y-2">
        <FieldLabel>{l.s1_current_q}</FieldLabel>
        <ChipSelect
          options={l.s1_current_opts}
          selected={data.current_situation}
          onChange={(v) => onChange("current_situation", v as string)}
        />
      </div>
    </div>
  );
}

function Step2({
  data,
  l,
  onChange,
}: {
  data: FormData;
  l: LabelSet;
  onChange: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <FieldLabel>{l.s2_type_q}</FieldLabel>
        <ChipSelect
          options={l.s2_type_opts}
          selected={data.tipo_proyecto}
          onChange={(v) => onChange("tipo_proyecto", v as string)}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>{l.s2_sections_q}</FieldLabel>
        <ChipSelect
          options={l.s2_sections_opts}
          selected={data.secciones}
          onChange={(v) => onChange("secciones", v as string)}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>{l.s2_login_q}</FieldLabel>
        <PillToggle
          value={data.tiene_login}
          onChange={(v) => onChange("tiene_login", v)}
          yesLabel={l.yes}
          noLabel={l.no}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>{l.s2_payments_q}</FieldLabel>
        <PillToggle
          value={data.tiene_pagos}
          onChange={(v) => onChange("tiene_pagos", v)}
          yesLabel={l.yes}
          noLabel={l.no}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>{l.s2_admin_q}</FieldLabel>
        <PillToggle
          value={data.tiene_admin === null ? null : data.tiene_admin === "yes"}
          onChange={(v) => onChange("tiene_admin", v ? "yes" : "no")}
          yesLabel={l.yes}
          noLabel={l.no}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>{l.s2_integrations_q}</FieldLabel>
        <ChipSelect
          options={l.s2_integrations_opts}
          selected={data.integraciones}
          onChange={(v) => onChange("integraciones", v as string[])}
          multi
        />
      </div>

      <label className="block space-y-2">
        <FieldLabel>{l.s2_languages_q}</FieldLabel>
        <input
          type="number"
          min={1}
          max={10}
          value={data.idiomas}
          onChange={(e) => onChange("idiomas", Math.max(1, parseInt(e.target.value) || 1))}
          className="field-shell w-24 border-outline-ghost/15"
        />
      </label>
    </div>
  );
}

function Step3({
  data,
  l,
  onChange,
}: {
  data: FormData;
  l: LabelSet;
  onChange: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <FieldLabel>{l.s3_brand_q}</FieldLabel>
        <PillToggle
          value={data.tiene_marca}
          onChange={(v) => onChange("tiene_marca", v)}
          yesLabel={l.s3_brand_yes}
          noLabel={l.s3_brand_no}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>{l.s3_content_q}</FieldLabel>
        <PillToggle
          value={data.tiene_contenido}
          onChange={(v) => onChange("tiene_contenido", v)}
          yesLabel={l.s3_content_yes}
          noLabel={l.s3_content_no}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>{l.s3_budget_q}</FieldLabel>
        <ChipSelect
          options={l.s3_budget_opts}
          selected={data.presupuesto_rango}
          onChange={(v) => onChange("presupuesto_rango", v as string)}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>{l.s3_timeline_q}</FieldLabel>
        <ChipSelect
          options={l.s3_timeline_opts}
          selected={data.plazo}
          onChange={(v) => onChange("plazo", v as string)}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>{l.s3_call_q}</FieldLabel>
        <ChipSelect
          options={l.s3_call_opts}
          selected={data.canal_llamada}
          onChange={(v) => onChange("canal_llamada", v as string)}
        />
      </div>
    </div>
  );
}

function Step4({
  data,
  l,
  errors,
  onChange,
}: {
  data: FormData;
  l: LabelSet;
  errors: Record<string, string>;
  onChange: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <label className="block space-y-2">
        <FieldLabel>{l.s4_name_q}</FieldLabel>
        <input
          type="text"
          autoComplete="name"
          value={data.nombre}
          onChange={(e) => onChange("nombre", e.target.value)}
          className={cn("field-shell", errors.nombre ? "border-red-400/60" : "border-outline-ghost/15")}
          placeholder={l.s4_name_ph}
        />
        {errors.nombre && <span className="text-xs text-red-300">{errors.nombre}</span>}
      </label>

      <label className="block space-y-2">
        <FieldLabel>{l.s4_email_q}</FieldLabel>
        <input
          type="email"
          autoComplete="email"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
          className={cn("field-shell", errors.email ? "border-red-400/60" : "border-outline-ghost/15")}
          placeholder={l.s4_email_ph}
        />
        {errors.email && <span className="text-xs text-red-300">{errors.email}</span>}
      </label>

      <label className="block space-y-2">
        <FieldLabel>{l.s4_phone_q}</FieldLabel>
        <input
          type="tel"
          autoComplete="tel"
          value={data.telefono}
          onChange={(e) => onChange("telefono", e.target.value)}
          className="field-shell border-outline-ghost/15"
          placeholder={l.s4_phone_ph}
        />
      </label>

      {/* Honeypot — hidden from humans */}
      <div className="absolute -left-[9999px] opacity-0" aria-hidden="true">
        <label>
          Website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={data.website}
            onChange={(e) => onChange("website", e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

export default function IntakeForm({ locale }: { locale: string }) {
  const resolvedLocale = locale === "es" || locale === "en" ? locale : "en";
  const l = labels[resolvedLocale];
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validateStep(stepIndex: number): boolean {
    const nextErrors: Record<string, string> = {};

    if (stepIndex === 3) {
      if (!data.nombre.trim()) nextErrors.nombre = l.required;
      if (!data.email.trim()) {
        nextErrors.email = l.required;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        nextErrors.email = l.invalidEmail;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleNext() {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 3));
    }
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    if (!validateStep(3)) return;

    setStatus("submitting");

    // Build the problema field with current situation appended
    let problema = data.problema;
    if (data.current_situation) {
      problema = problema
        ? `${problema}\n\nCurrent situation: ${data.current_situation}`
        : `Current situation: ${data.current_situation}`;
    }

    const payload = {
      nombre: data.nombre.trim(),
      email: data.email.trim().toLowerCase(),
      telefono: data.telefono.trim() || undefined,
      que_construir: data.que_construir.trim() || undefined,
      problema: problema.trim() || undefined,
      tipo_proyecto: data.tipo_proyecto || undefined,
      secciones: data.secciones || undefined,
      tiene_login: data.tiene_login,
      tiene_pagos: data.tiene_pagos,
      tiene_admin: data.tiene_admin !== null ? (data.tiene_admin === "yes" ? "yes" : "no") : undefined,
      integraciones: data.integraciones.length > 0 ? data.integraciones : undefined,
      idiomas: data.idiomas,
      tiene_marca: data.tiene_marca,
      tiene_contenido: data.tiene_contenido,
      presupuesto_rango: data.presupuesto_rango || undefined,
      plazo: data.plazo || undefined,
      canal_llamada: data.canal_llamada || undefined,
      website: data.website, // honeypot
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { success?: boolean; id?: string; error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Unexpected error");
      }

      setStatus("success");

      if (result.id) {
        const params = new URLSearchParams({
          leadId: result.id,
          name: data.nombre.trim(),
          email: data.email.trim().toLowerCase(),
        });
        setTimeout(() => {
          router.push(`/${resolvedLocale}/services/agendar?${params.toString()}`);
        }, 2000);
      }
    } catch {
      setStatus("idle");
      setErrors({ submit: l.submitError });
    }
  }

  // Success state
  if (status === "success") {
    return (
      <div className="surface-panel border border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.9),rgb(var(--surface)/0.76))] px-6 py-10 text-center sm:px-10 sm:py-14">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
        <h3 className="mt-4 text-2xl font-semibold text-text-primary">{l.successTitle}</h3>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-text-secondary">
          {l.successMessage}
        </p>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-brand-primary">
          {l.successCta}
        </p>
      </div>
    );
  }

  return (
    <div className="surface-panel relative border border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.9),rgb(var(--surface)/0.76))] px-6 py-7 sm:px-7 sm:py-8 lg:px-8">
      {/* Step indicator */}
      <div className="mb-8">
        <StepIndicator steps={l.steps} current={step} />
      </div>

      {/* Step title */}
      <h3 className="mb-6 text-2xl font-semibold text-text-primary sm:text-3xl">
        {l.steps[step]}
      </h3>

      {/* Step content */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 3) handleNext();
          else void handleSubmit();
        }}
        noValidate
      >
        {step === 0 && <Step1 data={data} l={l} errors={errors} onChange={updateField} />}
        {step === 1 && <Step2 data={data} l={l} onChange={updateField} />}
        {step === 2 && <Step3 data={data} l={l} onChange={updateField} />}
        {step === 3 && <Step4 data={data} l={l} errors={errors} onChange={updateField} />}

        {/* Error message for submit failures */}
        {errors.submit && (
          <div className="mt-4 rounded-[var(--radius-soft)] border border-red-400/50 bg-[rgb(var(--surface-elevated)/0.85)] px-4 py-3">
            <p className="text-sm text-red-300">{errors.submit}</p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex items-center justify-between gap-4">
          {step > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="button-secondary inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{l.back}</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="submit"
              className="button-primary inline-flex items-center gap-2"
            >
              <span>{l.next}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              className="button-primary inline-flex items-center gap-2"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              <span>{status === "submitting" ? l.submitting : l.submit}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
