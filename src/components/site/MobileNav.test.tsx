import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MobileNav from "@/components/site/MobileNav";

const usePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

describe("MobileNav", () => {
  beforeEach(() => {
    usePathname.mockReset();
    usePathname.mockReturnValue("/es");
  });

  it("renders the compact second-row nav as a single inline grid", () => {
    render(<MobileNav locale="es" open />);

    const nav = screen.getByRole("navigation", { name: "Navegación móvil" });
    const links = within(nav).getAllByRole("link");

    expect(links).toHaveLength(6);
    expect(nav).toHaveClass("grid");
    expect(nav).toHaveClass("grid-cols-6");
    expect(nav).not.toHaveClass("flex-col");
    expect(links[0]).toHaveTextContent("Home");
    expect(links[3]).toHaveTextContent("Servicio");

    for (const link of links) {
      expect(link).toHaveClass("whitespace-nowrap");
      expect(link).toHaveClass("text-[0.72rem]");
    }
  });

  it("hides the second row when the menu state is closed", () => {
    render(<MobileNav locale="es" open={false} />);

    expect(screen.queryByRole("navigation", { name: "Navegación móvil" })).not.toBeInTheDocument();
  });
});
