"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  stackName: string;
  fileName: string;
  onClose: () => void;
}

export function CertificateModal({ stackName, fileName, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius-surface)] border border-outline-ghost/15 bg-[rgb(var(--surface))] shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
        style={{ maxHeight: "96vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-ghost/10 px-5 py-4 sm:px-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-tertiary">
              Certificado
            </p>
            <p className="mt-0.5 text-sm font-semibold text-text-primary sm:text-base">
              {stackName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-pill border border-outline-ghost/15 text-text-tertiary transition-colors hover:border-outline-ghost/30 hover:text-text-primary"
            aria-label="Cerrar"
          >
            <X size={14} />
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src={`/api/certificate/${encodeURIComponent(fileName)}#view=Fit`}
            className="h-full w-full"
            title={`Certificado ${stackName}`}
          />
        </div>
      </div>
    </div>
  );
}
