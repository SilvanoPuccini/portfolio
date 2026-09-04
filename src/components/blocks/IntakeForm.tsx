"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  ServiceSlug type and serviceQuestions map (PR1-1)                         */
/* -------------------------------------------------------------------------- */

export type ServiceSlug =
  | "web-presence"
  | "full-stack-builds"
  | "automation-ai"
  | "product-ux-engineering";

type QuestionOption = {
  es: readonly string[];
  en: readonly string[];
};

type ServiceQuestion = {
  key: string;
  label: { es: string; en: string };
  type: "chip" | "toggle" | "text" | "number" | "textarea";
  options?: QuestionOption;
  multi?: boolean;
  /** When set, this question is only shown when the named sibling question has
   *  one of the listed values in serviceData. */
  showWhen?: { key: string; values: string[] };
  required?: boolean;
  maxLength?: number;
};

type ServiceQuestionSet = {
  stepTitle: { es: string; en: string };
  questions: ServiceQuestion[];
};

export const serviceQuestions: Record<ServiceSlug | "default", ServiceQuestionSet> = {
  "web-presence": {
    stepTitle: { es: "Sobre tu sitio", en: "About your site" },
    questions: [
      {
        key: "web_business",
        label: { es: "¿A qué se dedica tu negocio?", en: "What does your business do?" },
        type: "text",
        required: false,
        maxLength: 200,
      },
      {
        key: "web_goal",
        label: {
          es: "¿Qué querés que haga la persona que entra al sitio?",
          en: "What do you want a visitor to do on the site?",
        },
        type: "chip",
        options: {
          es: ["Que me escriba", "Que reserve un turno", "Que compre", "Que me conozca"],
          en: ["Contact me", "Book an appointment", "Buy", "Get to know me"],
        },
        required: false,
      },
      {
        key: "web_current",
        label: { es: "¿Tenés algo hoy?", en: "Do you have anything today?" },
        type: "chip",
        options: {
          es: ["Nada", "Solo redes sociales", "Un sitio viejo", "Un sitio que quiero rehacer"],
          en: ["Nothing", "Social media only", "An old site", "A site I want to redo"],
        },
        required: false,
      },
      {
        key: "web_brand",
        label: { es: "¿Tenés logo y textos, o hay que crearlos?", en: "Do you have a logo and copy, or should we create them?" },
        type: "chip",
        options: {
          es: ["Tengo todo", "Tengo el logo", "Hay que crear todo"],
          en: ["I have everything", "I have the logo", "Everything needs creating"],
        },
        required: false,
      },
      {
        key: "web_deadline",
        label: { es: "¿Para cuándo lo necesitás?", en: "When do you need it by?" },
        type: "chip",
        options: {
          es: ["Esta semana", "Este mes", "Sin apuro"],
          en: ["This week", "This month", "No rush"],
        },
        required: false,
      },
    ],
  },
  "full-stack-builds": {
    stepTitle: { es: "Sobre tu proyecto", en: "About your project" },
    questions: [
      {
        key: "fs_business",
        label: { es: "¿A qué se dedica tu negocio?", en: "What does your business do?" },
        type: "text",
        required: true,
        maxLength: 200,
      },
      {
        key: "fs_vision",
        label: { es: "¿Qué necesitás que este producto haga por tus clientes?", en: "What do you need this product to do for your customers?" },
        type: "textarea",
        required: true,
        maxLength: 500,
      },
      {
        key: "fs_current_state",
        label: { es: "¿Tenés algo construido hoy o arrancás de cero?", en: "Do you have something built today or starting from scratch?" },
        type: "chip",
        options: {
          es: ["Nada", "Landing", "Sitio basico", "Sistema completo"],
          en: ["Nothing", "Landing", "Basic site", "Full system"],
        },
        required: true,
      },
      {
        key: "fs_success",
        label: { es: "¿Cómo se vería el éxito 3 meses después del lanzamiento?", en: "What would success look like 3 months after launch?" },
        type: "textarea",
        required: true,
        maxLength: 500,
      },
      {
        key: "fs_brand_materials",
        label: { es: "¿Tenés materiales de marca (logo, colores, contenido)?", en: "Do you have brand materials (logo, colors, content)?" },
        type: "chip",
        options: {
          es: ["Si, todo", "Algunas cosas", "Nada todavia"],
          en: ["Yes, everything", "Some things", "Nothing yet"],
        },
        required: true,
      },
      {
        key: "fs_timeline",
        label: { es: "¿Cuál es tu plazo ideal?", en: "What is your ideal timeline?" },
        type: "chip",
        options: {
          es: ["Lo antes posible", "1 mes", "2-3 meses", "Sin apuro"],
          en: ["ASAP", "1 month", "2-3 months", "No rush"],
        },
        required: true,
      },
    ],
  },
  "automation-ai": {
    stepTitle: { es: "Tu proceso a automatizar", en: "Your process to automate" },
    questions: [
      {
        key: "ai_pain_task",
        label: { es: "¿Qué tarea manual te consume más tiempo en el día a día?", en: "What manual task takes the most time in your day-to-day?" },
        type: "textarea",
        required: true,
        maxLength: 500,
      },
      {
        key: "ai_handling",
        label: { es: "¿Cómo lo manejás hoy?", en: "How are you handling it today?" },
        type: "chip",
        options: {
          es: ["Manualmente", "Excel / Sheets", "Software existente", "Mezcla de todo"],
          en: ["Manually", "Excel / Sheets", "Existing software", "Mix of everything"],
        },
        required: true,
      },
      {
        key: "ai_people",
        label: { es: "¿Cuántas personas participan en este proceso?", en: "How many people are involved in this process?" },
        type: "chip",
        options: {
          es: ["Solo yo", "2-5", "6-15", "15+"],
          en: ["Just me", "2-5", "6-15", "15+"],
        },
        required: true,
      },
      {
        key: "ai_impact",
        label: { es: "¿Qué cambiaría si esto estuviera automatizado?", en: "What would change if this were automated?" },
        type: "textarea",
        required: true,
        maxLength: 500,
      },
      {
        key: "ai_data",
        label: { es: "¿Tenés datos o documentos que necesitan procesamiento?", en: "Do you have data or documents that need processing?" },
        type: "toggle",
        required: true,
      },
      {
        key: "ai_urgency",
        label: { es: "¿Qué tan urgente es esto?", en: "How urgent is this?" },
        type: "chip",
        options: {
          es: ["Critico", "Importante", "Seria bueno tenerlo", "Solo explorando"],
          en: ["Critical", "Important", "Nice to have", "Just exploring"],
        },
        required: true,
      },
    ],
  },
  "product-ux-engineering": {
    stepTitle: { es: "Tu producto o sistema", en: "Your product or system" },
    questions: [
      {
        key: "audit_product",
        label: { es: "¿Qué producto o sistema necesita revisión?", en: "What product or system needs review?" },
        type: "textarea",
        required: true,
        maxLength: 500,
      },
      {
        key: "audit_concern",
        label: { es: "¿Cuál es la principal preocupación ahora?", en: "What is the main concern right now?" },
        type: "chip",
        options: {
          es: ["Es lento", "Se rompe seguido", "Dificil de mantener", "Seguridad", "No estoy seguro"],
          en: ["It's slow", "It breaks often", "Hard to maintain", "Security worries", "Not sure"],
        },
        required: true,
      },
      {
        key: "audit_team",
        label: { es: "¿Hay un equipo de desarrollo manteniéndolo?", en: "Is there a development team maintaining it?" },
        type: "chip",
        options: {
          es: ["Solo yo", "Equipo chico", "Equipo completo", "Nadie ahora"],
          en: ["Just me", "Small team", "Full team", "No one right now"],
        },
        required: true,
      },
      {
        key: "audit_trigger",
        label: { es: "¿Qué disparó la búsqueda de ayuda?", en: "What triggered looking for help?" },
        type: "textarea",
        required: true,
        maxLength: 500,
      },
      {
        key: "audit_outcome",
        label: { es: "¿Cuál sería el resultado ideal?", en: "What would the ideal outcome be?" },
        type: "chip",
        options: {
          es: ["Diagnostico claro", "Fixes puntuales", "Roadmap completo", "Segunda opinion"],
          en: ["Clear diagnosis", "Specific fixes", "Full roadmap", "Second opinion"],
        },
        required: true,
      },
    ],
  },
  default: {
    stepTitle: { es: "Sobre tu proyecto", en: "About your project" },
    questions: [
      {
        key: "fs_business",
        label: { es: "¿A qué se dedica tu negocio?", en: "What does your business do?" },
        type: "text",
        required: true,
        maxLength: 200,
      },
      {
        key: "fs_vision",
        label: { es: "¿Qué necesitás que este producto haga por tus clientes?", en: "What do you need this product to do for your customers?" },
        type: "textarea",
        required: true,
        maxLength: 500,
      },
      {
        key: "fs_current_state",
        label: { es: "¿Tenés algo construido hoy o arrancás de cero?", en: "Do you have something built today or starting from scratch?" },
        type: "chip",
        options: {
          es: ["Nada", "Landing", "Sitio basico", "Sistema completo"],
          en: ["Nothing", "Landing", "Basic site", "Full system"],
        },
        required: true,
      },
      {
        key: "fs_success",
        label: { es: "¿Cómo se vería el éxito 3 meses después del lanzamiento?", en: "What would success look like 3 months after launch?" },
        type: "textarea",
        required: true,
        maxLength: 500,
      },
      {
        key: "fs_brand_materials",
        label: { es: "¿Tenés materiales de marca (logo, colores, contenido)?", en: "Do you have brand materials (logo, colors, content)?" },
        type: "chip",
        options: {
          es: ["Si, todo", "Algunas cosas", "Nada todavia"],
          en: ["Yes, everything", "Some things", "Nothing yet"],
        },
        required: true,
      },
      {
        key: "fs_timeline",
        label: { es: "¿Cuál es tu plazo ideal?", en: "What is your ideal timeline?" },
        type: "chip",
        options: {
          es: ["Lo antes posible", "1 mes", "2-3 meses", "Sin apuro"],
          en: ["ASAP", "1 month", "2-3 months", "No rush"],
        },
        required: true,
      },
    ],
  },
};

/* -------------------------------------------------------------------------- */
/*  Bilingual labels                                                          */
/* -------------------------------------------------------------------------- */

const labels = {
  es: {
    steps: [
      "Tus datos",
      "Sobre tu negocio",
      "Qué vamos a construir",
      "Detalles prácticos",
    ],
    // Step 1
    s1_business_q: "¿Cómo describirías tu negocio en una oración?",
    s1_business_ph: "Ej: Vendo ropa deportiva online y en local",
    s1_problem_q: "¿Qué te gustaría que tu negocio pueda hacer y hoy no puede?",
    s1_problem_ph: "Ej: Quiero que mis clientes compren online y les llegue a domicilio",
    s1_current_q: "¿Cómo manejás eso hoy?",
    s1_current_opts: ["Papel", "Excel", "WhatsApp", "Sistema existente"],
    // Step 3
    s3_brand_q: "¿Tenés logo y marca, o hay que crearlos?",
    s3_brand_yes: "Ya tengo",
    s3_brand_no: "Hay que crear",
    s3_content_q: "¿Tenés los textos e imágenes, o hay que generarlos?",
    s3_content_yes: "Ya tengo",
    s3_content_no: "Hay que generar",
    s3_budget_q: "¿Qué presupuesto tenés en mente?",
    s3_budget_opts: ["< $300", "$300 - $800", "$800 - $2000", "> $2000", "No definido"],
    s3_timeline_q: "¿Para cuándo lo necesitás?",
    s3_timeline_opts: ["Lo antes posible", "1 mes", "2-3 meses", "Sin apuro"],
    s3_call_q: "¿Zoom o WhatsApp para la llamada?",
    s3_call_opts: ["Zoom", "WhatsApp"],
    // Step 4
    s4_name_q: "Nombre",
    s4_name_ph: "Tu nombre completo",
    s4_email_q: "Email",
    s4_email_ph: "tu@email.com",
    s4_phone_q: "Teléfono (opcional)",
    s4_phone_ph: "+54 9 11 1234-5678",
    // Buttons
    next: "Siguiente",
    back: "Anterior",
    submit: "Enviar",
    submitting: "Enviando...",
    // Validation
    required: "Este campo es requerido.",
    requiredSelect: "Seleccioná una opción.",
    invalidEmail: "Email invalido.",
    // Success
    successTitle: "Recibimos tu información",
    successMessage: "Te vamos a contactar pronto para agendar la llamada de diagnóstico.",
    submitNow: "Enviar y seguir después",
    optionalNote: "Todo lo que sigue es opcional: cuanto más nos cuentes, más precisa es la propuesta.",
    successCta: "Agendar ahora",
    // Errors
    submitError: "Algo salio mal. Intenta de nuevo.",
    // Toggle
    yes: "Si",
    no: "No",
  },
  en: {
    steps: [
      "Your info",
      "About your business",
      "What are we building",
      "Practical details",
    ],
    // Step 1
    s1_business_q: "How would you describe your business in one sentence?",
    s1_business_ph: "E.g. I sell athletic wear online and in store",
    s1_problem_q: "What would you like your business to be able to do that it can't today?",
    s1_problem_ph: "E.g. I want my customers to buy online and get home delivery",
    s1_current_q: "How do you handle this today?",
    s1_current_opts: ["Paper", "Excel", "WhatsApp", "Existing system"],
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
    requiredSelect: "Please select an option.",
    invalidEmail: "Invalid email address.",
    // Success
    successTitle: "We received your information",
    successMessage: "We will reach out soon to schedule the diagnostic call.",
    submitNow: "Send and finish later",
    optionalNote: "Everything below is optional: the more you share, the more precise the proposal.",
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
  // Legacy Step 2 fields (used when no service is active / default service)
  tipo_proyecto: string;
  secciones: string;
  tiene_login: boolean | null;
  tiene_pagos: boolean | null;
  tiene_admin: string | null;
  integraciones: string[];
  idiomas: number;
  // Service-specific Step 2 fields
  serviceData: Record<string, string | string[] | boolean | number | null>;
  // Step 3
  tiene_marca: boolean | null;
  tiene_contenido: boolean | null;
  presupuesto_rango: string;
  plazo: string;
  canal_llamada: string;
  // Step 4
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
  serviceData: {},
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
        <FieldError message={errors.current_situation} />
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-xs text-red-300">{message}</span>;
}

/* -------------------------------------------------------------------------- */
/*  Service-aware Step 2 renderer (PR1-2)                                     */
/* -------------------------------------------------------------------------- */

function ServiceStep2({
  locale,
  questionSet,
  serviceData,
  errors,
  onServiceDataChange,
  yesLabel,
  noLabel,
}: {
  locale: "es" | "en";
  questionSet: ServiceQuestionSet;
  serviceData: Record<string, string | string[] | boolean | number | null>;
  errors: Record<string, string>;
  onServiceDataChange: (key: string, value: string | string[] | boolean | number | null) => void;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <div className="space-y-6">
      {questionSet.questions.map((q) => {
        // Conditional visibility
        if (q.showWhen) {
          const dep = serviceData[q.showWhen.key];
          const depValue = dep === true ? "yes" : dep === false ? "no" : String(dep ?? "");
          if (!q.showWhen.values.includes(depValue)) return null;
        }

        const currentValue = serviceData[q.key] ?? (q.multi ? [] : q.type === "number" ? 1 : "");

        if (q.type === "chip" && q.options) {
          return (
            <div key={q.key} className="space-y-2">
              <FieldLabel>{q.label[locale]}</FieldLabel>
              <ChipSelect
                options={q.options[locale]}
                selected={currentValue as string | string[]}
                onChange={(v) => onServiceDataChange(q.key, v)}
                multi={q.multi}
              />
              <FieldError message={errors[q.key]} />
            </div>
          );
        }

        if (q.type === "toggle") {
          const boolValue = currentValue === null || currentValue === "" ? null : currentValue === true || currentValue === "yes";
          return (
            <div key={q.key} className="space-y-2">
              <FieldLabel>{q.label[locale]}</FieldLabel>
              <PillToggle
                value={boolValue as boolean | null}
                onChange={(v) => onServiceDataChange(q.key, v ? "yes" : "no")}
                yesLabel={yesLabel}
                noLabel={noLabel}
              />
              <FieldError message={errors[q.key]} />
            </div>
          );
        }

        if (q.type === "text") {
          return (
            <label key={q.key} className="block space-y-2">
              <FieldLabel>{q.label[locale]}</FieldLabel>
              <input
                type="text"
                value={currentValue as string}
                onChange={(e) => onServiceDataChange(q.key, e.target.value)}
                maxLength={q.maxLength}
                className={cn(
                  "field-shell",
                  errors[q.key] ? "border-red-400/60" : "border-outline-ghost/15"
                )}
              />
              <FieldError message={errors[q.key]} />
            </label>
          );
        }

        if (q.type === "textarea") {
          return (
            <label key={q.key} className="block space-y-2">
              <FieldLabel>{q.label[locale]}</FieldLabel>
              <textarea
                rows={3}
                value={currentValue as string}
                onChange={(e) => onServiceDataChange(q.key, e.target.value)}
                maxLength={q.maxLength}
                className={cn(
                  "field-shell min-h-[5rem] resize-none",
                  errors[q.key] ? "border-red-400/60" : "border-outline-ghost/15"
                )}
              />
              <FieldError message={errors[q.key]} />
            </label>
          );
        }

        if (q.type === "number") {
          return (
            <label key={q.key} className="block space-y-2">
              <FieldLabel>{q.label[locale]}</FieldLabel>
              <input
                type="number"
                min={1}
                max={100}
                value={currentValue as number}
                onChange={(e) => onServiceDataChange(q.key, Math.max(1, parseInt(e.target.value) || 1))}
                className="field-shell w-24 border-outline-ghost/15"
              />
              <FieldError message={errors[q.key]} />
            </label>
          );
        }

        return null;
      })}
    </div>
  );
}


function Step3({
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
      <div className="space-y-2">
        <FieldLabel>{l.s3_brand_q}</FieldLabel>
        <PillToggle
          value={data.tiene_marca}
          onChange={(v) => onChange("tiene_marca", v)}
          yesLabel={l.s3_brand_yes}
          noLabel={l.s3_brand_no}
        />
        <FieldError message={errors.tiene_marca} />
      </div>

      <div className="space-y-2">
        <FieldLabel>{l.s3_content_q}</FieldLabel>
        <PillToggle
          value={data.tiene_contenido}
          onChange={(v) => onChange("tiene_contenido", v)}
          yesLabel={l.s3_content_yes}
          noLabel={l.s3_content_no}
        />
        <FieldError message={errors.tiene_contenido} />
      </div>

      <div className="space-y-2">
        <FieldLabel>{l.s3_budget_q}</FieldLabel>
        <ChipSelect
          options={l.s3_budget_opts}
          selected={data.presupuesto_rango}
          onChange={(v) => onChange("presupuesto_rango", v as string)}
        />
        <FieldError message={errors.presupuesto_rango} />
      </div>

      <div className="space-y-2">
        <FieldLabel>{l.s3_timeline_q}</FieldLabel>
        <ChipSelect
          options={l.s3_timeline_opts}
          selected={data.plazo}
          onChange={(v) => onChange("plazo", v as string)}
        />
        <FieldError message={errors.plazo} />
      </div>

      <div className="space-y-2">
        <FieldLabel>{l.s3_call_q}</FieldLabel>
        <ChipSelect
          options={l.s3_call_opts}
          selected={data.canal_llamada}
          onChange={(v) => onChange("canal_llamada", v as string)}
        />
        <FieldError message={errors.canal_llamada} />
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
/*  ServiceSlug parsing from URL hash                                         */
/* -------------------------------------------------------------------------- */

const VALID_SERVICE_SLUGS: ServiceSlug[] = [
  "web-presence",
  "full-stack-builds",
  "automation-ai",
  "product-ux-engineering",
];

export function parseServiceFromHash(hash: string): ServiceSlug | undefined {
  // hash may look like: #intake?service=automation-ai or #intake
  const queryPart = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "";
  const params = new URLSearchParams(queryPart);
  const slug = params.get("service");
  if (slug && VALID_SERVICE_SLUGS.includes(slug as ServiceSlug)) {
    return slug as ServiceSlug;
  }
  return undefined;
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

export default function IntakeForm({
  locale,
  service: serviceProp,
}: {
  locale: string;
  service?: ServiceSlug;
}) {
  const resolvedLocale = locale === "es" || locale === "en" ? locale : "en";
  const l = labels[resolvedLocale];
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [leadId, setLeadId] = useState<string | null>(null);
  // PR1-2: active service state — initialized from prop or hash
  const [activeService, setActiveService] = useState<ServiceSlug | undefined>(serviceProp);

  // PR1-2: read hash on mount and listen for hashchange
  useEffect(() => {
    function readHash() {
      const slug = parseServiceFromHash(window.location.hash);
      if (slug) setActiveService(slug);
    }

    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  const questionSet = serviceQuestions[activeService ?? "default"];

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function updateServiceData(key: string, value: string | string[] | boolean | number | null) {
    setData((prev) => ({
      ...prev,
      serviceData: { ...prev.serviceData, [key]: value },
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validateStep(stepIndex: number): boolean {
    const e: Record<string, string> = {};

    // Paso 0 — contacto: lo único obligatorio. Capturamos el lead antes de
    // pedir nada más, para no perderlo si abandona el resto del formulario.
    if (stepIndex === 0) {
      if (!data.nombre.trim()) e.nombre = l.required;
      if (!data.email.trim()) {
        e.email = l.required;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        e.email = l.invalidEmail;
      }
    }

    // Pasos 1 a 3 — contexto del proyecto: todos opcionales.
    if (stepIndex === 99) {
      for (const q of questionSet.questions) {
        if (!q.required) continue;

        // Skip conditionally hidden questions
        if (q.showWhen) {
          const dep = data.serviceData[q.showWhen.key];
          const depValue = dep === true ? "yes" : dep === false ? "no" : String(dep ?? "");
          if (!q.showWhen.values.includes(depValue)) continue;
        }

        const val = data.serviceData[q.key];

        if (q.type === "toggle") {
          if (val === undefined || val === null || val === "") {
            e[q.key] = l.requiredSelect;
          }
        } else if (q.multi) {
          if (!Array.isArray(val) || val.length === 0) {
            e[q.key] = l.requiredSelect;
          }
        } else if (q.type === "text" || q.type === "textarea") {
          if (!val || String(val).trim() === "") {
            e[q.key] = l.required;
          }
        } else if (q.type === "chip") {
          if (!val || val === "") {
            e[q.key] = l.requiredSelect;
          }
        }
        // number type: value defaults to 1 so always valid
      }
    }


    setErrors(e);
    return Object.keys(e).length === 0;
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
    if (!validateStep(0)) return;

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
      service: activeService,
      serviceData: Object.keys(data.serviceData).length > 0 ? data.serviceData : undefined,
      // Legacy fields for backward compat (populated when using default service)
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
        setLeadId(result.id);
        // PR1-4: include service param in redirect URL
        const params = new URLSearchParams({
          leadId: result.id,
          name: data.nombre.trim(),
          email: data.email.trim().toLowerCase(),
          ...(activeService ? { service: activeService } : {}),
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

  // Compute step title — Step 2 title adapts to active service
  const stepTitles = [...l.steps] as string[];
  if (activeService) {
    stepTitles[2] = questionSet.stepTitle[resolvedLocale];
  }

  // Success state
  if (status === "success") {
    // PR1-4: include service in the success CTA link
    const agendarParams = new URLSearchParams({
      ...(leadId ? { leadId, name: data.nombre.trim(), email: data.email.trim().toLowerCase() } : {}),
      ...(activeService ? { service: activeService } : {}),
    });
    return (
      <div className="surface-panel border border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.9),rgb(var(--surface)/0.76))] px-6 py-10 text-center sm:px-10 sm:py-14">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
        <h3 className="mt-4 card-title">{l.successTitle}</h3>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-text-secondary">
          {l.successMessage}
        </p>
        <Link
          href={`/${resolvedLocale}/services/agendar${agendarParams.toString() ? `?${agendarParams.toString()}` : ""}`}
          className="mt-6 inline-block font-mono text-[11px] uppercase tracking-[0.18em] text-brand-primary hover:underline"
        >
          {l.successCta}
        </Link>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
          {resolvedLocale === "es" ? "Redirigiendo..." : "Redirecting..."}
        </p>
      </div>
    );
  }

  return (
    <div className="surface-panel relative border border-outline-ghost/10 bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.9),rgb(var(--surface)/0.76))] px-6 py-7 sm:px-7 sm:py-8 lg:px-8">
      {/* Step indicator */}
      <div className="mb-8">
        <StepIndicator steps={stepTitles} current={step} />
      </div>

      {/* Step title */}
      <h3 className="mb-6 card-title">
        {stepTitles[step]}
      </h3>

      {/* Aviso de opcionalidad: a partir del paso 1 nada es obligatorio */}
      {step > 0 && (
        <p className="mb-6 text-sm leading-6 text-text-tertiary">{l.optionalNote}</p>
      )}

      {/* Step content */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 3) handleNext();
          else void handleSubmit();
        }}
        noValidate
      >
        {step === 0 && <Step4 data={data} l={l} errors={errors} onChange={updateField} />}
        {step === 1 && <Step1 data={data} l={l} errors={errors} onChange={updateField} />}
        {step === 2 && (
          <ServiceStep2
            locale={resolvedLocale}
            questionSet={questionSet}
            serviceData={data.serviceData}
            errors={errors}
            onServiceDataChange={updateServiceData}
            yesLabel={l.yes}
            noLabel={l.no}
          />
        )}
        {step === 3 && <Step3 data={data} l={l} errors={errors} onChange={updateField} />}

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
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={status === "submitting"}
                  className="button-secondary inline-flex items-center gap-2"
                >
                  <span>{l.submitNow}</span>
                </button>
              )}
              <button
                type="submit"
                className="button-primary inline-flex items-center gap-2"
              >
                <span>{l.next}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
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
