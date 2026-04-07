import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LocaleSwitcher from "@/components/site/LocaleSwitcher";

const usePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

describe("LocaleSwitcher", () => {
  beforeEach(() => {
    usePathname.mockReset();
  });

  it("shows a single square toggle to switch from spanish to english", () => {
    usePathname.mockReturnValue("/es/contact");

    render(<LocaleSwitcher locale="es" />);

    const toggle = screen.getByRole("link", { name: "EN" });

    expect(toggle).toHaveAttribute("href", "/en/contact");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("shows a single square toggle to switch from english to spanish", () => {
    usePathname.mockReturnValue("/en/contact");

    render(<LocaleSwitcher locale="en" />);

    const toggle = screen.getByRole("link", { name: "ES" });

    expect(toggle).toHaveAttribute("href", "/es/contact");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
