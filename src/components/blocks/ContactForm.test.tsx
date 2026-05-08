import { act, fireEvent, render, screen } from "@testing-library/react";
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
  validation: {
    required: "This field is required.",
    email: "Enter a valid email address.",
  },
};

describe("ContactForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("does not render a permanent helper message before submission", () => {
    render(<ContactForm locale="en" labels={labels} />);

    expect(screen.queryByText("Ready to receive your message")).not.toBeInTheDocument();
  });

  it("shows inline validation and an error toast when submission is invalid", async () => {
    render(<ContactForm locale="en" labels={labels} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.submit }));
    });

    expect(screen.getAllByText(labels.validation.required)).toHaveLength(4);
    expect(document.getElementById("contact-form-status")).not.toBeNull();
    expect(screen.getByText(labels.error)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4200);
    });

    expect(screen.queryByText(labels.error)).not.toBeInTheDocument();
  });

  it("shows a temporary success toast after a valid submission", async () => {
    let doResolve: (() => void) | undefined;

    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          doResolve = () =>
            resolve(
              new Response("{}", {
                status: 200,
                headers: { "Content-Type": "application/json" },
              })
            );
        }),
    );

    render(<ContactForm locale="en" labels={labels} />);

    fireEvent.change(screen.getByLabelText(labels.fields.name), { target: { value: "Silvano" } });
    fireEvent.change(screen.getByLabelText(labels.fields.email), { target: { value: "silvano@example.com" } });
    fireEvent.change(screen.getByLabelText(labels.fields.subject), { target: { value: "Portfolio rebuild" } });
    fireEvent.change(screen.getByLabelText(labels.fields.message), { target: { value: "Need help with final QA." } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.submit }));
    });

    expect(document.getElementById("contact-form-status")).not.toBeNull();
    expect(screen.getAllByText(labels.sending).length).toBeGreaterThan(0);

    await act(async () => {
      doResolve?.();
    });

    await act(async () => {
      await Promise.resolve();
    });

    // Toast muestra label "Sent" + message de labels.success
    expect(screen.getByText("Sent")).toBeInTheDocument();
    expect(screen.getByText(labels.success)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4200);
    });

    expect(screen.queryByText("Sent")).not.toBeInTheDocument();
    expect(screen.queryByText(labels.success)).not.toBeInTheDocument();
  });

  it("shows a temporary error message when the remote submission fails", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, json: vi.fn().mockResolvedValue({}) } as unknown as Response);

    render(<ContactForm locale="en" labels={labels} />);

    fireEvent.change(screen.getByLabelText(labels.fields.name), { target: { value: "Silvano" } });
    fireEvent.change(screen.getByLabelText(labels.fields.email), { target: { value: "silvano@example.com" } });
    fireEvent.change(screen.getByLabelText(labels.fields.subject), { target: { value: "Portfolio rebuild" } });
    fireEvent.change(screen.getByLabelText(labels.fields.message), { target: { value: "Need help with final QA." } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.submit }));
    });

    await act(async () => {
      await Promise.resolve();
    });

    // Toast muestra label "Error" + message de labels.error
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText(labels.error)).toBeInTheDocument();
  });
});
