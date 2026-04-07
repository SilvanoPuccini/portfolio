import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ContactForm from "@/components/blocks/ContactForm";

const labels = {
  title: "Send me a message",
  fields: {
    name: "Name",
    email: "Email",
    subject: "Subject",
    message: "Message",
  },
  placeholders: {
    name: "Your name",
    email: "you@email.com",
    subject: "What are you working on?",
    message: "Tell me about your project.",
  },
  submit: "Send proposal",
  sending: "Sending…",
  success: "Message sent. If everything went through, I’ll reply by email.",
  error: "Review the fields and try again. If it persists, you can contact me directly by email.",
  helper: "This message is sent through Formspree and stays integrated with the same editorial language used across the site.",
  validation: {
    required: "This field is required.",
    email: "Enter a valid email address.",
  },
};

describe("ContactForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows inline validation and keeps feedback integrated inside the form panel", async () => {
    render(<ContactForm action="https://formspree.io/f/test" locale="en" labels={labels} />);

    fireEvent.click(screen.getByRole("button", { name: labels.submit }));

    expect(await screen.findAllByText(labels.validation.required)).toHaveLength(4);
    expect(screen.getByText("Review required")).toBeInTheDocument();
    expect(screen.getByText(labels.error)).toBeInTheDocument();
  });

  it("shows a success state after a valid submission", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    render(<ContactForm action="https://formspree.io/f/test" locale="en" labels={labels} />);

    fireEvent.change(screen.getByLabelText(labels.fields.name), { target: { value: "Silvano" } });
    fireEvent.change(screen.getByLabelText(labels.fields.email), { target: { value: "silvano@example.com" } });
    fireEvent.change(screen.getByLabelText(labels.fields.subject), { target: { value: "Portfolio rebuild" } });
    fireEvent.change(screen.getByLabelText(labels.fields.message), { target: { value: "Need help with final QA." } });
    fireEvent.click(screen.getByRole("button", { name: labels.submit }));

    await waitFor(() => {
      expect(screen.getByText("Message delivered")).toBeInTheDocument();
      expect(screen.getByText(labels.success)).toBeInTheDocument();
    });
  });
});
