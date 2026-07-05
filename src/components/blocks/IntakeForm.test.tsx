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

describe("serviceQuestions map", () => {
  it("full-stack-builds has 7 questions", () => {
    expect(serviceQuestions["full-stack-builds"].questions).toHaveLength(7);
  });

  it("automation-ai has 6 questions", () => {
    expect(serviceQuestions["automation-ai"].questions).toHaveLength(6);
  });

  it("product-ux-engineering has 5 questions", () => {
    expect(serviceQuestions["product-ux-engineering"].questions).toHaveLength(5);
  });

  it("default has 7 questions matching generic Step 2", () => {
    expect(serviceQuestions["default"].questions).toHaveLength(7);
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

  it("automation-ai Q6 has showWhen pointing to Q5", () => {
    const q6 = serviceQuestions["automation-ai"].questions[5];
    expect(q6.key).toBe("ai_format");
    expect(q6.showWhen).toBeDefined();
    expect(q6.showWhen?.key).toBe("ai_data");
    expect(q6.showWhen?.values).toContain("yes");
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

  it("renders 7 questions for full-stack-builds service prop", async () => {
    render(<IntakeForm locale="en" service="full-stack-builds" />);
    await advanceToStep2();

    // All 7 question labels should appear on screen
    const qs = serviceQuestions["full-stack-builds"].questions;
    for (const q of qs) {
      expect(screen.getByText(q.label.en)).toBeInTheDocument();
    }
  });

  it("renders Q1-Q5 for automation-ai and hides Q6 initially", async () => {
    render(<IntakeForm locale="en" service="automation-ai" />);
    await advanceToStep2();

    const q5Label = serviceQuestions["automation-ai"].questions[4].label.en;
    const q6Label = serviceQuestions["automation-ai"].questions[5].label.en;

    expect(screen.getByText(q5Label)).toBeInTheDocument();
    // Q6 (ai_format) should be hidden because Q5 (ai_data) not yet answered as "yes"
    expect(screen.queryByText(q6Label)).not.toBeInTheDocument();
  });

  it("shows Q6 when Q5 (existing data) is answered Yes for automation-ai", async () => {
    render(<IntakeForm locale="en" service="automation-ai" />);
    await advanceToStep2();

    const q6Label = serviceQuestions["automation-ai"].questions[5].label.en;

    // Click "Yes" toggle for Q5
    const yesButtons = screen.getAllByRole("button", { name: "Yes" });
    // Q5 is the toggle "Do you have existing data/files to process?"
    // The first Yes button could be for any toggle — we need the one for ai_data
    // Since Q3 and Q4 are chip selects (not toggles), the only toggle before Q6 is Q5 (ai_data)
    fireEvent.click(yesButtons[0]);

    // Q6 should now be visible
    expect(screen.getByText(q6Label)).toBeInTheDocument();
  });

  it("renders 5 questions for product-ux-engineering via service prop", async () => {
    render(<IntakeForm locale="es" service="product-ux-engineering" />);
    await advanceToStep2();

    const qs = serviceQuestions["product-ux-engineering"].questions;
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
