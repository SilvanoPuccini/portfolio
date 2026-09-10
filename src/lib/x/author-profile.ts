/**
 * Hechos confirmados sobre Silvano Puccini.
 *
 * El generador SOLO puede afirmar lo que esté acá. Una invención sobre su
 * experiencia se publica con su nombre y sin que nadie la revise antes: este
 * archivo es el freno.
 *
 * Contrastado el 2026-09-10 contra tres fuentes: `src/content/projects.ts`, su
 * CV y su texto de presentación de LinkedIn. Donde no coincidían, mandó lo
 * verificable en el repositorio.
 *
 * Un documento externo afirmaba producción propia en Node.js/Express. Es falso:
 * ninguno de los diez proyectos lo usa. Pero tampoco es cierto que no lo sepa
 * — su Máster lo cubrió y su CV lo lista. Por eso hay TRES niveles y no dos:
 * decir "no tiene experiencia" sería tan inexacto como decir que lo operó.
 */

export const AUTHOR_PROFILE_VERSION = 'AUTHOR-003';

export type Mastery =
  /** Lo operó en un proyecto real, en producción. Se puede afirmar sin matices. */
  | 'produccion'
  /**
   * Lo estudió y lo practicó en un trabajo académico con repositorio propio,
   * pero no tiene un proyecto real en producción. Puede compararlo y opinar,
   * y puede decir que lo practicó — no que lo operó.
   */
  | 'academico';

export interface TechFact {
  name: string;
  mastery: Mastery;
  evidence: string;
}

export const TECH: TechFact[] = [
  // ── En producción ────────────────────────────────────────────────
  { name: 'Python', mastery: 'produccion', evidence: 'PEDIACORE, FerrelonStock, Aktivar' },
  { name: 'Django 5 / DRF', mastery: 'produccion', evidence: 'PEDIACORE 5.2, FerrelonStock, Aktivar' },
  { name: 'PostgreSQL', mastery: 'produccion', evidence: 'PEDIACORE, FerrelonStock 16, Aktivar' },
  { name: 'PostGIS', mastery: 'produccion', evidence: 'Aktivar, geolocalización' },
  { name: 'Redis', mastery: 'produccion', evidence: 'Aktivar' },
  { name: 'React 19', mastery: 'produccion', evidence: 'PEDIACORE, My Marketing Agency, Aktivar' },
  { name: 'TypeScript', mastery: 'produccion', evidence: 'PEDIACORE, My Marketing Agency, silvanopuccini.dev' },
  { name: 'Next.js', mastery: 'produccion', evidence: 'silvanopuccini.dev' },
  { name: 'Supabase', mastery: 'produccion', evidence: 'My Marketing Agency, silvanopuccini.dev' },
  { name: 'HTMX / Alpine.js', mastery: 'produccion', evidence: 'FerrelonStock, carrito sin recarga' },
  { name: 'Docker', mastery: 'produccion', evidence: 'PEDIACORE sobre DigitalOcean, Aktivar' },
  { name: 'Nginx', mastery: 'produccion', evidence: 'PEDIACORE, Aktivar' },
  { name: 'GitHub Actions / CI-CD', mastery: 'produccion', evidence: 'Aktivar' },
  { name: 'Stripe', mastery: 'produccion', evidence: 'My Marketing Agency vía Edge Functions, FerrelonStock' },
  { name: 'MercadoPago', mastery: 'produccion', evidence: 'PEDIACORE, FerrelonStock' },
  { name: 'Tailwind CSS', mastery: 'produccion', evidence: 'PEDIACORE, FerrelonStock, My Marketing Agency' },
  { name: 'pytest', mastery: 'produccion', evidence: 'FerrelonStock 65 tests, PEDIACORE 827 tests' },
  { name: 'Gemini AI', mastery: 'produccion', evidence: 'PEDIACORE, OCR de documentos' },
  { name: 'WebSocket / Django Channels', mastery: 'produccion', evidence: 'Aktivar, chat en tiempo real' },
  { name: 'Claude Code / MCP / agentes', mastery: 'produccion', evidence: 'Su propio flujo de trabajo' },

  // ── Académico: hay código y repositorio, no hay producción ───────
  // Confirmado por él el 2026-09-10: trabajo académico subido a GitHub, sin
  // proyecto real. Decir "no tiene experiencia" sería tan inexacto como decir
  // que lo operó. La frase correcta es "lo practiqué en un trabajo académico".
  { name: 'Node.js / Express', mastery: 'academico', evidence: 'Trabajo académico con repositorio en GitHub; Máster ConquerBlocks' },
  { name: 'Angular', mastery: 'academico', evidence: 'Trabajo académico con repositorio en GitHub; Máster ConquerBlocks' },
  { name: 'Go', mastery: 'academico', evidence: 'Estudiado y practicado; sin proyecto en producción' },
  { name: 'Vue.js', mastery: 'academico', evidence: 'Máster ConquerBlocks' },
  { name: 'Java', mastery: 'academico', evidence: 'Figura en su CV' },
  { name: 'MongoDB', mastery: 'academico', evidence: 'Figura en su CV' },
];

export interface ProjectFact {
  id: string;
  name: string;
  url: string;
  what: string;
  stack: string;
  /** Números verificados. Nunca redondear hacia arriba ni inventar otros. */
  metrics: string[];
  /** Lo que NO se puede decir de este proyecto. */
  limits: string[];
}

/**
 * Solo estos tres se citan como ejemplo, más el sitio propio cuando el tema
 * exige Next.js. Repetir los mismos hace que el lector los reconozca de una
 * semana a la otra, en vez de ver un catálogo distinto cada vez.
 */
export const PROJECTS: ProjectFact[] = [
  {
    id: 'PEDIACORE',
    name: 'PEDIACORE',
    url: 'https://estefipediatra.com',
    what: 'Plataforma de gestión para un consultorio pediátrico, en producción. Turnos, historia clínica con curvas OMS, portal para padres, facturación, pagos y OCR de documentos.',
    stack: 'Django 5.2 + DRF, React 19 + TypeScript, PostgreSQL, django-q2, Docker sobre DigitalOcean, MercadoPago, Resend, Gemini AI',
    metrics: ['42 modelos', '~102 endpoints REST', '827 tests automatizados'],
    limits: [
      'No hay un cliente real usándolo. Lo afirmable es que está en producción y se puede tocar.',
      'La Dra. Ortigosa es su pareja: nunca presentarla como clienta.',
    ],
  },
  {
    id: 'MMA',
    name: 'My Marketing Agency',
    url: 'https://my-marketing-agency.vercel.app/',
    what: 'SaaS de gestión para agencias: calendario editorial, aprobaciones de piezas, portal de cliente y facturación.',
    stack: 'React 19 + TypeScript + Vite, Supabase (Postgres, Auth, Storage, Realtime), Stripe vía Edge Functions, Zustand, TanStack Query, Shadcn/UI',
    metrics: [],
    limits: [
      'Nació como proyecto de Desarrollo Web 3 en TUDAI.',
      'Es el único hecho con otra persona (Santiago Marchetti): el único caso donde hablar de trabajo en equipo no es teoría.',
    ],
  },
  {
    id: 'FERRELONSTOCK',
    name: 'FerrelonStock',
    url: 'https://ferrelonstock.onrender.com',
    what: 'E-commerce de ferretería con catálogo filtrable, carrito en tiempo real sin recarga, búsqueda fuzzy y seguimiento de envíos.',
    stack: 'Django 5 + HTMX + Alpine.js, PostgreSQL 16 con pg_trgm, Stripe y MercadoPago, Docker, pytest',
    metrics: ['7 apps modulares', '14 modelos', '65 tests', '7 zonas de envío y 4 carriers'],
    limits: [],
  },
  {
    id: 'PORTFOLIO',
    name: 'silvanopuccini.dev',
    url: 'https://www.silvanopuccini.dev/es/',
    what: 'Su sitio: servicios, proyectos, CV y el blog El Radar.',
    stack: 'Next.js + Supabase',
    metrics: [],
    limits: ['Usarlo como ejemplo solo cuando el tema exija Next.js.'],
  },
];

/** Los diez años previos. Es lo único que no tiene ningún otro perfil. */
export const BACKGROUND = {
  totalYears: 10,
  jobs: [
    { company: 'Tarjeta Naranja S.A.', role: 'Colaborador Comercial', period: '2012–2018', years: 6,
      detail: 'Campañas que incrementaron facturación; acompañó la apertura de una sucursal con más de 300 clientes en el primer año.' },
    { company: 'Credil SRL', role: 'Cajero / Recaudador', period: '2019–2021', years: 3,
      detail: 'Administración de cartera y resolución de reclamos.' },
    { company: 'Distribuidora Gamma', role: 'Coordinador Comercial', period: '2022–2023', years: 1,
      detail: 'Venta mayorista a nivel nacional y coordinación de equipos remotos.' },
  ],
  whatItTaught: 'Casi nadie sabe explicar técnicamente lo que necesita. Traducirlo era el trabajo.',
  howItApplies: 'Lo usa para levantar un requerimiento y discutir alcance antes de escribir código.',
};

export const EDUCATION = [
  { name: 'Tecnicatura Universitaria en Desarrollo de Aplicaciones Informáticas (TUDAI)',
    institution: 'UNDEF · IUA, Argentina', status: 'En curso, 3° año' },
  { name: 'Máster en Desarrollo Web Full Stack',
    institution: 'ConquerBlocks, España', status: 'Completado 2026' },
];

/**
 * Cómo se habla de una tecnología según su nivel. El generador copia estas
 * formas; no inventa otras.
 */
export const MASTERY_PHRASING: Record<Mastery, { allowed: string[]; forbidden: string[] }> = {
  produccion: {
    allowed: ['lo usé en producción', 'lo desplegué', 'lo mantengo', 'me pasó con'],
    forbidden: [],
  },
  academico: {
    allowed: ['lo practiqué en un trabajo académico', 'lo estudié', 'no lo llevé a producción todavía'],
    forbidden: ['lo usé en producción', 'lo desplegué', 'en un proyecto real', 'con un cliente'],
  },
};

/** Nunca, bajo ninguna redacción. */
export const NEVER_MENTION = [
  'PayTrack', 'MindCode Academy', 'FerreStock', 'Aktivar',
  'Modern Art Gallery', 'Facturia', 'Staking App',
];

export const BLOG_URL = 'https://www.silvanopuccini.dev/es/';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/silvanopuccini/';
/** Su cuenta de X. Se usa para armar la URL del hilo ya publicado. */
export const X_USERNAME = 'silvanopuccini';
