"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Algo salió mal. Intentá de nuevo.");
        setStatus("error");
        return;
      }

      setStatus("success");
      setEmail("");
    } catch {
      setErrorMsg("No se pudo conectar. Revisá tu conexión.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-8 flex items-center gap-3 rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-5 py-4">
        <span className="text-brand-primary">✓</span>
        <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-brand-primary">
          ¡Listo! Revisá tu bandeja.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-3">
      <div className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
          disabled={status === "loading"}
          className="flex-1 rounded-sm border border-outline-ghost/30 bg-surface-elevated/90 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary hover:border-outline-ghost/50 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="button-primary rounded-sm px-6 py-3 text-xs uppercase tracking-[0.2em] disabled:opacity-50"
        >
          {status === "loading" ? "..." : "Suscribirme"}
        </button>
      </div>
      {status === "error" && (
        <p className="font-mono text-[11px] text-red-400">{errorMsg}</p>
      )}
    </form>
  );
}
