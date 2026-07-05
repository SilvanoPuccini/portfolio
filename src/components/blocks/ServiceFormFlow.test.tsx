import { fireEvent, render, screen, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ServiceFormFlow from "@/components/blocks/ServiceFormFlow";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mockCards = [
  {
    number: "01",
    subtitle: "The digital backbone",
    title: "Custom web development",
    description: "End-to-end build.",
    details: [
      { label: "Frontend", value: "Next.js / React / TypeScript" },
    ],
    references: ["FerrelonStock", "Aktivar"],
    cta: "Request a quote",
    slug: "full-stack-builds" as const,
  },
  {
    number: "02",
    subtitle: "Processes that run without you",
    title: "AI automation",
    description: "Flows that replace repetitive work.",
    details: [
      { label: "Processes", value: "Classification / extraction" },
    ],
    references: ["FacturIA 2.0"],
    cta: "Check feasibility",
    slug: "automation-ai" as const,
  },
];

async function clickAndWaitTransition(button: HTMLElement) {
  fireEvent.click(button);
  // Wait for the 200ms setTimeout transition
  await act(async () => {
    await new Promise((r) => setTimeout(r, 250));
  });
}

describe("ServiceFormFlow", () => {
  it("renders all service cards when no service is active", () => {
    render(
      <ServiceFormFlow locale="en" cards={mockCards} />
    );

    expect(screen.getByText("Custom web development")).toBeInTheDocument();
    expect(screen.getByText("AI automation")).toBeInTheDocument();
  });

  it("shows the IntakeForm when a service CTA is clicked", async () => {
    render(
      <ServiceFormFlow locale="en" cards={mockCards} />
    );

    const ctaButton = screen.getByRole("button", { name: /Request a quote/i });
    await clickAndWaitTransition(ctaButton);

    expect(screen.getAllByText("About your business").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("AI automation")).not.toBeInTheDocument();
  });

  it("shows a back button that returns to service cards", async () => {
    render(
      <ServiceFormFlow locale="en" cards={mockCards} />
    );

    await clickAndWaitTransition(screen.getByRole("button", { name: /Request a quote/i }));

    const backButton = screen.getByRole("button", { name: /Back to services|Volver a servicios/i });
    await clickAndWaitTransition(backButton);

    expect(screen.getByText("Custom web development")).toBeInTheDocument();
    expect(screen.getByText("AI automation")).toBeInTheDocument();
  });

  it("passes the correct service slug to IntakeForm", async () => {
    render(
      <ServiceFormFlow locale="en" cards={mockCards} />
    );

    await clickAndWaitTransition(screen.getByRole("button", { name: /Check feasibility/i }));

    expect(screen.getAllByText("About your business").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: /Back to services/i })).toBeInTheDocument();
  });
});
