import { projects } from "@/content/projects";
import type {
  AboutContent,
  BlogContent,
  ContactContent,
  HomeContent,
  Locale,
  NavigationItem,
  ServiceItem,
  SiteContent,
} from "@/content/schema";

const navigation: NavigationItem[] = [
  { key: "home", href: "/", label: { es: "Inicio", en: "Home" } },
  { key: "about", href: "/about", label: { es: "Sobre mí", en: "About" } },
  { key: "projects", href: "/projects", label: { es: "Proyectos", en: "Projects" } },
  { key: "services", href: "/services", label: { es: "Servicios", en: "Services" } },
  { key: "blog", href: "/blog", label: { es: "Blog", en: "Blog" } },
  { key: "contact", href: "/contact", label: { es: "Contacto", en: "Contact" } },
];

const home: HomeContent = {
  eyebrow: {
    es: "Desarrollo web · Automatización · Arquitectura",
    en: "Web Development · Automation · Architecture",
  },
  title: {
    es: "Silvano Puccini",
    en: "Silvano Puccini",
  },
  subtitle: {
    es: "Construyo el sistema que tu negocio necesita para vender, ordenarse y crecer.",
    en: "I build the system your business needs to sell, organize, and grow.",
  },
  intro: {
    es: "Desarrollo web, automatización y arquitectura para negocios que quieren dejar de operar a mano. Resultados reales, código en producción.",
    en: "Web development, automation, and architecture for businesses ready to stop running everything by hand. Real results, production code.",
  },
  narrative: {
    es: [
      "Actualmente curso 3º año de TUDAI y completé el Máster en Desarrollo Web Full Stack de Conquer Blocks.",
      "Mi stack principal reúne React, TypeScript, Next.js, Python, Django, Node.js, PostgreSQL y Supabase.",
      "Vengo de más de diez años en gestión comercial, coordinación y atención al cliente, por eso diseño y desarrollo con visión de negocio además de código.",
    ],
    en: [
      "I am currently in the 3rd year of TUDAI and completed the Full Stack Web Development master's program at Conquer Blocks.",
      "My core stack includes React, TypeScript, Next.js, Python, Django, Node.js, PostgreSQL, and Supabase.",
      "I bring over ten years of commercial management, coordination, and customer-facing experience, so I design and build with business context as well as code quality.",
    ],
  },
  ctas: {
    es: [
      { label: "Solicitar un servicio", href: "/services" },
      { label: "Ver proyectos", href: "/projects" },
    ],
    en: [
      { label: "Request a service", href: "/services" },
      { label: "View projects", href: "/projects" },
    ],
  },
  featuredProjectSlugs: ["ferrelonstock", "my-marketing-agency", "aktivar", "modern-art-gallery", "paytrack", "facturia-2-0"],
  sourceUrls: [
    "/cv/CV_Silvano_Puccini_FullStack.pdf",
    "README.md",
    "https://github.com/SilvanoPuccini",
  ],
};

const about: AboutContent = {
  eyebrow: {
    es: "Sobre mí",
    en: "About me",
  },
  title: {
    es: "Perfil técnico con lectura de negocio y ejecución real.",
    en: "Technical profile with business awareness and real execution.",
  },
  summary: {
    es: [
      "Ingeniería, criterio de producto y claridad en la misma capa.",
      "Construyo productos combinando desarrollo técnico, sensibilidad editorial y lectura de negocio real.",
      "No separo frontend, backend o negocio: todo forma parte del mismo sistema.",
    ],
    en: [
      "Engineering, product judgment, and clarity in the same layer.",
      "I build products by combining technical development, editorial sensitivity, and real business awareness.",
      "I do not separate frontend, backend, or business: everything is part of the same system.",
    ],
  },
  strengths: {
    es: [
      "Resolución de problemas con foco en producto",
      "Experiencia en negocio real aplicada a tecnología",
      "Arquitecturas escalables y mantenibles",
      "Comunicación clara entre negocio y desarrollo",
      "Automatización aplicada a casos reales",
    ],
    en: [
      "Problem solving with product focus",
      "Real business experience applied to technology",
      "Scalable and maintainable architectures",
      "Clear communication between business and development",
      "Automation applied to real use cases",
    ],
  },
  languages: {
    es: ["Español nativo", "Inglés intermedio (lectura y escritura técnica)"],
    en: ["Native Spanish", "Intermediate English (technical reading and writing)"],
  },
  education: [
    {
      title: {
        es: "Máster en Desarrollo Web Full Stack",
        en: "Master’s in Full Stack Web Development",
      },
      institution: "Conquer Blocks (España)",
      period: {
        es: "Completado 2026",
        en: "Completed in 2026",
      },
      detail: {
        es: "Formación intensiva en frontend, backend y despliegue",
        en: "Intensive training in frontend, backend, and deployment",
      },
    },
    {
      title: {
        es: "Tecnicatura Universitaria en Desarrollo de Aplicaciones Informáticas (TUDAI)",
        en: "University Technician Degree in Computer Application Development (TUDAI)",
      },
      institution:
        "Universidad de la Defensa Nacional (UNDEF) — Centro Regional Universitario de Córdoba, IUA",
      period: {
        es: "feb. 2024 – ago. 2026 · En curso · 3º año",
        en: "Feb 2024 – Aug 2026 · In progress · 3rd year",
      },
      detail: {
        es: "Programación, bases de datos, arquitectura de computadoras, redes, diseño de interfaces, testing y calidad de software, desarrollo de software I y II, sistemas operativos, gestión de proyectos y seguridad informática.",
        en: "Programming, databases, computer architecture, networks, interface design, testing and software quality, software development I and II, operating systems, project management, and information security.",
      },
    },
  ],
  experience: [
    {
      title: {
        es: "Tarjeta Naranja S.A. · Colaborador Comercial",
        en: "Tarjeta Naranja S.A. · Commercial Associate",
      },
      context: {
        es: "Azul, Buenos Aires · 2012 — 2018",
        en: "Azul, Buenos Aires · 2012 — 2018",
      },
      detail: {
        es: "Gestión de clientes, acuerdos comerciales y apertura de nuevas operaciones.",
        en: "Client management, commercial agreements, and launch of new operations.",
      },
    },
    {
      title: {
        es: "Credil SRL · Cajero / Recaudador",
        en: "Credil SRL · Cashier / Collections",
      },
      context: {
        es: "Tandil, Buenos Aires · 2019 — 2021",
        en: "Tandil, Buenos Aires · 2019 — 2021",
      },
      detail: {
        es: "Operación financiera, atención al cliente y soporte comercial.",
        en: "Financial operations, customer support, and commercial assistance.",
      },
    },
    {
      title: {
        es: "Distribuidora Gamma · Coordinador Comercial",
        en: "Distribuidora Gamma · Commercial Coordinator",
      },
      context: {
        es: "Tandil, Buenos Aires · 2022 — 2023",
        en: "Tandil, Buenos Aires · 2022 — 2023",
      },
      detail: {
        es: "Gestión de ventas mayoristas, cuentas corporativas y coordinación de equipos remotos.",
        en: "Wholesale sales management, corporate accounts, and coordination of remote teams.",
      },
    },
  ],
  skillGroups: [
    {
      title: { es: "Frontend", en: "Frontend" },
      items: ["React", "Angular", "Vue.js", "Next.js", "TypeScript", "Javascript", "HTML", "Tailwind CSS"],
    },
    {
      title: { es: "Backend", en: "Backend" },
      items: ["Node.js", "Express.js", "Python", "Django", "Java", "Rust", "APIs REST"],
    },
    {
      title: { es: "Datos", en: "Data" },
      items: ["PostgreSQL", "MySQL", "MongoDB", "Supabase"],
    },
    {
      title: { es: "Infraestructura", en: "Infrastructure" },
      items: ["Git/GitHub", "VSCode", "Figma", "Linux/WSL"],
    },
    {
      title: { es: "Deploy", en: "Deploy" },
      items: ["VPS", "Vercel", "AWS", "Render", "Digital Ocean", "Cloudinary", "Docker"],
    },
  ],
  cvLabel: {
    es: "Descargar CV",
    en: "Download CV",
  },
  sourceUrls: [
    "/cv/CV_Silvano_Puccini_FullStack.pdf",
    "https://github.com/SilvanoPuccini",
    "https://www.linkedin.com/in/silvano-puccini/",
  ],
};

const services: ServiceItem[] = [
  {
    slug: "full-stack-builds",
    subtitle: {
      es: "La estructura digital de tu negocio",
      en: "The digital backbone of your business",
    },
    title: {
      es: "Desarrollo web a medida",
      en: "Custom web development",
    },
    description: {
      es: "Construcción end-to-end: frontend, backend, datos, autenticación y deploy. Proyectos que funcionan en producción desde el día uno.",
      en: "End-to-end build: frontend, backend, data, auth, and deploy. Projects that work in production from day one.",
    },
    proofPoints: {
      es: ["FerrelonStock", "Aktivar", "PayTrack"],
      en: ["FerrelonStock", "Aktivar", "PayTrack"],
    },
    sourceUrls: [
      "https://github.com/SilvanoPuccini/ferrelonstock",
      "https://github.com/SilvanoPuccini/aktivar",
      "https://github.com/SilvanoPuccini/payment-tracker-bot",
    ],
  },
  {
    slug: "automation-ai",
    subtitle: {
      es: "Los procesos que corren sin vos",
      en: "Processes that run without you",
    },
    title: {
      es: "Automatización con IA",
      en: "AI automation",
    },
    description: {
      es: "Flujos que reemplazan trabajo manual repetitivo. Clasificación, extracción, validación y pipelines auditables — con humano en el loop cuando importa.",
      en: "Flows that replace repetitive manual work. Classification, extraction, validation, and auditable pipelines — with a human in the loop when it matters.",
    },
    proofPoints: {
      es: ["FacturIA 2.0", "MCP / agentes IA", "Dashboards y clasificación automática"],
      en: ["FacturIA 2.0", "MCP / AI agents", "Dashboards and automatic classification"],
    },
    sourceUrls: [
      "/cv/CV_Silvano_Puccini_FullStack.pdf",
      "https://github.com/SilvanoPuccini/FacturIA-2.0",
      "https://github.com/SilvanoPuccini",
    ],
  },
  {
    slug: "product-ux-engineering",
    subtitle: {
      es: "Claridad antes de invertir",
      en: "Clarity before you invest",
    },
    title: {
      es: "Auditoría técnica",
      en: "Technical audit",
    },
    description: {
      es: "Revisión de arquitectura, performance y deuda técnica. Salís con un diagnóstico claro y un roadmap ejecutable — no con una lista de problemas sin solución.",
      en: "Architecture, performance, and tech debt review. You leave with a clear diagnosis and an executable roadmap — not just a list of problems.",
    },
    proofPoints: {
      es: ["+10 años en gestión comercial", "Roadmaps y auditorías técnicas", "Foco en UX y claridad narrativa"],
      en: ["10+ years in commercial management", "Roadmaps and technical audits", "Focus on UX and narrative clarity"],
    },
    sourceUrls: [
      "/cv/CV_Silvano_Puccini_FullStack.pdf",
      "https://github.com/SilvanoPuccini/SilvanoPuccini",
    ],
  },
];

const blog: BlogContent = {
  eyebrow: {
    es: "Blog",
    en: "Blog",
  },
  title: {
    es: "Arquitectura, criterio y código",
    en: "Architecture, criteria and code",
  },
  titleAccent: {
    es: "",
    en: "",
  },
  intro: {
    es: "Te cuento lo que aprendí construyendo productos reales.",
    en: "I tell you what I learned building real products.",
  },
  emptyState: {
    es: "Contenido editorial temporal. Reemplazar por artículos reales validados en próximas iteraciones.",
    en: "Temporary editorial content. Replace with validated real articles in upcoming iterations.",
  },
  featuredLabel: {
    es: "Artículo destacado",
    en: "Featured article",
  },
  latestLabel: {
    es: "Últimas notas",
    en: "Latest notes",
  },
  editorialNote: {
    es: "Performance, arquitectura y automatización. Sin teoría vacía, con contexto y decisiones reales.",
    en: "Performance, architecture and automation. No empty theory, with context and real decisions.",
  },
  newsletter: {
    title: {
      es: "Suscribite al radar",
      en: "Subscribe to the radar",
    },
    intro: {
      es: "Recibí una curaduría mensual de artículos, recursos técnicos y reflexiones sobre producto, frontend y automatización. Sin spam; solo arquitectura y criterio.",
      en: "Get a monthly curation of articles, technical resources, and reflections on product, frontend, and automation. No spam; just architecture and editorial judgment.",
    },
    inputPlaceholder: {
      es: "tu@email.com",
      en: "your@email.com",
    },
    ctaLabel: {
      es: "Suscribirme",
      en: "Subscribe",
    },
    helper: {
      es: "CTA provisional: hoy la suscripción se canaliza vía email directo hasta integrar backend específico.",
      en: "Temporary CTA: subscriptions are routed through direct email until a dedicated backend is integrated.",
    },
  },
  sourceUrls: ["docs/assets/stitch/blog_silvano_puccini_v2/code.html"],
};

const contact: ContactContent = {
  eyebrow: {
    es: "Contacto",
    en: "Contact",
  },
  title: {
    es: "Disponible para construir productos reales",
    en: "I’m available to collaborate remotely.",
  },
  intro: {
    es: "Si estás desarrollando una plataforma, sistema o solución con impacto, podemos trabajar juntos para llevarlo a producción con claridad técnica.",
    en: "If you’re building a product, a platform, or an automation workflow with impact, let’s talk.",
  },
  availability: {
    es: "Disponibilidad inmediata · remoto",
    en: "Immediate availability · remote",
  },
  primaryCtas: {
    es: [
      { label: "Hablemos de tu proyecto", href: "/services#intake" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/silvano-puccini/" },
    ],
    en: [
      { label: "Send email", href: "mailto:silvano.jm.puccini@gmail.com" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/silvano-puccini/" },
    ],
  },
  formspreeAction: "https://formspree.io/f/xvgvlzgk",
  sourceUrls: [
    "/cv/CV_Silvano_Puccini_FullStack.pdf",
    "src/js/main.js",
    "src/app/contacto/page.tsx",
  ],
};

export const siteContent: SiteContent = {
  metadata: {
    siteName: "Silvano Puccini",
    role: {
      es: "Desarrollador Full Stack",
      en: "Full Stack Developer",
    },
    description: {
      es: "Portfolio bilingüe con foco en producto, automatización y desarrollo full stack basado en contenido real verificable.",
      en: "Bilingual portfolio focused on product, automation, and full stack development backed by verifiable real content.",
    },
    siteUrl: "https://silvanopuccini.github.io/portfolio/",
    defaultLocale: "es",
    location: "Pucón, Chile",
    availability: {
      es: "Disponible para colaborar",
      en: "Available for collaboration",
    },
    email: "silvano.jm.puccini@gmail.com",
    phone: "+54 9 249 4309584",
    cv: {
      fileName: "CV_Silvano_Puccini-FullStack.pdf",
      downloadHref: "/cv",
      sourcePath: "src/assets/cv/CV_Silvano_Puccini-FullStack.pdf",
    },
    socialLinks: [
      { platform: "github", label: "GitHub", href: "https://github.com/SilvanoPuccini" },
      {
        platform: "linkedin",
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/silvano-puccini/",
      },
      { platform: "email", label: "Email", href: "mailto:silvano.jm.puccini@gmail.com" },
      { platform: "discord", label: "Discord", href: "https://discord.com/users/925401070388256778" },
      { platform: "portfolio", label: "Portfolio", href: "https://silvanopuccini.github.io/portfolio/" },
    ],
    sourceUrls: [
      "/cv/CV_Silvano_Puccini_FullStack.pdf",
      "README.md",
      "https://github.com/SilvanoPuccini",
      "https://www.linkedin.com/in/silvano-puccini/",
    ],
  },
  navigation,
  home,
  about,
  services,
  blog,
  contact,
  projects,
};

export function getSiteContent(locale: Locale) {
  return {
    metadata: {
      ...siteContent.metadata,
      role: siteContent.metadata.role[locale],
      description: siteContent.metadata.description[locale],
      availability: siteContent.metadata.availability[locale],
    },
    navigation: siteContent.navigation.map((item) => ({
      ...item,
      href: item.href === "/" ? `/${locale}` : `/${locale}${item.href}`,
      label: item.label[locale],
    })),
    home: {
      ...siteContent.home,
      eyebrow: siteContent.home.eyebrow[locale],
      title: siteContent.home.title[locale],
      subtitle: siteContent.home.subtitle[locale],
      intro: siteContent.home.intro[locale],
      narrative: siteContent.home.narrative[locale],
      ctas: siteContent.home.ctas[locale].map((cta) => ({
        ...cta,
        href: `/${locale}${cta.href}`,
      })),
    },
    about: {
      ...siteContent.about,
      eyebrow: siteContent.about.eyebrow[locale],
      title: siteContent.about.title[locale],
      summary: siteContent.about.summary[locale],
      strengths: siteContent.about.strengths[locale],
      languages: siteContent.about.languages[locale],
      cvLabel: siteContent.about.cvLabel[locale],
      education: siteContent.about.education.map((item) => ({
        ...item,
        title: item.title[locale],
        period: item.period[locale],
        detail: item.detail[locale],
      })),
      experience: siteContent.about.experience.map((item) => ({
        ...item,
        title: item.title[locale],
        context: item.context[locale],
        detail: item.detail[locale],
      })),
      skillGroups: siteContent.about.skillGroups.map((group) => ({
        ...group,
        title: group.title[locale],
      })),
    },
    services: siteContent.services.map((item) => ({
      ...item,
      subtitle: item.subtitle[locale],
      title: item.title[locale],
      description: item.description[locale],
      proofPoints: item.proofPoints[locale],
    })),
    blog: {
      ...siteContent.blog,
      eyebrow: siteContent.blog.eyebrow[locale],
      title: siteContent.blog.title[locale],
      titleAccent: siteContent.blog.titleAccent[locale],
      intro: siteContent.blog.intro[locale],
      emptyState: siteContent.blog.emptyState[locale],
      featuredLabel: siteContent.blog.featuredLabel[locale],
      latestLabel: siteContent.blog.latestLabel[locale],
      editorialNote: siteContent.blog.editorialNote[locale],
      newsletter: {
        title: siteContent.blog.newsletter.title[locale],
        intro: siteContent.blog.newsletter.intro[locale],
        inputPlaceholder: siteContent.blog.newsletter.inputPlaceholder[locale],
        ctaLabel: siteContent.blog.newsletter.ctaLabel[locale],
        helper: siteContent.blog.newsletter.helper[locale],
      },
    },
    contact: {
      ...siteContent.contact,
      eyebrow: siteContent.contact.eyebrow[locale],
      title: siteContent.contact.title[locale],
      intro: siteContent.contact.intro[locale],
      availability: siteContent.contact.availability[locale],
      primaryCtas: siteContent.contact.primaryCtas[locale].map((cta) => ({
        ...cta,
        href: cta.href.startsWith("/") ? `/${locale}${cta.href}` : cta.href,
      })),
    },
    projects: siteContent.projects.map((project) => ({
      ...project,
      headline: project.headline[locale],
      summary: project.summary[locale],
      challenge: project.challenge[locale],
      impact: project.impact[locale],
      demoAccess: project.demoAccess?.[locale],
      media: {
        ...project.media,
        alt: project.media.alt[locale],
      },
    })),
  };
}

export function getFeaturedProjects(locale: Locale) {
  const content = getSiteContent(locale);

  return content.projects.filter((project) =>
    content.home.featuredProjectSlugs.includes(project.slug),
  );
}

