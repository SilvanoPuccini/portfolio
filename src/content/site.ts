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
    es: "Portfolio editorial · full stack + negocio",
    en: "Editorial portfolio · full stack + business",
  },
  title: {
    es: "Silvano Puccini",
    en: "Silvano Puccini",
  },
  subtitle: {
    es: "Construyo productos digitales con impacto real en negocio.",
    en: "I build digital products that work in real-world scenarios, from architecture to the final experience.",
  },
  intro: {
    es: "Full Stack Developer enfocado en ejecución, performance y sistemas escalables. Trabajo en plataformas, automatización y soluciones que funcionan en producción.",
    en: "Full Stack Developer focused on execution, performance, and scalable systems. I work on platforms, automation, and products with real business impact.",
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
      { label: "Ver proyectos", href: "/projects" },
      { label: "Hablemos", href: "/contact" },
    ],
    en: [
      { label: "View projects", href: "/projects" },
      { label: "Let’s talk", href: "/contact" },
    ],
  },
  featuredProjectSlugs: ["ferrelonstock", "aktivar", "modern-art-gallery", "paytrack", "facturia-2-0"],
  sourceUrls: [
    "docs/assets/cv/CV_Silvano_Puccini_FullStack.pdf",
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
      items: ["React", "Next.js", "TypeScript", "Javascript", "HTML", "Tailwind CSS"],
    },
    {
      title: { es: "Backend", en: "Backend" },
      items: ["Node.js", "Express.js", "Python", "Django", "APIs REST"],
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
      items: ["VPS", "Vercel", "AWS", "Render", "Digital Ocean", "Cloudinary"],
    },
  ],
  cvLabel: {
    es: "Descargar CV",
    en: "Download CV",
  },
  sourceUrls: [
    "docs/assets/cv/CV_Silvano_Puccini_FullStack.pdf",
    "https://github.com/SilvanoPuccini",
    "https://www.linkedin.com/in/silvano-puccini/",
  ],
};

const services: ServiceItem[] = [
  {
    slug: "full-stack-builds",
    title: {
      es: "Desarrollo full stack end-to-end",
      en: "End-to-end full stack development",
    },
    description: {
      es: "Diseño e implementación de aplicaciones con frontend, backend, base de datos, autenticación y despliegue real.",
      en: "Design and implementation of applications covering frontend, backend, database, authentication, and real deployment.",
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
    title: {
      es: "Automatización e IA aplicada",
      en: "Applied automation and AI",
    },
    description: {
      es: "Uso IA, pipelines y tooling productivo para reducir tareas manuales y generar flujos auditables.",
      en: "I use AI, pipelines, and production-grade tooling to reduce manual work and create auditable workflows.",
    },
    proofPoints: {
      es: ["FacturIA 2.0", "MCP / agentes IA", "Dashboards y clasificación automática"],
      en: ["FacturIA 2.0", "MCP / AI agents", "Dashboards and automatic classification"],
    },
    sourceUrls: [
      "docs/assets/cv/CV_Silvano_Puccini_FullStack.pdf",
      "https://github.com/SilvanoPuccini/FacturIA-2.0",
      "https://github.com/SilvanoPuccini",
    ],
  },
  {
    slug: "product-ux-engineering",
    title: {
      es: "Ingeniería con visión de producto y negocio",
      en: "Engineering with product and business perspective",
    },
    description: {
      es: "Traduzco necesidades comerciales en experiencias utilizables, medibles y técnicamente sostenibles.",
      en: "I translate business needs into usable, measurable, and technically sustainable experiences.",
    },
    proofPoints: {
      es: ["+10 años en gestión comercial", "Roadmaps y auditorías técnicas", "Foco en UX y claridad narrativa"],
      en: ["10+ years in commercial management", "Roadmaps and technical audits", "Focus on UX and narrative clarity"],
    },
    sourceUrls: [
      "docs/assets/cv/CV_Silvano_Puccini_FullStack.pdf",
      "https://github.com/SilvanoPuccini/SilvanoPuccini",
    ],
  },
];

const blog: BlogContent = {
  eyebrow: {
    es: "Editorial & thoughts",
    en: "Editorial & thoughts",
  },
  title: {
    es: "Pensamiento & Arquitectura",
    en: "Thought & Architecture",
  },
  titleAccent: {
    es: "Digital",
    en: "Digital",
  },
  intro: {
    es: "Explorando la intersección entre diseño sistémico, frontend de alto rendimiento, producto y automatización aplicada con un lenguaje visual editorial y premium.",
    en: "Exploring the intersection of systemic design, high-performance frontend, product thinking, and applied automation through a premium editorial visual language.",
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
    es: "Primera versión del blog: layout finalizado y contenido inicial marcado explícitamente como placeholder temporal donde todavía no existe artículo real suficiente.",
    en: "First release of the blog: layout finalized and initial content explicitly marked as temporary placeholder wherever enough real article content does not yet exist.",
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
  posts: [
    {
      slug: "placeholder-web-vitals-arquitecturas-masivas",
      status: "placeholder",
      category: {
        es: "Performance",
        en: "Performance",
      },
      featured: true,
      layout: "standard",
      accent: "cyan",
      publishedAt: "2026-04-06",
      readingTime: "8 min",
      title: {
        es: "La escala invisible: optimizando Web Vitals en arquitecturas masivas",
        en: "The invisible scale: optimizing Web Vitals in large-scale architectures",
      },
      excerpt: {
        es: "Placeholder editorial alineado al layout final: resume cómo una estrategia de hidratación selectiva, arquitectura clara y decisiones de performance pueden mejorar el LCP en productos exigentes.",
        en: "Editorial placeholder aligned with the final layout: it outlines how selective hydration, clear architecture, and performance decisions can improve LCP in demanding products.",
      },
      body: {
        es: [
          "Placeholder permitido por spec: esta nota mantiene visible la narrativa editorial del blog mientras se redacta y valida un artículo real con métricas concretas.",
          "La dirección temática cruza performance frontend, estrategia de datos y decisiones de arquitectura que impactan experiencia de usuario y negocio.",
        ],
        en: [
          "Placeholder allowed by spec: this note keeps the editorial narrative visible while a real article with concrete metrics is being written and validated.",
          "The intended theme combines frontend performance, data strategy, and architectural decisions that affect user experience and business outcomes.",
        ],
      },
      temporaryLabel: {
        es: "Placeholder temporal",
        en: "Temporary placeholder",
      },
      sourceUrls: [
        "docs/assets/stitch/blog_silvano_puccini_v2/code.html",
        "https://github.com/SilvanoPuccini",
      ],
    },
    {
      slug: "placeholder-react-composition-patterns",
      status: "placeholder",
      category: {
        es: "React",
        en: "React",
      },
      featured: false,
      layout: "standard",
      accent: "blue",
      publishedAt: "2026-04-06",
      readingTime: "6 min",
      title: {
        es: "Patrones avanzados de composición en React 19",
        en: "Advanced composition patterns in React 19",
      },
      excerpt: {
        es: "Placeholder editorial que adelanta una futura nota sobre composición, reutilización y claridad de APIs en interfaces modernas.",
        en: "Editorial placeholder previewing a future note about composition, reuse, and API clarity in modern interfaces.",
      },
      body: {
        es: [
          "Placeholder permitido por spec: la versión final debe surgir de experiencia propia documentada y ejemplos verificables.",
          "El foco previsto está en composición, ergonomía de componentes y decisiones de arquitectura UI sostenibles.",
        ],
        en: [
          "Placeholder allowed by spec: the final version should come from documented personal experience and verifiable examples.",
          "The intended focus is composition, component ergonomics, and sustainable UI architecture decisions.",
        ],
      },
      temporaryLabel: {
        es: "Placeholder temporal",
        en: "Temporary placeholder",
      },
      sourceUrls: [
        "docs/assets/stitch/blog_silvano_puccini_v2/code.html",
        "https://github.com/SilvanoPuccini",
      ],
    },
    {
      slug: "placeholder-design-system-manifiesto",
      status: "placeholder",
      category: {
        es: "Design systems",
        en: "Design systems",
      },
      featured: false,
      layout: "standard",
      accent: "slate",
      publishedAt: "2026-04-06",
      readingTime: "10 min",
      title: {
        es: "Del token a la interfaz: el manifiesto del curador",
        en: "From token to interface: the curator manifesto",
      },
      excerpt: {
        es: "Placeholder editorial sobre sistemas de diseño, arquitectura de información y decisiones visuales que sostienen experiencias premium.",
        en: "Editorial placeholder about design systems, information architecture, and visual decisions that sustain premium experiences.",
      },
      body: {
        es: [
          "Placeholder permitido: la nota definitiva debería unir tokens, layout y narrativa visual a partir de casos reales del portfolio.",
          "El objetivo es explicar por qué un sistema falla cuando solo ordena componentes y no la jerarquía de información.",
        ],
        en: [
          "Allowed placeholder: the final note should connect tokens, layout, and visual narrative using real portfolio cases.",
          "The goal is to explain why a system fails when it only organizes components instead of the information hierarchy.",
        ],
      },
      temporaryLabel: {
        es: "Placeholder temporal",
        en: "Temporary placeholder",
      },
      sourceUrls: [
        "docs/assets/stitch/blog_silvano_puccini_v2/code.html",
        "docs/assets/stitch/puccini_obsidian/DESIGN.md",
      ],
    },
    {
      slug: "placeholder-minimalismo-tecnico",
      status: "placeholder",
      category: {
        es: "Philosophy",
        en: "Philosophy",
      },
      featured: false,
      layout: "standard",
      accent: "cyan",
      publishedAt: "2026-04-06",
      readingTime: "4 min",
      title: {
        es: "El minimalismo técnico como ventaja competitiva",
        en: "Technical minimalism as a competitive advantage",
      },
      excerpt: {
        es: "Placeholder editorial breve sobre reducir complejidad, mejorar foco y construir software más durable desde decisiones simples.",
        en: "Short editorial placeholder about reducing complexity, improving focus, and building more durable software through simpler decisions.",
      },
      body: {
        es: [
          "Placeholder permitido por spec: resume una posición editorial consistente con el tono premium y oscuro del sitio.",
          "La versión real debería apoyarse en experiencias concretas de simplificación técnica y trade-offs visibles.",
        ],
        en: [
          "Placeholder allowed by spec: it captures an editorial stance consistent with the site's premium dark tone.",
          "The real version should draw from concrete simplification experiences and visible trade-offs.",
        ],
      },
      temporaryLabel: {
        es: "Placeholder temporal",
        en: "Temporary placeholder",
      },
      sourceUrls: [
        "docs/assets/stitch/blog_silvano_puccini_v2/code.html",
        "docs/assets/stitch/puccini_obsidian/DESIGN.md",
      ],
    },
    {
      slug: "placeholder-portfolio-render-engine",
      status: "placeholder",
      category: {
        es: "Case study",
        en: "Case study",
      },
      featured: false,
      layout: "wide",
      accent: "amber",
      publishedAt: "2026-04-06",
      readingTime: "12 min",
      title: {
        es: "Reconstruyendo el motor editorial del portfolio 2026",
        en: "Rebuilding the editorial engine of the 2026 portfolio",
      },
      excerpt: {
        es: "Placeholder largo para un futuro estudio técnico sobre cómo el rebuild del portfolio unificó i18n, theming, contenido tipado y paridad visual Stitch/Figma.",
        en: "Long-form placeholder for a future technical study on how the portfolio rebuild unified i18n, theming, typed content, and Stitch/Figma visual parity.",
      },
      body: {
        es: [
          "Placeholder permitido por spec: esta pieza está pensada como estudio técnico y debe reemplazarse por una versión real una vez cerrado el rebuild.",
          "Su estructura futura combinará decisiones de arquitectura, sistema de contenido y trade-offs visuales del proyecto.",
        ],
        en: [
          "Placeholder allowed by spec: this piece is intended as a technical case study and should be replaced with a real version once the rebuild is complete.",
          "Its future structure will combine architectural decisions, content-system choices, and visual trade-offs from the project.",
        ],
      },
      temporaryLabel: {
        es: "Case study temporal",
        en: "Temporary case study",
      },
      sourceUrls: [
        "docs/assets/stitch/blog_silvano_puccini_v2/code.html",
        "docs/assets/stitch/home_silvano_puccini/code.html",
        "docs/assets/stitch/portfolio_master_plan_silvano_puccini.html",
      ],
    },
    {
      slug: "placeholder-tipografia-espacial",
      status: "placeholder",
      category: {
        es: "UI design",
        en: "UI design",
      },
      featured: false,
      layout: "standard",
      accent: "blue",
      publishedAt: "2026-04-06",
      readingTime: "7 min",
      title: {
        es: "Tipografía espacial: el ritmo del contenido",
        en: "Spatial typography: the rhythm of content",
      },
      excerpt: {
        es: "Placeholder editorial sobre jerarquía tipográfica, respiración visual y uso de escalas editoriales para interfaces complejas.",
        en: "Editorial placeholder about typographic hierarchy, visual breathing room, and editorial scales for complex interfaces.",
      },
      body: {
        es: [
          "Placeholder permitido: su reemplazo final debería surgir del sistema tipográfico realmente aplicado al portfolio y otros productos.",
          "La idea central es mostrar cómo la tipografía guía navegación, lectura y percepción de sofisticación.",
        ],
        en: [
          "Allowed placeholder: its final replacement should come from the actual typography system used in the portfolio and other products.",
          "The central idea is to show how typography guides navigation, reading, and the perception of sophistication.",
        ],
      },
      temporaryLabel: {
        es: "Placeholder temporal",
        en: "Temporary placeholder",
      },
      sourceUrls: [
        "docs/assets/stitch/blog_silvano_puccini_v2/code.html",
        "docs/assets/stitch/puccini_obsidian/DESIGN.md",
      ],
    },
  ],
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
      { label: "Hablemos de tu proyecto", href: "/contact" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/silvano-puccini/" },
    ],
    en: [
      { label: "Send email", href: "mailto:silvano.jm.puccini@gmail.com" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/silvano-puccini/" },
    ],
  },
  formspreeAction: "https://formspree.io/f/xvgvlzgk",
  sourceUrls: [
    "docs/assets/cv/CV_Silvano_Puccini_FullStack.pdf",
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
      fileName: "CV_Silvano_Puccini_FullStack.pdf",
      downloadHref: "/cv",
      sourcePath: "docs/assets/cv/CV_Silvano_Puccini_FullStack.pdf",
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
      "docs/assets/cv/CV_Silvano_Puccini_FullStack.pdf",
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
      posts: siteContent.blog.posts.map((post) => ({
        ...post,
        category: post.category[locale],
        title: post.title[locale],
        excerpt: post.excerpt[locale],
        body: post.body[locale],
        temporaryLabel: post.temporaryLabel[locale],
      })),
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

export function getFeaturedBlogPost(locale: Locale) {
  const content = getSiteContent(locale);

  return content.blog.posts.find((post) => post.featured) ?? content.blog.posts[0] ?? null;
}

export function getLatestBlogPosts(locale: Locale) {
  const content = getSiteContent(locale);
  const featuredPost = getFeaturedBlogPost(locale);

  return content.blog.posts.filter((post) => post.slug !== featuredPost?.slug);
}
