"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { X } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  stackName: string;
  fileName: string;
  onClose: () => void;
}

export function CertificateModal({ stackName, fileName, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  // Alto/ancho natural de la página del PDF (a escala 1), para no exceder el alto disponible.
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  const updateSize = useCallback(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setContainerSize({ width: clientWidth, height: clientHeight });
    }
  }, []);

  useEffect(() => {
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateSize]);

  const width = aspectRatio
    ? Math.min(containerSize.width, containerSize.height / aspectRatio)
    : containerSize.width;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    // Un back físico/gesto de mobile mientras el certificado está abierto no
    // debe sacar de la página: consume la entrada de historial que empujamos.
    function onPopState() {
      onClose();
    }

    document.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPopState);
    window.history.pushState({ certificateModal: true }, "");

    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPopState);
      document.body.style.overflow = "";
    };
  }, []);

  function close() {
    if (window.history.state?.certificateModal) {
      window.history.back();
    } else {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={close}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 flex w-[min(92vw,64rem)] flex-col overflow-hidden rounded-[var(--radius-surface)] border border-outline-ghost/15 bg-[rgb(var(--surface))] shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
        style={{ height: "88vh" }}
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
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-pill border border-outline-ghost/15 text-text-tertiary transition-colors hover:border-outline-ghost/30 hover:text-text-primary"
            aria-label="Cerrar"
          >
            <X size={14} />
          </button>
        </div>

        {/* PDF Viewer */}
        <div
          ref={containerRef}
          className="flex flex-1 items-center justify-center overflow-auto"
        >
          <Document
            file={`/api/certificate/${encodeURIComponent(fileName)}`}
            loading={
              <div className="flex h-64 items-center justify-center text-sm text-text-tertiary">
                Cargando certificado…
              </div>
            }
            error={
              <div className="flex h-64 items-center justify-center text-sm text-text-tertiary">
                No se pudo cargar el certificado.
              </div>
            }
          >
            {width > 0 && (
              <Page
                pageNumber={1}
                width={width}
                onLoadSuccess={(page) => setAspectRatio(page.height / page.width)}
              />
            )}
          </Document>
        </div>
      </div>
    </div>
  );
}
