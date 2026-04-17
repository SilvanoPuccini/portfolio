"use client";

import { useState } from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { Globe, Server } from "lucide-react";
import { CertificateModal } from "./CertificateModal";

/* ── Certificate mapping ─────────────────────────────────────── */
const CERTIFICATES: Record<string, string> = {
  React: "Reactjs+Typescript.pdf",
  TypeScript: "typescript.pdf",
  Javascript: "Javascript-Avanzado.pdf",
  HTML: "html.pdf",
  Angular: "Angular.pdf",
  "Vue.js": "vuejs.pdf",
  Python: "Python-Avanzado.pdf",
  "Git/GitHub": "Git-Github.pdf",
  "Linux/WSL": "linux-terminal.pdf",
  PostgreSQL: "SQL.pdf",
};

/* ── Icons ───────────────────────────────────────────────────── */
type StackRemoteIcon = { src: string; alt: string; className?: string; width?: number };
type StackItemIcon = { icons?: StackRemoteIcon[]; fallback?: LucideIcon };

const ICONS: Record<string, StackItemIcon> = {
  React: { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg", alt: "React" }] },
  Angular: { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg", alt: "Angular" }] },
  "Vue.js": { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg", alt: "Vue.js" }] },
  "Next.js": { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg", alt: "Next.js", className: "dark:invert" }] },
  TypeScript: { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg", alt: "TypeScript" }] },
  JavaScript: { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg", alt: "JavaScript" }] },
  Javascript: { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg", alt: "JavaScript" }] },
  HTML5: { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg", alt: "HTML5" }] },
  HTML: { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg", alt: "HTML5" }] },
  "Tailwind CSS": { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg", alt: "Tailwind CSS" }] },
  "Node.js": { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg", alt: "Node.js" }] },
  "Express.js": { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg", alt: "Express.js", className: "dark:invert", width: 28 }] },
  Python: { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg", alt: "Python" }] },
  Django: { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg", alt: "Django", className: "dark:invert" }] },
  "APIs REST": { fallback: Globe },
  PostgreSQL: { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg", alt: "PostgreSQL" }] },
  MySQL: { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg", alt: "MySQL" }] },
  MongoDB: { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg", alt: "MongoDB" }] },
  Supabase: { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/supabase/supabase-original.svg", alt: "Supabase" }] },
  "Git/GitHub": { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg", alt: "Git" }, { src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg", alt: "GitHub", className: "dark:invert" }] },
  VSCode: { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg", alt: "VSCode" }] },
  Figma: { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg", alt: "Figma" }] },
  "Linux/WSL": { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg", alt: "Linux" }] },
  VPS: { fallback: Server },
  Vercel: { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vercel/vercel-original.svg", alt: "Vercel", className: "dark:invert" }] },
  AWS: { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg", alt: "AWS", className: "dark:invert", width: 30 }] },
  Render: { icons: [{ src: "https://cdn.simpleicons.org/render", alt: "Render" }] },
  DigitalOcean: { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/digitalocean/digitalocean-original.svg", alt: "Digital Ocean" }] },
  "Digital Ocean": { icons: [{ src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/digitalocean/digitalocean-original.svg", alt: "Digital Ocean" }] },
  Cloudinary: { icons: [{ src: "https://cdn.simpleicons.org/cloudinary", alt: "Cloudinary" }] },
};

function StackIcon({ item }: { item: string }) {
  const config = ICONS[item];
  if (config?.icons?.length) {
    return (
      <span className="inline-flex min-w-0 shrink-0 items-center gap-1 transition-transform duration-200 ease-out group-hover:scale-[1.06]">
        {config.icons.map((icon) => (
          <Image
            key={icon.alt}
            src={icon.src}
            alt={icon.alt}
            width={icon.width ?? 16}
            height={icon.width ?? 16}
            className={`h-4 w-auto shrink-0 ${icon.className ?? ""}`}
            unoptimized
          />
        ))}
      </span>
    );
  }
  if (config?.fallback) {
    const Icon = config.fallback;
    return <Icon size={14} className="shrink-0 text-text-tertiary transition-transform duration-200 ease-out group-hover:scale-[1.06]" />;
  }
  return null;
}

interface SkillGroup { title: string; items: string[] }
interface Props { groups: SkillGroup[]; eyebrow: string; description: string; closing: string }

export function StackSection({ groups, eyebrow, description, closing }: Props) {
  const [modal, setModal] = useState<{ name: string; file: string } | null>(null);

  return (
    <section className="bg-[linear-gradient(180deg,rgb(var(--surface-elevated)/0.12),rgb(var(--surface)/0.08))] py-12 sm:py-14 lg:py-16">
      <div className="site-container">
        <div className="max-w-3xl space-y-5">
          <h2 className="text-3xl font-semibold text-text-primary sm:text-4xl">{eyebrow}</h2>
          <p className="text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">{description}</p>
        </div>

        <div className="mt-8 space-y-3">
          {groups.map((group, index) => (
            <article
              key={group.title}
              className={`rounded-[var(--radius-soft)] px-5 py-5 shadow-[0_18px_40px_rgba(2,8,23,0.08)] sm:px-6 sm:py-6 ${index % 2 === 0 ? "bg-[rgb(var(--background)/0.14)]" : "bg-[rgb(var(--background)/0.1)]"}`}
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-6">
                <div className="xl:w-[11rem] xl:min-w-[11rem]">
                  <p className="technical-label">{group.title}</p>
                </div>

                <div className="flex min-w-0 flex-wrap gap-2 xl:flex-1 xl:flex-nowrap xl:gap-1">
                  {group.items.map((item) => {
                    const certFile = CERTIFICATES[item];
                    const Tag = certFile ? "button" : "span";
                    return (
                      <Tag
                        key={`${group.title}-${item}`}
                        {...(certFile
                          ? {
                              onClick: () => setModal({ name: item, file: certFile }),
                              title: `Ver certificado de ${item}`,
                              type: "button" as const,
                            }
                          : {})}
                        className={`group inline-flex items-center gap-1.5 rounded-[var(--radius-soft)] border border-transparent bg-[rgb(var(--surface-elevated)/0.82)] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-secondary shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition-[background-color,color,transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgb(var(--accent)/0.18)] hover:bg-[rgb(var(--surface-elevated)/0.98)] hover:text-text-primary hover:shadow-[0_14px_28px_rgba(15,23,42,0.12)] xl:min-w-0 xl:flex-1 xl:justify-center xl:px-2 xl:text-[9.5px]${certFile ? " cursor-pointer hover:border-brand-primary/25" : ""}`}
                      >
                        <StackIcon item={item} />
                        <span className="truncate">{item}</span>
                        {certFile && (
                          <span className="ml-0.5 shrink-0 font-mono text-[8px] text-brand-primary/60 xl:hidden">●</span>
                        )}
                      </Tag>
                    );
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 max-w-3xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">{closing}</p>
      </div>

      {modal && (
        <CertificateModal
          stackName={modal.name}
          fileName={modal.file}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
