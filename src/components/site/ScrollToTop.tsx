"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Lleva la vista al tope real en cada cambio de página.
 *
 * `scroll-behavior: smooth` global convierte el reseteo de scroll de Next en
 * una animación que puede quedar a mitad de camino: al pasar de una página
 * scrolleada a otra, la vista quedaba en y≈120 y el h1 terminaba debajo de la
 * cabecera fija, cortado.
 *
 * El salto es instantáneo a propósito — animar el scroll durante un cambio de
 * página desorienta. Los anclas dentro de una misma página sí se deslizan.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Con un ancla en la URL manda el ancla, no el tope.
    if (window.location.hash) return;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
