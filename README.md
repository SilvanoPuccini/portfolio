# Silvano Puccini | Portfolio v2

> Actualización completa del portfolio original (v1 académico → v2 producción). Stack, arquitectura y propósito reescritos desde cero.

## 🔗 **[silvanopuccini.dev](https://silvanopuccini.dev)**

---

![Preview](https://raw.githubusercontent.com/SilvanoPuccini/portfolio/main/docs/assets/SilvanoPuccini_FullStack.png)

---
## Por qué existe esta versión

El portfolio v1 (ConquerBlocks, 2026) cumplió su propósito académico. Este reemplaza ese sitio estático con una plataforma de producto real: sobre mi, proyectos. servicios, contacto, blog técnico con suscriptores, panel de admin autenticado y soporte completo ES/EN.

No es un rediseño cosmético. Es una reescritura completa con stack de producción.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 |
| Base de datos | Supabase (PostgreSQL) |
| Email | Resend |
| Blog | MDX |
| IA | Claude Code - Google Gemini |
| Deploy | Vercel |

---

## Qué incluye

**Portfolio público**
- Proyectos en producción con decisiones técnicas visibles
- Página de servicios y contacto
- Soporte completo ES/EN con rutas localizadas

**Blog — El Radar**
- Posts en MDX con categorías, reading time y número de issue
- Feed con filtros por categoría y paginación
- Newsletter con welcome email automático y envío batch vía Resend
- Unsubscribe con un click

**Admin**
- Autenticación server-side con cookie HTTP-only (sin secrets en el bundle)
- Middleware de protección en todas las rutas `/api/admin/*`
- Dashboard con stats, mensajes de contacto, suscriptores y historial de newsletters

**Seguridad**
- Sin `NEXT_PUBLIC_` en variables sensibles
- CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- Rate limiting en formularios de contacto y suscripción
- Validación de longitud y sanitización de inputs

---

## Estructura

```
src/
├── app/
│   ├── [locale]/          # Rutas públicas ES/EN
│   │   ├── page.tsx       # Home
│   │   ├── blog/          # Blog + post individual
│   │   ├── projects/      # Proyectos
│   │   ├── services/      # Servicios
│   │   └── contact/       # Contacto
│   ├── admin/             # Panel admin (protegido)
│   └── api/               # API routes
│       ├── admin/         # Endpoints admin (middleware)
│       ├── contact/       # Formulario de contacto
│       ├── subscribe/     # Suscripción al newsletter
│       └── notify/        # Envío de newsletter
├── components/
│   ├── blocks/            # Secciones reutilizables
│   ├── blog/              # Componentes del blog
│   ├── site/              # Header, footer, shell
│   └── admin/             # UI del admin
├── content/               # Datos del sitio y schema
├── lib/                   # Supabase, Resend, rate-limit
├── posts/                 # MDX posts del blog
└── middleware.ts          # Auth guard para /api/admin/*
```

---

## Local

```bash
git clone https://github.com/SilvanoPuccini/portfolio.git
cd portfolio
npm install
cp .env.example .env.local   # completar variables
npm run dev
```

Variables requeridas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_AUDIENCE_ID`, `NOTIFY_SECRET`, `ADMIN_PASSWORD`, `GOOGLE_AI_API_KEY`, `NEXT_PUBLIC_SITE_URL`.

---

## Contacto

- silvano.jm.puccini@gmail.com
- [LinkedIn](https://www.linkedin.com/in/silvano-puccini/)
- [GitHub](https://github.com/SilvanoPuccini)

---

---

# Portfolio v1 — Registro académico

> Lo que sigue es el README original del portfolio académico (ConquerBlocks, Feb 2026). Se mantiene como registro de la primera versión del proyecto.

---

## CSS Tarea Entregable 4 | ConquerBlocks Academy

### Información del Estudiante

| Campo | Detalle |
|-------|---------|
| **Nombre** | Silvano Puccini |
| **Curso** | Desarrollo Web - CSS Avanzado |
| **Academia** | ConquerBlocks |
| **Fecha** | Febrero 2026 |

---

### Demo en Vivo

### 🔗 **[Ver Portfolio v1](https://silvanopuccini.github.io/portfolio/)**

---

### Descripción del Proyecto

Portfolio personal profesional como Full Stack Developer en formación. Sitio web responsive con soporte para múltiples idiomas (EN/ES) y temas (Dark/Light).

**Características principales:**
- Modo oscuro/claro
- Bilingüe (Inglés/Español)
- Diseño Mobile First
- Formulario de contacto funcional (Formspree)
- Build con Vite
- Estilos con SASS modular

---

### Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| **Vite** | Build tool & dev server |
| **SASS/SCSS** | Preprocesador CSS modular |
| **JavaScript ES6+** | Interactividad, i18n, theme toggle |
| **HTML5** | Estructura semántica |
| **Formspree** | Backend para formulario de contacto |
| **Google Fonts** | Space Grotesk |

---

### Design System

#### Colores (Dark Theme)

| Color | Hex | Uso |
|-------|-----|-----|
| Negro | `#151515` | Fondo principal |
| Verde | `#4EE1A0` | Acentos, hover |
| Gris oscuro | `#242424` | Fondos secundarios |
| Gris claro | `#D9D9D9` | Textos secundarios |
| Blanco | `#FFFFFF` | Textos principales |

#### Tipografía

| Elemento | Font | Tamaño | Peso |
|----------|------|--------|------|
| Heading XL | Space Grotesk | 88px | 700 |
| Heading L | Space Grotesk | 48px | 700 |
| Body | Space Grotesk | 18px | 500 |

---

### Estructura del Proyecto

```
portfolio/
├── src/
│   ├── assets/
│   ├── js/
│   │   ├── main.js
│   │   └── i18n.js
│   └── scss/
│       ├── _variables.scss
│       ├── _mixins.scss
│       └── main.scss
├── index.html
├── package.json
└── vite.config.js
```

---

### Instalación

```bash
git clone https://github.com/silvanopuccini/portfolio.git
cd portfolio
npm install
npm run dev
```

---

### Secciones

1. **Header** — Logo, redes sociales, toggles de tema e idioma
2. **Hero** — Presentación, foto de perfil, CTA
3. **Skills** — Frontend, Backend, Herramientas
4. **Projects** — Grid de proyectos con hover effects
5. **Contact** — Formulario funcional con Formspree
6. **Footer** — Logo y redes sociales

---

### Proyectos Incluidos

| Proyecto | Tecnologías | Demo |
|----------|-------------|------|
| Modern Art Gallery | HTML, CSS, SASS | [Ver](https://silvanopuccini.github.io/modern-art-gallery/) |
| GathSession | HTML, CSS, SASS | [Ver](https://silvanopuccini.github.io/GathSession/) |
| GlowQueen SPA | HTML, CSS, JS | [Ver](https://silvanopuccini.github.io/glowqueen-spa/) |
| Payment Tracker | React, TS, Supabase | [Ver](https://payment-tracker-bot.vercel.app/) |
| Cat Gallery | HTML, CSS, JS, API | [Ver](https://silvanopuccini.github.io/cat-gallery/) |

---

### Licencia

Proyecto desarrollado en el marco del programa educativo de **ConquerBlocks Academy**.

---

<div align="center">

**Silvano Puccini** | Full Stack Developer | 2026

</div>
