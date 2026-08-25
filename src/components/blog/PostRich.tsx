"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Primitivas de contenido enriquecido para posts del blog: recuadros
 * clickeables que expanden a un lightbox (~70% de pantalla), grilla de
 * dos/tres columnas y diagramas HTML que se auto-escalan a su contenedor.
 */

// ─────────────────────────────────────────────────────────────────
// Zoomable — recuadro clickeable que expande su contenido en un lightbox
// ─────────────────────────────────────────────────────────────────

interface ZoomableProps {
  children: React.ReactNode;
  expanded?: React.ReactNode;
  caption?: string;
  className?: string;
}

export function Zoomable({ children, expanded, caption, className = "" }: ZoomableProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <figure
        className={`group m-0 flex cursor-zoom-in flex-col gap-3.5 ${className}`}
        onClick={() => setOpen(true)}
      >
        {caption && (
          <figcaption className="truncate font-mono text-xs uppercase tracking-[0.14em] text-[#22d3d3]">
            {caption}
          </figcaption>
        )}
        <div className="overflow-hidden rounded-[10px] border border-[#1e2937] bg-[#0e141d] transition-colors duration-150 group-hover:border-[#22d3d3]">
          {children}
        </div>
      </figure>

      {open && (
        <div
          className="fixed inset-0 z-[999] flex cursor-zoom-out items-center justify-center bg-[rgba(5,8,12,0.96)] p-6"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            className="fixed right-5 top-5 rounded-md border border-[#22d3d3] bg-transparent px-3 py-1.5 font-mono text-[13px] text-[#22d3d3] transition-colors hover:bg-[#22d3d3]/10"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          >
            cerrar ✕
          </button>
          <div
            className="max-h-[70vh] max-w-[70vw] cursor-auto overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {expanded ?? children}
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Row — grilla responsiva de 2 o 3 columnas
// ─────────────────────────────────────────────────────────────────

export function Row({ cols = 2, children }: { cols?: 2 | 3; children: React.ReactNode }) {
  const colsClass = cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return <div className={`my-5 grid grid-cols-1 items-stretch gap-3.5 ${colsClass}`}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────────
// Eyebrow — etiqueta pequeña sobre el título/excerpt
// ─────────────────────────────────────────────────────────────────

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center gap-[7px] font-mono text-[11px] uppercase tracking-[0.12em] text-[#22d3d3]">
      <span aria-hidden className="text-[8px]">
        ●
      </span>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ImageShot — screenshot recortado, expande a tamaño completo
// ─────────────────────────────────────────────────────────────────

export function ImageShot({
  src,
  alt,
  caption,
  size = "thumb",
}: {
  src: string;
  alt: string;
  caption?: string;
  /** "thumb" (default) para pares en <Row>, "full" para una captura sola a todo el ancho. */
  size?: "thumb" | "full";
}) {
  const heightClass = size === "full" ? "h-[220px] sm:h-[420px]" : "h-[190px] sm:h-[220px]";

  return (
    <Zoomable
      caption={caption ?? alt}
      expanded={
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="max-h-[70vh] max-w-[70vw] rounded-lg object-contain"
        />
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={`block w-full object-cover ${heightClass}`} />
    </Zoomable>
  );
}

// ─────────────────────────────────────────────────────────────────
// Diagram — bloque HTML/CSS que se auto-escala a su contenedor,
// y a ~70% de pantalla dentro del lightbox.
// ─────────────────────────────────────────────────────────────────

function useAutoScaleToWidth(w: number) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    function fit() {
      const wrap = wrapRef.current;
      const inner = innerRef.current;
      if (!wrap || !inner) return;
      const availW = wrap.clientWidth;
      const s = availW / w;
      const naturalH = inner.offsetHeight; // offsetHeight ignora transform: scale
      setScale(s);
      setScaledHeight(naturalH * s);
    }
    fit();
    const ro = new ResizeObserver(fit);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [w]);

  return { wrapRef, innerRef, scale, scaledHeight };
}

function DiagramExpanded({ w, children }: { w: number; children: React.ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const naturalH = inner.offsetHeight;
    const maxW = window.innerWidth * 0.7;
    const maxH = window.innerHeight * 0.7;
    const s = Math.min(maxW / w, maxH / naturalH, 1.6);
    setScale(s);
    setReady(true);
  }, [w]);

  return (
    <div
      style={{ width: w * scale, transition: "opacity .12s", opacity: ready ? 1 : 0 }}
      className="overflow-hidden"
    >
      <div ref={innerRef} style={{ width: w, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}

export function Diagram({
  w,
  caption,
  children,
}: {
  w: number;
  caption?: string;
  children: React.ReactNode;
}) {
  const { wrapRef, innerRef, scale, scaledHeight } = useAutoScaleToWidth(w);

  return (
    <Zoomable caption={caption} expanded={<DiagramExpanded w={w}>{children}</DiagramExpanded>}>
      <div
        ref={wrapRef}
        style={{ width: "100%", height: scaledHeight, overflow: "hidden", position: "relative" }}
      >
        <div ref={innerRef} style={{ width: w, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
    </Zoomable>
  );
}

// ─────────────────────────────────────────────────────────────────
// DownloadGuides — botones de descarga con íconos reales de Windows/Linux
// ─────────────────────────────────────────────────────────────────

function WindowsIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M0,0H11.377V11.372H0ZM12.623,0H24V11.372H12.623ZM0,12.623H11.377V24H0Zm12.623,0H24V24H12.623" />
    </svg>
  );
}

function LinuxIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.533a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 00-.166-.267.248.248 0 00-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 00-.12.27.944.944 0 00-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 01-.131.068 2.62 2.62 0 01-.275-.402 1.772 1.772 0 01-.155-.667 1.759 1.759 0 01.08-.668 1.43 1.43 0 01.283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 01.016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 01-.448-.067 3.566 3.566 0 01-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.043c-.06-.003-.12 0-.18 0h-.016c.151-.467-.182-.825-1.065-1.224-.915-.4-1.646-.336-1.77.465-.008.043-.013.066-.018.135-.068.023-.139.053-.209.064-.43.268-.662.669-.793 1.187-.13.533-.17 1.156-.205 1.869v.003c-.02.334-.17.838-.319 1.35-1.5 1.072-3.58 1.538-5.348.334a2.645 2.645 0 00-.402-.533 1.45 1.45 0 00-.275-.333c.182 0 .338-.03.465-.067a.615.615 0 00.314-.334c.108-.267 0-.697-.345-1.163-.345-.467-.931-.995-1.788-1.521-.63-.4-.986-.87-1.15-1.396-.165-.534-.143-1.085-.015-1.645.245-1.07.873-2.11 1.274-2.763.107-.065.037.135-.408.974-.396.751-1.14 2.497-.122 3.854a8.123 8.123 0 01.647-2.876c.564-1.278 1.743-3.504 1.836-5.268.048.036.217.135.289.202.218.133.38.333.59.465.21.201.477.335.876.335.039.003.075.006.11.006.412 0 .73-.134.997-.268.29-.134.52-.334.74-.4h.005c.467-.135.835-.402 1.044-.7zm2.185 8.958c.037.6.343 1.245.882 1.377.588.134 1.434-.333 1.791-.765l.211-.01c.315-.007.577.01.847.268l.003.003c.208.199.305.53.391.876.085.4.154.78.409 1.066.486.527.645.906.636 1.14l.003-.007v.018l-.003-.012c-.015.262-.185.396-.498.595-.63.401-1.746.712-2.457 1.57-.618.737-1.37 1.14-2.036 1.191-.664.053-1.237-.2-1.574-.898l-.005-.003c-.21-.4-.12-1.025.056-1.69.176-.668.428-1.344.463-1.897.037-.714.076-1.335.195-1.814.12-.465.308-.797.641-.984l.045-.022zm-10.814.049h.01c.053 0 .105.005.157.014.376.055.706.333 1.023.752l.91 1.664.003.003c.243.533.754 1.064 1.189 1.637.434.598.77 1.131.729 1.57v.006c-.057.744-.48 1.148-1.125 1.294-.645.135-1.52.002-2.395-.464-.968-.536-2.118-.469-2.857-.602-.369-.066-.61-.2-.723-.4-.11-.2-.113-.602.123-1.23v-.004l.002-.003c.117-.334.03-.752-.027-1.118-.055-.401-.083-.71.043-.94.16-.334.396-.4.69-.533.294-.135.64-.202.915-.47h.002v-.002c.256-.268.445-.601.668-.838.19-.201.38-.336.663-.336zm7.159-9.074c-.435.201-.945.535-1.488.535-.542 0-.97-.267-1.28-.466-.154-.134-.28-.268-.373-.335-.164-.134-.144-.333-.074-.333.109.016.129.134.199.2.096.066.215.2.36.333.292.2.68.467 1.167.467.485 0 1.053-.267 1.398-.466.195-.135.445-.334.648-.467.156-.136.149-.267.279-.267.128.016.034.134-.147.332a8.097 8.097 0 01-.69.468zm-1.082-1.583V5.64c-.006-.02.013-.042.029-.05.074-.043.18-.027.26.004.063 0 .16.067.15.135-.006.049-.085.066-.135.066-.055 0-.092-.043-.141-.068-.052-.018-.146-.008-.163-.065zm-.551 0c-.02.058-.113.049-.166.066-.047.025-.086.068-.14.068-.05 0-.13-.02-.136-.068-.01-.066.088-.133.15-.133.08-.031.184-.047.259-.005.019.009.036.03.03.05v.02h.003z" />
    </svg>
  );
}

export function DownloadGuides() {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <a
        className="button-primary w-full gap-[11px] normal-case tracking-normal no-underline sm:w-auto"
        href="/guias/guia-instalacion-windows-wsl.pdf"
        download
      >
        <WindowsIcon />
        <span className="text-left text-[14.5px] font-semibold">
          Guía para Windows
          <span className="mt-px block font-mono text-[10.5px] font-normal opacity-75">
            WSL2 + Ubuntu · PDF
          </span>
        </span>
      </a>
      <a
        className="button-secondary w-full gap-[11px] normal-case tracking-normal no-underline sm:w-auto"
        href="/guias/guia-instalacion-linux-nativo.pdf"
        download
      >
        <LinuxIcon />
        <span className="text-left text-[14.5px] font-semibold">
          Guía para Ubuntu
          <span className="mt-px block font-mono text-[10.5px] font-normal opacity-75">
            instalación nativa · PDF
          </span>
        </span>
      </a>
    </div>
  );
}
