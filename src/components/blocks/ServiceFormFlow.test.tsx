import { fireEvent, render, screen } from "@testing-library/react";
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

describe("ServiceFormFlow", () => {
  it("renders all service cards when no service is active", () => {
    render(
      <ServiceFormFlow locale="en" cards={mockCards} />
    );

    expect(screen.getByText("Custom web development")).toBeInTheDocument();
    expect(screen.getByText("AI automation")).toBeInTheDocument();
  });

  it("shows the IntakeForm when a service CTA is clicked", () => {
    render(
      <ServiceFormFlow locale="en" cards={mockCards} />
    );

    const ctaButton = screen.getByRole("button", { name: /Request a quote/i });
    fireEvent.click(ctaButton);

    // IntakeForm should now be visible (step indicator + step heading both show the step title)
    expect(screen.getAllByText("About your business").length).toBeGreaterThanOrEqual(1);
    // Service cards should be hidden
    expect(screen.queryByText("AI automation")).not.toBeInTheDocument();
  });

  it("shows a back button that returns to service cards", () => {
    render(
      <ServiceFormFlow locale="en" cards={mockCards} />
    );

    // Click a CTA to show the form
    fireEvent.click(screen.getByRole("button", { name: /Request a quote/i }));

    // Click back button
    const backButton = screen.getByRole("button", { name: /Back to services|Volver a servicios/i });
    fireEvent.click(backButton);

    // Service cards should reappear
    expect(screen.getByText("Custom web development")).toBeInTheDocument();
    expect(screen.getByText("AI automation")).toBeInTheDocument();
  });

  it("passes the correct service slug to IntakeForm", () => {
    render(
      <ServiceFormFlow locale="en" cards={mockCards} />
    );

    // Click automation-ai CTA
    fireEvent.click(screen.getByRole("button", { name: /Check feasibility/i }));

    // IntakeForm should be visible with step 1 content
    expect(screen.getAllByText("About your business").length).toBeGreaterThanOrEqual(1);
    // Back to services button should be present
    expect(screen.getByRole("button", { name: /Back to services/i })).toBeInTheDocument();
  });
});
