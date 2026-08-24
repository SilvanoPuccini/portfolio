"use client";

import { useRef, useState } from "react";

/**
 * Overrides the default `pre` element rendered by rehype-pretty-code so
 * every code block in the blog gets a "copiar" button. Applies globally
 * via the MDX `components` map — not something posts opt into individually.
 */
export function CodeBlock(props: React.HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = preRef.current?.textContent ?? "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (older browser, insecure context) — no-op.
    }
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copiar código"
        className="absolute right-3 top-3 z-10 rounded-md border border-white/10 bg-black/50 px-2.5 py-1 font-mono text-[11px] text-slate-300 opacity-0 backdrop-blur transition-opacity duration-150 hover:border-white/25 hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
      >
        {copied ? "copiado ✓" : "copiar"}
      </button>
      <pre ref={preRef} {...props} />
    </div>
  );
}
