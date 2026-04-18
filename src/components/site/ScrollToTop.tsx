"use client";

import { useEffect } from "react";

/** Fuerza scroll a y=0 al montar — necesario cuando el header es fixed y Next.js no llega al tope real. */
export function ScrollToTop() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return null;
}
