import {
  Github,
  Linkedin,
  Mail,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

export type SocialLink = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export type Project = {
  title: string;
  problem: string;
  solution: string;
  demo?: string;
  repo?: string;
};

export const socialLinks: SocialLink[] = [
  {
    name: "GitHub",
    href: "https://github.com/silvanopuccini",
    icon: Github,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/silvano-jose-maria-puccini-394992265",
    icon: Linkedin,
  },
  {
    name: "Discord",
    href: "https://discord.com/users/925401070388256778",
    icon: MessageCircle,
  },
  {
    name: "Email",
    href: "mailto:silvano.jm.puccini@gmail.com",
    icon: Mail,
  },
];

export const projects: Project[] = [
  {
    title: "Ferrelón",
    problem: "Proyecto principal definido para la nueva versión del portfolio.",
    solution: "Caso real priorizado en portada (detalle y enlaces a completar).",
  },
  {
    title: "Activar",
    problem: "Segundo proyecto priorizado para mostrar foco comercial y ejecución.",
    solution: "Incluido en el grid principal con espacio para ampliar caso completo.",
  },
  {
    title: "Modern Art Gallery",
    problem: "Landing estática sin narrativa visual premium para conversión.",
    solution: "Diseño editorial + performance web optimizada para experiencia inmersiva.",
    demo: "https://silvanopuccini.github.io/modern-art-gallery/",
    repo: "https://github.com/SilvanoPuccini/modern-art-gallery",
  },
  {
    title: "PayTrack",
    problem: "Control manual de gastos y baja visibilidad financiera.",
    solution: "App con dashboard y automatización de métricas para toma de decisiones.",
    demo: "https://payment-tracker-bot.vercel.app/login",
    repo: "https://github.com/SilvanoPuccini/payment-tracker-bot",
  },
];
