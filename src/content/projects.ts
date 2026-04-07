import type { Project } from "@/content/schema";

export const projects: Project[] = [
  {
    slug: "ferrelonstock",
    name: "FerrelonStock",
    featured: true,
    priority: true,
    category: "ecommerce",
    status: "live",
    year: "2026",
    headline: {
      es: "E-commerce profesional para ferretería con Django 5.",
      en: "Professional hardware e-commerce built with Django 5.",
    },
    summary: {
      es: "Sistema de e-commerce diseñado para operar en tiempo real, con catálogo dinámico, gestión de pedidos y arquitectura preparada para escalar. Enfoque en performance, experiencia de usuario y flujo de compra optimizado.",
      en: "Full stack case study with catalog, dynamic cart, payments, shipping tracking, and production-ready operations.",
    },
    challenge: {
      es: "Diseñar una solución capaz de manejar catálogo, stock y pedidos en un entorno de alta interacción, manteniendo fluidez y tiempos de respuesta bajos.",
      en: "Solve a real online hardware-store workflow with no-refresh UX and a robust back office.",
    },
    impact: {
      es: [
        "Mejora en la experiencia de compra.",
        "Reducción de fricción en el flujo.",
        "Base sólida para escalar el sistema.",
      ],
      en: [
        "Real-time interactive cart powered by HTMX + Alpine.js.",
        "Checkout integrated with Stripe and Mercado Pago.",
        "7 modular apps, 14 data models, and 65 automated tests.",
      ],
    },
    stack: [
      "Django 5",
      "PostgreSQL 16",
      "Tailwind CSS",
      "HTMX",
      "Alpine.js",
      "Cloudinary",
      "Gunicorn",
      "pytest-django",
    ],
    links: {
      demo: "https://ferrelonstock.onrender.com",
      repo: "https://github.com/SilvanoPuccini/ferrelonstock",
    },
    media: {
      cover: "/projects/ferrelonstock.png",
      alt: {
        es: "Captura del home de FerrelonStock.",
        en: "FerrelonStock homepage screenshot.",
      },
      assetStatus: "real",
    },
    sourceUrls: [
      "docs/assets/cv/CV_Silvano_Puccini_FullStack.pdf",
      "https://github.com/SilvanoPuccini/SilvanoPuccini",
      "https://github.com/SilvanoPuccini/ferrelonstock",
      "https://ferrelonstock.onrender.com",
    ],
  },
  {
    slug: "aktivar",
    name: "Aktivar",
    featured: true,
    priority: true,
    category: "platform",
    status: "live",
    year: "2026",
    headline: {
      es: "Red social de actividades grupales en LATAM con logística integrada.",
      en: "LATAM group-activities network with integrated trip logistics.",
    },
    summary: {
      es: "Plataforma orientada a experiencia y performance, diseñada para comunicar valor de producto con claridad. Optimización de interacción y arquitectura frontend centrada en usuario.",
      en: "Full stack platform with maps, real-time chat, payments, and carpooling workflows for group experiences.",
    },
    challenge: {
      es: "Combinar comunidad, transporte, pagos y seguridad en una sola experiencia para eventos grupales.",
      en: "Combine community, transport, payments, and safety into a single event experience.",
    },
    impact: {
      es: [
        "Feed de actividades con geolocalización y mapa interactivo sobre PostGIS.",
        "Chat grupal vía WebSocket y pagos con Stripe Checkout / Connect.",
        "Monorepo full stack con 8 apps Django, CI/CD y más de 100 tests.",
      ],
      en: [
        "Activity feed with geolocation and an interactive PostGIS-backed map.",
        "Group chat over WebSockets plus Stripe Checkout / Connect payments.",
        "Full stack monorepo with 8 Django apps, CI/CD, and 100+ tests.",
      ],
    },
    stack: [
      "React",
      "TypeScript",
      "Django 5",
      "Django REST Framework",
      "Celery",
      "Django Channels",
      "PostgreSQL 16",
      "PostGIS",
      "Redis 7",
      "Stripe",
      "Docker Compose",
      "Nginx",
    ],
    links: {
      demo: "https://aktivar.online",
      repo: "https://github.com/SilvanoPuccini/aktivar",
    },
    media: {
      cover: "/projects/aktivar.png",
      alt: {
        es: "Captura de acceso de Aktivar.",
        en: "Aktivar login screenshot.",
      },
      assetStatus: "real",
    },
    sourceUrls: [
      "https://github.com/SilvanoPuccini/SilvanoPuccini",
      "https://github.com/SilvanoPuccini/aktivar",
      "https://aktivar.online",
    ],
  },
  {
    slug: "modern-art-gallery",
    name: "Modern Art Gallery",
    featured: true,
    priority: true,
    category: "web-app",
    status: "live",
    year: "2026",
    headline: {
      es: "Landing editorial premium para una galería de arte moderna.",
      en: "Premium editorial landing page for a modern art gallery.",
    },
    summary: {
      es: "Proyecto enfocado en narrativa visual y jerarquía de contenido, con implementación cuidada de layout, interacción y accesibilidad.",
      en: "Frontend project focused on visual hierarchy, storytelling, and performance for an immersive experience.",
    },
    challenge: {
      es: "Llevar una UI estática a una experiencia de marca con ritmo editorial y foco en conversión.",
      en: "Turn a static UI into a brand experience with editorial rhythm and conversion focus.",
    },
    impact: {
      es: [
        "Composición visual inspirada en producto premium.",
        "Stack liviano con HTML, CSS y SASS.",
        "Publicado en GitHub Pages como caso navegable real.",
      ],
      en: [
        "Visual composition inspired by premium product storytelling.",
        "Lightweight stack built with HTML, CSS, and SASS.",
        "Published on GitHub Pages as a live, navigable case.",
      ],
    },
    stack: ["HTML", "CSS", "SASS"],
    links: {
      demo: "https://silvanopuccini.github.io/modern-art-gallery/",
      repo: "https://github.com/SilvanoPuccini/modern-art-gallery",
    },
    media: {
      cover: "/projects/modern-art-gallery.jpg",
      alt: {
        es: "Hero de Modern Art Gallery.",
        en: "Modern Art Gallery hero image.",
      },
      assetStatus: "real",
    },
    sourceUrls: [
      "README.md",
      "https://github.com/SilvanoPuccini/modern-art-gallery",
      "https://silvanopuccini.github.io/modern-art-gallery/",
    ],
  },
  {
    slug: "paytrack",
    name: "PayTrack",
    featured: true,
    priority: true,
    category: "automation",
    status: "beta",
    year: "2026",
    headline: {
      es: "Tracker de pagos para freelancers LATAM con visión de producto.",
      en: "Payment tracker for LATAM freelancers with strong product thinking.",
    },
    summary: {
      es: "Aplicación orientada a gestión financiera, con integración de APIs y estructura preparada para evolución futura.",
      en: "Application focused on financial visibility, payment tracking, and future automation via WhatsApp and AI.",
    },
    challenge: {
      es: "Ordenar el flujo de cobros freelance y convertirlo en una herramienta accionable para negocio personal.",
      en: "Structure the freelance payment workflow and turn it into an actionable personal-business tool.",
    },
    impact: {
      es: [
        "Base funcional en React + TypeScript + Supabase.",
        "Roadmap de 17 fases, wireframes UX y auditoría técnica documentada.",
        "Pensado para freelancers de LATAM con seguimiento multicanal.",
      ],
      en: [
        "Functional base built with React + TypeScript + Supabase.",
        "17-phase roadmap, UX wireframes, and documented technical audit.",
        "Designed for LATAM freelancers needing multi-channel payment follow-up.",
      ],
    },
    stack: ["React", "TypeScript", "Vite", "Supabase", "WhatsApp API"],
    links: {
      demo: "https://payment-tracker-bot.vercel.app/login",
      repo: "https://github.com/SilvanoPuccini/payment-tracker-bot",
    },
    media: {
      cover: "/projects/paytrack.png",
      alt: {
        es: "Captura de PayTrack.",
        en: "PayTrack screenshot.",
      },
      assetStatus: "real",
    },
    sourceUrls: [
      "docs/assets/cv/CV_Silvano_Puccini_FullStack.pdf",
      "https://github.com/SilvanoPuccini/payment-tracker-bot",
      "https://payment-tracker-bot.vercel.app/login",
    ],
  },
  {
    slug: "facturia-2-0",
    name: "FacturIA 2.0",
    featured: true,
    priority: false,
    category: "automation",
    status: "case-study",
    year: "2025",
    headline: {
      es: "Automatización contable con IA para clasificar comprobantes y generar reportes.",
      en: "AI-powered accounting automation for receipt classification and reporting.",
    },
    summary: {
      es: "Sistema end-to-end para procesar comprobantes financieros mediante Gemini Vision y tableros interactivos.",
      en: "End-to-end system that processes financial documents with Gemini Vision and interactive dashboards.",
    },
    challenge: {
      es: "Reducir trabajo manual en conciliación y análisis contable con un pipeline automatizado verificable.",
      en: "Reduce manual reconciliation and accounting analysis through a verifiable automated pipeline.",
    },
    impact: {
      es: [
        "Pipeline: email → IA → base SQL → dashboard.",
        "Procesa PDFs, imágenes y CSV con auditoría completa.",
        "Proyecto real importante aunque la UI pública todavía no esté cerrada.",
      ],
      en: [
        "Pipeline: email → AI → SQL database → dashboard.",
        "Processes PDFs, images, and CSV files with full auditing.",
        "Important real project even if the final public UI is still evolving.",
      ],
    },
    stack: [
      "Python 3.10+",
      "Streamlit",
      "Google Gemini AI",
      "Plotly",
      "PostgreSQL",
      "SQLite",
      "Gmail API",
    ],
    links: {
      repo: "https://github.com/SilvanoPuccini/FacturIA-2.0",
    },
    media: {
      cover: "/projects/facturia-2-0.png",
      alt: {
        es: "Vista previa de FacturIA 2.0.",
        en: "FacturIA 2.0 preview.",
      },
      assetStatus: "real",
    },
    sourceUrls: [
      "docs/assets/cv/CV_Silvano_Puccini_FullStack.pdf",
      "README.md",
      "https://github.com/SilvanoPuccini/SilvanoPuccini",
      "https://github.com/SilvanoPuccini/FacturIA-2.0",
    ],
  },
];
