"use client";

import dynamic from "next/dynamic";
import { Eye } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/content/schema";

const CertificateModal = dynamic(
  () => import("./CertificateModal").then((module) => ({ default: module.CertificateModal })),
  { ssr: false },
);

const FILE_NAME = "master-full-stack-conquer-blocks.pdf";

const labels = {
  es: {
    view: "Ver certificado",
    certificate: "Certificado",
    close: "Cerrar certificado",
    loading: "Cargando certificado…",
    error: "No se pudo cargar el certificado.",
  },
  en: {
    view: "View certificate",
    certificate: "Certificate",
    close: "Close certificate",
    loading: "Loading certificate…",
    error: "The certificate could not be loaded.",
  },
} as const;

export function EducationCertificateActions({
  locale,
  title,
}: {
  locale: Locale;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const copy = labels[locale];

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="button-secondary inline-flex items-center justify-center gap-2"
          aria-label={`${copy.view}: ${title}`}
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          <span>{copy.view}</span>
        </button>
      </div>

      {isOpen ? (
        <CertificateModal
          stackName={title}
          fileName={FILE_NAME}
          labels={{
            certificate: copy.certificate,
            close: copy.close,
            loading: copy.loading,
            error: copy.error,
          }}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </>
  );
}
