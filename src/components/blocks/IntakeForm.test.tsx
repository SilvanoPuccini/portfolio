import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import IntakeForm, { serviceQuestions, parseServiceFromHash } from "@/components/blocks/IntakeForm";

/* -------------------------------------------------------------------------- */
/*  Mocks                                                                     */
/* -------------------------------------------------------------------------- */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

/* -------------------------------------------------------------------------- */
/*  PR1-1: serviceQuestions map shape                                         */
/* -------------------------------------------------------------------------- */

describe("serviceQuestions map — business-oriented questions", () => {
  it("full-stack-builds has 6 business-oriented questions", () => {
    expect(serviceQuestions["full-stack-builds"].questions).toHaveLength(6);
  });

  it("automation-ai has 6 business-oriented questions", () => {
    expect(serviceQuestions["automation-ai"].questions).toHaveLength(6);
  });

  it("product-ux-engineering has 5 business-oriented questions", () => {
    expect(serviceQuestions["product-ux-engineering"].questions).toHaveLength(5);
  });

  it("default mirrors full-stack-builds with 6 questions", () => {
    expect(serviceQuestions["default"].questions).toHaveLength(6);
  });

  it("full-stack-builds keys are business-focused (fs_business, fs_vision, etc.)", () => {
    const keys = serviceQuestions["full-stack-builds"].questions.map((q) => q.key);
    expect(keys).toEqual([
      "fs_business",
      "fs_vision",
      "fs_current_state",
      "fs_success",
      "fs_brand_materials",
      "fs_timeline",
    ]);
  });

  it("automation-ai keys are business-focused (ai_pain_task, ai_handling, etc.)", () => {
    const keys = serviceQuestions["automation-ai"].questions.map((q) => q.key);
    expect(keys).toEqual([
      "ai_pain_task",
      "ai_handling",
      "ai_people",
      "ai_impact",
      "ai_data",
      "ai_urgency",
    ]);
  });

  it("product-ux-engineering keys are business-focused (audit_product, audit_concern, etc.)", () => {
    const keys = serviceQuestions["product-ux-engineering"].questions.map((q) => q.key);
    expect(keys).toEqual([
      "audit_product",
      "audit_concern",
      "audit_team",
      "audit_trigger",
      "audit_outcome",
    ]);
  });

  it("every question has es and en labels", () => {
    for (const [slug, set] of Object.entries(serviceQuestions)) {
      for (const q of set.questions) {
        expect(q.label.es, `${slug}/${q.key} missing es label`).toBeTruthy();
        expect(q.label.en, `${slug}/${q.key} missing en label`).toBeTruthy();
        if (q.options) {
          expect(q.options.es.length, `${slug}/${q.key} es options empty`).toBeGreaterThan(0);
          expect(q.options.en.length, `${slug}/${q.key} en options empty`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("automation-ai ai_data is a toggle question (no showWhen)", () => {
    const aiData = serviceQuestions["automation-ai"].questions.find((q) => q.key === "ai_data");
    expect(aiData).toBeDefined();
    expect(aiData!.type).toBe("toggle");
  });

  it("no questions use showWhen in the new business-oriented set", () => {
    for (const [, set] of Object.entries(serviceQuestions)) {
      for (const q of set.questions) {
        expect(q.showWhen, `${q.key} should not have showWhen`).toBeUndefined();
      }
    }
  });
});

/* -------------------------------------------------------------------------- */
/*  PR1-1: parseServiceFromHash (exported for testing)                        */
/* -------------------------------------------------------------------------- */

describe("parseServiceFromHash", () => {
  it("parses automation-ai from hash", () => {
    expect(parseServiceFromHash("#intake?service=automation-ai")).toBe("automation-ai");
  });

  it("parses full-stack-builds from hash", () => {
    expect(parseServiceFromHash("#intake?service=full-stack-builds")).toBe("full-stack-builds");
  });

  it("parses product-ux-engineering from hash", () => {
    expect(parseServiceFromHash("#intake?service=product-ux-engineering")).toBe("product-ux-engineering");
  });

  it("returns undefined for unknown slug", () => {
    expect(parseServiceFromHash("#intake?service=unknown-slug")).toBeUndefined();
  });

  it("returns undefined for hash with no service param", () => {
    expect(parseServiceFromHash("#intake")).toBeUndefined();
  });

  it("returns undefined for empty hash", () => {
    expect(parseServiceFromHash("")).toBeUndefined();
  });
});

/* -------------------------------------------------------------------------- */
/*  PR1-2: service prop → Step 2 renders service-specific questions          */
/* -------------------------------------------------------------------------- */

describe("IntakeForm — service prop", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function advanceToStep2() {
    // Step 1: fill required fields and advance
    fireEvent.change(screen.getByPlaceholderText(/Ej: Vendo ropa|E\.g\. I sell/i), {
      target: { value: "Test business" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/Ej: Quiero|E\.g\. I want/i),
      { target: { value: "Test problem" } }
    );
    // Select a chip in s1_current (first chip)
    const chips = screen.getAllByRole("button");
    const paperChip = chips.find((b) => b.textContent === "Papel" || b.textContent === "Paper");
    if (paperChip) fireEvent.click(paperChip);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Siguiente|Next/i }));
    });
  }

  it("renders 6 business-oriented questions for full-stack-builds", async () => {
    render(<IntakeForm locale="en" service="full-stack-builds" />);
    await advanceToStep2();

    const qs = serviceQuestions["full-stack-builds"].questions;
    expect(qs).toHaveLength(6);
    for (const q of qs) {
      expect(screen.getByText(q.label.en)).toBeInTheDocument();
    }
  });

  it("renders all 6 questions for automation-ai (no conditional visibility)", async () => {
    render(<IntakeForm locale="en" service="automation-ai" />);
    await advanceToStep2();

    const qs = serviceQuestions["automation-ai"].questions;
    expect(qs).toHaveLength(6);
    for (const q of qs) {
      expect(screen.getByText(q.label.en)).toBeInTheDocument();
    }
  });

  it("renders 5 questions for product-ux-engineering via service prop", async () => {
    render(<IntakeForm locale="es" service="product-ux-engineering" />);
    await advanceToStep2();

    const qs = serviceQuestions["product-ux-engineering"].questions;
    expect(qs).toHaveLength(5);
    for (const q of qs) {
      expect(screen.getByText(q.label.es)).toBeInTheDocument();
    }
  });
});

/* -------------------------------------------------------------------------- */
/*  PR1-2: hash reading — mocked window.location.hash                        */
/* -------------------------------------------------------------------------- */

describe("IntakeForm — hash-based service detection", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    // Reset hash
    Object.defineProperty(window, "location", {
      value: { hash: "" },
      writable: true,
    });
  });

  it("reads service slug from window.location.hash on mount", async () => {
    Object.defineProperty(window, "location", {
      value: { hash: "#intake?service=full-stack-builds" },
      writable: true,
    });

    render(<IntakeForm locale="en" />);

    // Advance to step 2
    fireEvent.change(screen.getByPlaceholderText(/E\.g\. I sell/i), {
      target: { value: "Test business" },
    });
    fireEvent.change(screen.getByPlaceholderText(/E\.g\. I want/i), {
      target: { value: "Test problem" },
    });
    const chips = screen.getAllByRole("button");
    const paperChip = chips.find((b) => b.textContent === "Paper");
    if (paperChip) fireEvent.click(paperChip);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    });

    // Should show full-stack-builds questions
    const firstQ = serviceQuestions["full-stack-builds"].questions[0].label.en;
    expect(screen.getByText(firstQ)).toBeInTheDocument();
  });
});
