export type Language = "es" | "en";

export const dictionary = {
  es: {
    nav: {
      home: "Inicio",
      about: "Sobre mí",
      projects: "Proyectos",
      services: "Servicios",
      cv: "CV",
      contact: "Contacto",
    },
    hero: {
      badge: "Diseño & Desarrollo Web",
      titleLine1: "Silvano Puccini",
      titleLine2: "Full Stack Developer",
      description:
        "Transformo experiencia comercial y técnica en productos digitales con identidad, rendimiento y foco en resultados.",
      ctaProjects: "Ver proyectos",
      ctaContact: "Contactar",
    },
    projects: {
      title: "Proyectos principales",
      viewAll: "Ver todos",
      demo: "Demo",
      repo: "Código",
      pending: "Próximamente",
    },
    services: {
      title: "Servicios",
    },
    about: {
      title: "Perfil profesional",
      text:
        "Desarrollador Full Stack en formación con +10 años de experiencia en ventas, liderazgo y gestión de equipos, hoy aplicado a desarrollo de productos web.",
      stack: "Stack principal",
    },
    cta: {
      title: "¿Trabajamos juntos?",
      text: "Contame tu idea y la convertimos en un producto digital real.",
      button: "Empezar proyecto",
    },
    contact: {
      title: "Hablemos de tu proyecto",
      description:
        "Este formulario mantiene el flujo activo con Formspree, igual que en la web anterior.",
      name: "Nombre",
      email: "Email",
      message: "Contame sobre tu proyecto",
      send: "Enviar mensaje",
      timezone: "Zona horaria: UTC-3 (Argentina)",
    },
  },
  en: {
    nav: {
      home: "Home",
      about: "About",
      projects: "Projects",
      services: "Services",
      cv: "CV",
      contact: "Contact",
    },
    hero: {
      badge: "Web Design & Development",
      titleLine1: "Silvano Puccini",
      titleLine2: "Full Stack Developer",
      description:
        "I transform business and technical experience into digital products with identity, performance, and results.",
      ctaProjects: "View projects",
      ctaContact: "Contact",
    },
    projects: {
      title: "Main projects",
      viewAll: "View all",
      demo: "Live demo",
      repo: "Code",
      pending: "Coming soon",
    },
    services: {
      title: "Services",
    },
    about: {
      title: "Professional profile",
      text:
        "Full Stack developer in training with 10+ years of sales, leadership and team management experience, now applied to web product development.",
      stack: "Core stack",
    },
    cta: {
      title: "Shall we work together?",
      text: "Tell me about your idea and we’ll turn it into a real digital product.",
      button: "Start project",
    },
    contact: {
      title: "Let's talk about your project",
      description:
        "This form keeps the same live Formspree workflow used in the previous website.",
      name: "Name",
      email: "Email",
      message: "Tell me about your project",
      send: "Send message",
      timezone: "Timezone: UTC-3 (Argentina)",
    },
  },
} as const;
