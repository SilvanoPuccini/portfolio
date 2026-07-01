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
      es: "E-commerce Django 5 para ferretería con pagos reales, tracking y reviews.",
      en: "Django 5 hardware e-commerce with real payments, shipment tracking, and reviews.",
    },
    summary: {
      es: "E-commerce para ferretería y corralón desarrollado con Django 5, con catálogo filtrable por categorías y marcas, carrito sin recarga con HTMX, checkout con Stripe y Mercado Pago, tracking de envíos y valoraciones de productos.",
      en: "Django 5 e-commerce for a hardware store with category and brand filters, an HTMX-powered cart, Stripe and Mercado Pago checkout, shipment tracking, and product reviews.",
    },
    challenge: {
      es: "Transformar el Proyecto 11 de ConquerBlocks en un e-commerce completo y desplegado, manteniendo Django como base con arquitectura MVT modular, pagos reales y flujos operativos de tienda.",
      en: "Turn ConquerBlocks Project 11 into a complete deployed e-commerce product while keeping Django at the core with modular MVT architecture, real payments, and operational store workflows.",
    },
    impact: {
      es: [
        "Catálogo con búsqueda fuzzy, filtros por categoría y marca, y carrito en sesión actualizado con HTMX + Alpine.js.",
        "Checkout con Stripe y Mercado Pago, envíos por zonas y transportistas, tracking con timeline y webhooks de carrier.",
        "Arquitectura MVT en 7 apps modulares, PostgreSQL 16 + Cloudinary en producción y 65 tests automatizados.",
      ],
      en: [
        "Catalog with fuzzy search, category and brand filters, plus a session cart updated with HTMX and Alpine.js.",
        "Checkout with Stripe and Mercado Pago, shipping by zone and carrier, and a tracking timeline backed by webhooks.",
        "MVT architecture split into 7 modular apps, PostgreSQL 16 + Cloudinary in production, and 65 automated tests.",
      ],
    },
    stack: [
      "Python 3.10",
      "Django 5",
      "PostgreSQL 16",
      "HTMX",
      "Alpine.js",
      "Flowbite",
      "Tailwind CSS",
      "Stripe",
      "Mercado Pago",
      "Cloudinary",
      "django-allauth",
      "pytest-django",
    ],
    links: {
      demo: "https://ferrelonstock.onrender.com",
      repo: "https://github.com/SilvanoPuccini/ferrelonstock",
    },
    demoAccess: {
      es: {
        label: "Credenciales demo",
        credentials: "admin / FerrelonAdmin2026!",
      },
      en: {
        label: "Demo credentials",
        credentials: "admin / FerrelonAdmin2026!",
      },
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
      "https://raw.githubusercontent.com/SilvanoPuccini/ferrelonstock/main/README.md",
      "https://github.com/SilvanoPuccini/ferrelonstock",
      "https://ferrelonstock.onrender.com",
    ],
  },
  {
    slug: "pediacore",
    name: "PediaCore",
    featured: true,
    priority: true,
    category: "platform",
    status: "live",
    year: "2026",
    headline: {
      es: "Plataforma integral para consultorio pediátrico con historia clínica, turnos online y pagos.",
      en: "Full-stack pediatric clinic platform with medical records, online booking, and payments.",
    },
    summary: {
      es: "Sistema que digitaliza la operación completa de un consultorio pediátrico independiente en Chile: reservas online, historia clínica con curvas OMS, portal de padres, pagos con MercadoPago y panel administrativo con analítica financiera.",
      en: "System that digitizes the entire operation of an independent pediatric practice in Chile: online booking, medical records with WHO growth curves, parent portal, MercadoPago payments, and admin dashboard with financial analytics.",
    },
    challenge: {
      es: "Reemplazar un flujo fragmentado entre papel, WhatsApp y planillas por una plataforma unificada que gestione turnos, historias clínicas, pagos y comunicación — en producción real con pacientes.",
      en: "Replace a fragmented workflow of paper, WhatsApp, and spreadsheets with a unified platform managing appointments, medical records, payments, and communications — in real production with patients.",
    },
    impact: {
      es: [
        "Historia clínica SOAP con antropometría OMS, vacunas PNI y archivos adjuntos — con auditoría de acceso.",
        "Reservas multi-sede con calendario dinámico, hold atómico de 15 min y waitlist automática.",
        "773 tests en 50 archivos. Desplegado en DigitalOcean con Docker, Nginx y TLS automático.",
      ],
      en: [
        "SOAP medical records with WHO anthropometrics, PNI vaccination calendar, and file attachments — with access audit logging.",
        "Multi-location booking with dynamic calendar, 15-min atomic hold, and automatic waitlist.",
        "773 tests across 50 files. Deployed on DigitalOcean with Docker, Nginx, and auto-TLS.",
      ],
    },
    stack: [
      "Python 3.12",
      "Django 5.2",
      "Django REST Framework",
      "React 19",
      "TypeScript",
      "Vite",
      "Tailwind CSS",
      "PostgreSQL 16",
      "MercadoPago",
      "Docker",
      "Nginx",
      "Sentry",
    ],
    links: {
      demo: "https://estefipediatra.com",
      repo: "https://github.com/SilvanoPuccini/pediacore",
    },
    media: {
      cover: "/projects/pediacore.png",
      alt: {
        es: "Captura de PediaCore — consultorio pediátrico.",
        en: "PediaCore screenshot — pediatric clinic platform.",
      },
      assetStatus: "placeholder",
    },
    sourceUrls: [
      "https://github.com/SilvanoPuccini/pediacore",
      "https://estefipediatra.com",
    ],
  },
  {
    slug: "my-marketing-agency",
    name: "My Marketing Agency",
    featured: true,
    priority: true,
    category: "platform",
    status: "live",
    year: "2026",
    headline: {
      es: "Plataforma SaaS para agencias de marketing con calendario editorial, aprobaciones y portal de clientes.",
      en: "SaaS platform for marketing agencies with editorial calendar, approval workflows, and client portal.",
    },
    summary: {
      es: "Sistema integrado que centraliza la gestión de cuentas, calendarios editoriales, flujos de aprobación, seguimiento de horas, facturación y comunicación con clientes en una sola interfaz.",
      en: "Integrated system that centralizes account management, editorial calendars, approval workflows, time tracking, billing, and client communication in one unified interface.",
    },
    challenge: {
      es: "Unificar la operación diaria de una agencia de marketing en una sola plataforma con tres interfaces diferenciadas: landing pública, backoffice interno y portal de clientes.",
      en: "Unify the daily operations of a marketing agency into a single platform with three differentiated interfaces: public landing, internal backoffice, and client portal.",
    },
    impact: {
      es: [
        "Calendario editorial mensual con piezas filtrables y ciclo de vida de 5 estados.",
        "Portal de clientes con aprobación en tiempo real e historial completo.",
        "Stack moderno con React 19, TypeScript, Supabase y Stripe para pagos.",
      ],
      en: [
        "Monthly editorial calendar with filterable content pieces and a 5-state lifecycle.",
        "Client portal with real-time approvals and complete historical records.",
        "Modern stack with React 19, TypeScript, Supabase, and Stripe for payments.",
      ],
    },
    stack: [
      "React 19",
      "TypeScript",
      "Vite",
      "Tailwind CSS",
      "Shadcn/UI",
      "Zustand",
      "TanStack Query",
      "Supabase",
      "Stripe",
      "Framer Motion",
    ],
    links: {
      demo: "https://my-marketing-agency.vercel.app/",
      repo: "https://github.com/SilvanoPuccini/my-marketing-agency",
    },
    media: {
      cover: "/projects/my-marketing-agency.png",
      alt: {
        es: "Captura de My Marketing Agency.",
        en: "My Marketing Agency screenshot.",
      },
      assetStatus: "real",
    },
    sourceUrls: [
      "https://raw.githubusercontent.com/SilvanoPuccini/my-marketing-agency/main/README.md",
      "https://github.com/SilvanoPuccini/my-marketing-agency",
      "https://my-marketing-agency.vercel.app/",
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
      es: "Plataforma enfocada en experiencia y performance, con frontend centrado en usuario y una propuesta de valor clara.",
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
      "/cv/CV_Silvano_Puccini_FullStack.pdf",
      "https://github.com/SilvanoPuccini/payment-tracker-bot",
      "https://payment-tracker-bot.vercel.app/login",
    ],
  },
  {
    slug: "ferrestock",
    name: "FerreStock",
    featured: true,
    priority: false,
    category: "platform",
    status: "live",
    year: "2026",
    headline: {
      es: "Sistema de inventario para ferreteria con compras, reportes y control por roles.",
      en: "Inventory system for hardware stores with purchasing flows, reporting, and role-based access.",
    },
    summary: {
      es: "Sistema de inventario profesional desarrollado con Django para gestionar productos, categorias, proveedores, movimientos de stock y ordenes de compra.",
      en: "Professional Django inventory system for products, categories, suppliers, stock movements, and purchase orders.",
    },
    challenge: {
      es: "Llevar una entrega academica de Django hacia una solucion funcional mas cercana a un producto real para operacion diaria.",
      en: "Push an academic Django delivery toward a functional solution closer to a real operational product.",
    },
    impact: {
      es: [
        "Dashboard con metricas, graficos y alertas de stock bajo.",
        "Importacion masiva por CSV y reportes exportables en CSV, Excel y PDF.",
        "Demo publica en Railway con roles Administrador, Operador y Consulta.",
      ],
      en: [
        "Dashboard with metrics, charts, and low-stock alerts.",
        "Bulk CSV import plus exportable CSV, Excel, and PDF reports.",
        "Public Railway demo with Administrator, Operator, and Viewer roles.",
      ],
    },
    stack: ["Python 3.12", "Django 5", "PostgreSQL", "Bootstrap 5", "openpyxl", "reportlab", "Cloudinary"],
    links: {
      demo: "https://ferrestock.up.railway.app",
      repo: "https://github.com/SilvanoPuccini/ferrestock",
    },
    demoAccess: {
      es: {
        label: "Usuarios demo",
        credentials: "admin_demo / Admin12345!",
      },
      en: {
        label: "Demo users",
        credentials: "admin_demo / Admin12345!",
      },
    },
    media: {
      cover: "https://res.cloudinary.com/dukgz1lpn/image/upload/v1775621645/Inicio-FerreStock_tp9n5y.png",
      alt: {
        es: "Captura del dashboard de FerreStock.",
        en: "FerreStock dashboard screenshot.",
      },
      assetStatus: "real",
    },
    sourceUrls: [
      "https://raw.githubusercontent.com/SilvanoPuccini/ferrestock/main/README.md",
      "https://github.com/SilvanoPuccini/ferrestock",
      "https://ferrestock.up.railway.app",
      "https://res.cloudinary.com/dukgz1lpn/image/upload/v1775621645/Inicio-FerreStock_tp9n5y.png",
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
      "/cv/CV_Silvano_Puccini_FullStack.pdf",
      "README.md",
      "https://github.com/SilvanoPuccini/SilvanoPuccini",
      "https://github.com/SilvanoPuccini/FacturIA-2.0",
    ],
  },
];
