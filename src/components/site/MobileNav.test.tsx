import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MobileNav from "@/components/site/MobileNav";

const usePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentPropsWithoutRef<"div">) => <div {...props}>{children}</div>,
    nav: ({ children, ...props }: React.ComponentPropsWithoutRef<"nav">) => <nav {...props}>{children}</nav>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("MobileNav", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    usePathname.mockReset();
    usePathname.mockReturnValue("/es");
    onClose.mockReset();
  });

  it("renders vertical nav links as a drawer", () => {
    render(<MobileNav locale="es" open onClose={onClose} />);

    const nav = screen.getByRole("navigation", { name: "Navegación móvil" });
    const links = within(nav).getAllByRole("link");

    expect(links).toHaveLength(6);
    expect(links[0]).toHaveTextContent("Inicio");
    expect(links[3]).toHaveTextContent("Servicios");
  });

  it("hides the drawer when closed", () => {
    render(<MobileNav locale="es" open={false} onClose={onClose} />);

    expect(screen.queryByRole("navigation", { name: "Navegación móvil" })).not.toBeInTheDocument();
  });
});
