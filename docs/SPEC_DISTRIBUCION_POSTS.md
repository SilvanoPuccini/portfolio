# Sistema de distribución de posts — silvano.dev

Spec técnico completo para implementar el sistema de generación automática de contenido multi-plataforma (LinkedIn, Instagram, X) a partir de cada post del blog.

---

## Objetivo del sistema

Cuando publico un post en el blog, el sistema debe:

1. Detectar el nuevo post automáticamente.
2. Generar contenido adaptado para LinkedIn, Instagram y X usando IA (Claude).
3. Renderizar los carouseles de LinkedIn e Instagram como imágenes PNG con mi identidad visual.
4. Mostrar todo en el panel admin en estado "borrador".
5. Permitirme revisar, editar y aprobar antes de publicar.
6. Guardar cada distribución en base de datos para poder volver a generar o consultar después.

**No se publica automáticamente en las redes.** El admin es el punto de aprobación manual.

---

## Arquitectura general — el circuito

```
[1] Post publicado (.mdx commit)
      ↓
[2] Webhook o botón "Distribuir" en admin
      ↓
[3] ORQUESTADOR (API Route /api/admin/distribute)
      ├─→ Flujo LinkedIn
      ├─→ Flujo Instagram
      └─→ Flujo Twitter
      ↓
[4] Cada flujo ejecuta en paralelo:
      a) Claude API → genera contenido estructurado (JSON)
      b) Renderizador → HTML + Puppeteer → PNG (solo LinkedIn e Instagram)
      c) Guarda en Supabase tabla `distributions`
      ↓
[5] Panel admin muestra borradores con preview
      ↓
[6] Yo reviso → edito si hace falta → apruebo
      ↓
[7] Descarga de assets + copia de texto listos para pegar en cada red
```

---

## Stack a usar

| Capa | Tecnología | Justificación |
|---|---|---|
| Orquestación | Next.js API Routes | Ya existe en el proyecto |
| IA | Anthropic SDK (Claude Sonnet 4) | Calidad de escritura |
| Renderizado | Puppeteer + Chromium | Control total sobre el diseño |
| Storage | Supabase (tabla nueva) | Consistente con el stack actual |
| Queue | Sin cola por ahora | No hay volumen que lo justifique |
| Auth admin | La que ya existe | Sin cambios |

---

## Estructura de archivos nuevos

```
src/
├── app/
│   ├── admin/
│   │   └── distribuciones/
│   │       ├── page.tsx                    ← Lista de distribuciones
│   │       └── [id]/
│   │           └── page.tsx                ← Detalle + preview + editor
│   └── api/
│       └── admin/
│           ├── distribute/
│           │   └── route.ts                ← Orquestador principal
│           ├── distributions/
│           │   ├── route.ts                ← GET lista, POST nueva
│           │   └── [id]/
│           │       ├── route.ts            ← GET, PATCH, DELETE
│           │       └── regenerate/
│           │           └── route.ts        ← POST regenerar sección
│           └── render/
│               └── [type]/
│                   └── route.ts            ← Render PNG on-demand
├── lib/
│   └── distribution/
│       ├── orchestrator.ts                 ← Lógica principal
│       ├── ai/
│       │   ├── prompt-master.ts            ← Prompt maestro
│       │   ├── linkedin-generator.ts
│       │   ├── instagram-generator.ts
│       │   └── twitter-generator.ts
│       ├── renderer/
│       │   ├── puppeteer-setup.ts
│       │   ├── linkedin-templates.tsx      ← Componentes React de slides
│       │   └── instagram-templates.tsx
│       └── types.ts
└── components/
    └── admin/
        └── distribution/
            ├── DistributionList.tsx
            ├── CarouselPreview.tsx         ← Preview interactivo
            ├── SlideEditor.tsx             ← Editor inline
            ├── PlatformTabs.tsx
            └── ExportPanel.tsx             ← Descargas + copy buttons
```

---

## Base de datos — nueva tabla en Supabase

```sql
create table distributions (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null,
  post_title text not null,
  status text not null default 'draft',
    -- draft | approved | published | archived
  
  linkedin_content jsonb,
    -- { slides: [...], hashtags: [...], caption: "..." }
  linkedin_images text[],
    -- URLs de los PNG renderizados en Supabase Storage
  
  instagram_content jsonb,
    -- { slides: [...], caption: "...", hashtags: [...] }
  instagram_images text[],
  
  twitter_content jsonb,
    -- { tweets: [...] }
  
  ai_metadata jsonb,
    -- { model: "...", tokens_used: N, generated_at: "..." }
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  approved_at timestamptz,
  published_at timestamptz
);

create index idx_distributions_slug on distributions(post_slug);
create index idx_distributions_status on distributions(status);
```

---

## Fase 1 — Prompt maestro de IA

Archivo: `src/lib/distribution/ai/prompt-master.ts`

Un solo prompt que recibe el MDX completo y devuelve JSON con las tres plataformas.

```typescript
export const MASTER_PROMPT = `
Sos el editor de contenido de El Radar — un newsletter técnico escrito por 
Silvano Puccini (full stack developer con casi una década en gestión comercial 
previa). El tono es directo, sin relleno, pensado para developers con criterio 
comercial en LATAM y España.

Recibís este post en formato MDX y tenés que producir contenido optimizado 
para TRES plataformas. Respondé SOLO con JSON válido, sin texto adicional, 
sin markdown wrapping.

CRITERIOS DE SELECCIÓN (aplica a las tres plataformas):
- Priorizá el tradeoff más concreto del post
- Priorizá el momento más humano o específico
- NO elijas las primeras secciones por orden cronológico — elegí las más potentes
- Evitá frases que suenen a "manifiesto" o "motivacional"
- Frases cortas. Sin conectores de blog ("por otro lado", "en conclusión", etc.)

FORMATO DE RESPUESTA (JSON estricto):

{
  "linkedin": {
    "slides": [
      {
        "type": "hook",
        "headline": "string — máx 8 palabras, debe generar curiosidad",
        "body": "string — 2-3 líneas cortas, establece la tensión"
      },
      {
        "type": "content",
        "headline": "string — título de la idea, máx 6 palabras",
        "body": "string — 4-6 líneas cortas, una sola idea por slide, 
                 800-1200 chars total"
      },
      // ... repetir 4 slides de tipo content
      {
        "type": "cta",
        "headline": "string — resumen o pregunta final",
        "body": "string — cierre + invitación a suscribirse"
      }
    ],
    "caption": "string — 2-3 líneas de gancho para el feed, 
                antes del carousel. No repetir el headline del slide 1.",
    "hashtags": ["array de 5 hashtags relevantes, en minúscula, sin #"]
  },
  
  "instagram": {
    "slides": [
      // Misma estructura que linkedin pero más visual:
      // - headlines más cortos (máx 5 palabras)
      // - body más breve (400-600 chars)
      // - pensado para mirada rápida
    ],
    "caption": "string — 100-150 palabras, tono más conversacional que LinkedIn",
    "hashtags": ["array de 10-15 hashtags mezclando nicho y amplios"]
  },
  
  "twitter": {
    "tweets": [
      "string — tweet 1: hook fuerte, máx 240 chars, sin hashtags",
      "string — tweet 2 a 6: una idea por tweet, cada uno autónomo",
      "string — tweet final: CTA con link al post + máx 3 hashtags"
    ]
  }
}

POST:
---
{{MDX_CONTENT}}
---
`;
```

Uso desde el código:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateDistribution(mdxContent: string) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: MASTER_PROMPT.replace("{{MDX_CONTENT}}", mdxContent),
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as any).text)
    .join("");

  return JSON.parse(text);
}
```

---

## Fase 2 — Renderizador con Puppeteer

### 2.1 Setup

```bash
npm install puppeteer puppeteer-core @sparticuz/chromium
```

Archivo: `src/lib/distribution/renderer/puppeteer-setup.ts`

```typescript
import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";

export async function launchBrowser() {
  // En Vercel/producción usar @sparticuz/chromium
  // En local usar puppeteer normal
  const isProd = process.env.NODE_ENV === "production";
  
  return puppeteer.launch({
    args: isProd ? chromium.args : [],
    executablePath: isProd ? await chromium.executablePath() : undefined,
    headless: true,
  });
}
```

### 2.2 Template de slide LinkedIn

Archivo: `src/lib/distribution/renderer/linkedin-templates.tsx`

Cada slide se renderiza como HTML con mi identidad visual:

```tsx
// Pseudo-código del template — React Server Component o string template
export function renderLinkedInSlide(slide: Slide, slideNumber: number, total: number) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
        <style>
          body { 
            margin: 0; 
            width: 1080px; 
            height: 1080px; 
            background: #111118; 
            font-family: 'Space Grotesk', sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 80px;
            box-sizing: border-box;
            color: white;
          }
          .nav { 
            display: flex; 
            justify-content: space-between; 
            font-family: 'JetBrains Mono', monospace;
            font-size: 14px;
            color: rgba(255,255,255,0.4);
          }
          .logo { color: #8B5CF6; }
          .content { flex: 1; display: flex; flex-direction: column; justify-content: center; }
          .label { 
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
            color: #8B5CF6;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            margin-bottom: 24px;
          }
          .headline { 
            font-size: 56px; 
            font-weight: 600; 
            line-height: 1.15; 
            letter-spacing: -0.02em;
            margin: 0 0 32px 0;
          }
          .headline .accent { color: #8B5CF6; }
          .body { 
            font-size: 24px; 
            line-height: 1.5; 
            color: rgba(255,255,255,0.75);
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
            color: rgba(255,255,255,0.3);
          }
          .page-num { font-weight: 500; }
          .brand { color: rgba(139,92,246,0.7); }
        </style>
      </head>
      <body>
        <div class="nav">
          <div class="logo">SP developer</div>
          <div>silvano.dev</div>
        </div>
        <div class="content">
          <div class="label">${slide.type === "hook" ? "El Radar" : `Decisión ${slideNumber - 1}`}</div>
          <h1 class="headline">${slide.headline}</h1>
          <p class="body">${slide.body.replace(/\n/g, "<br>")}</p>
        </div>
        <div class="footer">
          <div class="page-num">${slideNumber} / ${total}</div>
          <div class="brand">→ deslizá</div>
        </div>
      </body>
    </html>
  `;
}
```

### 2.3 Función de render

Archivo: `src/lib/distribution/renderer/render.ts`

```typescript
import { launchBrowser } from "./puppeteer-setup";
import { renderLinkedInSlide } from "./linkedin-templates";

export async function renderCarouselImages(
  slides: Slide[],
  platform: "linkedin" | "instagram"
): Promise<Buffer[]> {
  const browser = await launchBrowser();
  const images: Buffer[] = [];
  
  try {
    for (let i = 0; i < slides.length; i++) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1080, height: 1080 });
      
      const html = platform === "linkedin"
        ? renderLinkedInSlide(slides[i], i + 1, slides.length)
        : renderInstagramSlide(slides[i], i + 1, slides.length);
      
      await page.setContent(html, { waitUntil: "networkidle0" });
      
      const screenshot = await page.screenshot({ type: "png" });
      images.push(screenshot as Buffer);
      await page.close();
    }
  } finally {
    await browser.close();
  }
  
  return images;
}
```

### 2.4 Upload a Supabase Storage

Después de renderizar, subir cada PNG a Supabase y guardar las URLs en la tabla `distributions`.

```typescript
const { data, error } = await supabase.storage
  .from("distributions")
  .upload(`${distributionId}/linkedin/slide-${i}.png`, buffer, {
    contentType: "image/png",
    upsert: true,
  });
```

---

## Fase 3 — Panel admin con UX interactiva

### 3.1 Lista de distribuciones

Ruta: `/admin/distribuciones`

Vista de todas las distribuciones generadas, con filtro por estado:

```
[Draft] [Approved] [Published] [Archived]

┌──────────────────────────────────────────────────────────────┐
│ ● Por qué armé este espacio              [draft]  hace 2h    │
│   LinkedIn 6 slides · Instagram 6 slides · Twitter 7 tweets  │
│   [Preview] [Editar] [Descargar assets]                      │
├──────────────────────────────────────────────────────────────┤
│ ✓ Cómo construí este portfolio          [approved] hace 1d   │
│   LinkedIn 6 slides · Instagram 6 slides · Twitter 6 tweets  │
│   [Preview] [Descargar assets]                               │
└──────────────────────────────────────────────────────────────┘
```

Acciones principales:
- **Generar nueva distribución** — botón que pide el slug del post.
- **Re-generar** — para distribuciones ya existentes que querés rehacer.
- **Filtros** por estado y búsqueda por título.

### 3.2 Detalle de una distribución

Ruta: `/admin/distribuciones/[id]`

Layout con tabs por plataforma:

```
┌────────────────────────────────────────────────────────────────┐
│ Por qué armé este espacio                                      │
│ Generado hace 2h · Modelo: Claude Sonnet 4 · 3,200 tokens     │
│                                                                │
│ [📱 LinkedIn] [📸 Instagram] [🐦 Twitter]        [Aprobar ✓]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   ┌─────────────────┐    Editor inline del slide activo:      │
│   │                 │    ┌───────────────────────────────┐    │
│   │   Preview       │    │ Headline:                     │    │
│   │   del carousel  │    │ [Hay decisiones que importan] │    │
│   │   con           │    │                               │    │
│   │   navegación    │    │ Body:                         │    │
│   │   ← →           │    │ [texto editable...]           │    │
│   │                 │    │                               │    │
│   │   Slide 2/6     │    │ [Guardar] [Regenerar slide]   │    │
│   └─────────────────┘    └───────────────────────────────┘    │
│                                                                │
│   Thumbnails: [1][2][3][4][5][6]                              │
│                                                                │
│ Caption del post:                                              │
│ ┌────────────────────────────────────────────┐ [Copiar]       │
│ │ Podés llenar un CV con tecnologías...      │                │
│ └────────────────────────────────────────────┘                │
│                                                                │
│ Hashtags: [Copiar]                                             │
│ #desarrollo #fullstack #criterio #latam #elradar              │
│                                                                │
│ ┌─ Descargar assets ─────────────────────────────────────────┐│
│ │ [↓ Descargar 6 PNG (ZIP)]  [↓ Descargar slide individual]  ││
│ │ [📋 Copiar caption]        [📋 Copiar hashtags]             ││
│ └────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

### 3.3 Componente CarouselPreview

Componente React con las siguientes funcionalidades:

```tsx
<CarouselPreview
  slides={slides}
  platform="linkedin"
  onSlideChange={(idx) => setActiveSlide(idx)}
  onSlideEdit={(idx, newContent) => updateSlide(idx, newContent)}
  onSlideRegenerate={(idx) => regenerateSlide(idx)}
/>
```

Features obligatorios:
- Navegación con flechas ← → y teclado.
- Thumbnails clickeables abajo.
- Zoom al hacer click (lightbox).
- Indicador de slide actual (2 / 6).
- Transición suave entre slides.
- Botón "Ver a tamaño real" (1080×1080).

### 3.4 Componente SlideEditor

Editor inline al costado del preview:

- Campos `headline` y `body` editables.
- Contador de caracteres con indicador visual (verde / amarillo / rojo según plataforma).
- Preview en vivo del slide a medida que editás.
- Botón "Regenerar este slide con IA" — llama al endpoint `/regenerate` con el contexto de los otros slides para mantener coherencia.
- Botón "Descartar cambios".

### 3.5 Flujo de generación nueva

Cuando clickeás "Generar nueva distribución":

```
1. Modal con select de posts (lee de src/content/blog/)
2. Al seleccionar → muestra preview del excerpt
3. Botón "Generar" → dispara /api/admin/distribute
4. Loading state con mensajes progresivos:
   ├─ "Analizando el post..."
   ├─ "Generando contenido para LinkedIn..."
   ├─ "Generando contenido para Instagram..."
   ├─ "Generando hilo de Twitter..."
   ├─ "Renderizando imágenes..."
   └─ "Guardando..."
5. Redirect automático a /admin/distribuciones/[id]
```

---

## Fase 4 — Mejoras al plan original

Lo siguiente es lo que agregaría al plan que venimos hablando porque mejora la robustez real del sistema:

### 4.1 Retry y fallback

Si la llamada a Claude falla o devuelve JSON inválido:
- Reintenta hasta 2 veces con backoff exponencial.
- Si falla las 3 veces, guarda el error en la distribución con status `error` y muestra el mensaje en el admin.
- Nunca deja al usuario esperando infinito.

### 4.2 Versionado de contenido

Cada vez que editás o regenerás una distribución, guardar el estado anterior en una tabla `distribution_versions`. Así podés volver a una versión previa si la última no te convence.

### 4.3 Regeneración granular

No solo "regenerar todo". También:
- Regenerar un solo slide con contexto del resto.
- Regenerar solo la caption.
- Regenerar solo los hashtags.
- Regenerar solo el hilo de Twitter.

### 4.4 Caché de imágenes

Si el contenido de un slide no cambió, no re-renderizar el PNG. Guardar un hash del contenido y compararlo antes de renderizar.

### 4.5 Preview antes de renderizar

En la vista de detalle, el usuario puede ver el HTML del slide (preview en vivo del React component) antes de que se convierta a PNG. Esto evita gastar tiempo de render si algo está mal.

### 4.6 Logs de generación

Tabla `distribution_logs` con cada paso del proceso (IA llamada, tokens gastados, tiempo de render, errores). Útil para debug y para ver cuánto cuesta cada distribución.

### 4.7 Export pack

Botón único "Descargar pack completo" que genera un ZIP con:
- Los 6 PNG de LinkedIn.
- Los 6 PNG de Instagram.
- Un `README.md` con la caption, los hashtags, el hilo de Twitter y las instrucciones de publicación.

---

## Orden de implementación

Implementar EN ESTE ORDEN. No saltear pasos.

### Paso 1 — Base de datos y tipos
1. Crear tabla `distributions` en Supabase (SQL arriba).
2. Crear tipos TypeScript en `src/lib/distribution/types.ts`.
3. Crear tabla `distribution_versions` y `distribution_logs`.

### Paso 2 — Capa de IA
1. Implementar `prompt-master.ts` con el prompt completo.
2. Crear función `generateDistribution(mdxContent)` que llama a Claude.
3. Validar que el JSON devuelto cumple el schema esperado.
4. Agregar retry + error handling.
5. Testear con el post real `por-que-arme-este-espacio.mdx`.

### Paso 3 — API Routes del orquestador
1. `POST /api/admin/distribute` — recibe `{ slug }`, ejecuta flujo, guarda en DB, devuelve `{ id }`.
2. `GET /api/admin/distributions` — lista paginada con filtros.
3. `GET /api/admin/distributions/[id]` — detalle completo.
4. `PATCH /api/admin/distributions/[id]` — actualiza contenido editado.
5. `POST /api/admin/distributions/[id]/regenerate` — regenera total o parcial.

### Paso 4 — Renderizador
1. Instalar puppeteer + configurar para local y Vercel.
2. Implementar templates de slide en HTML (LinkedIn primero, Instagram después).
3. Implementar función `renderCarouselImages(slides, platform)`.
4. Implementar upload a Supabase Storage.
5. Testear render local con un slide de prueba.

### Paso 5 — Admin UI — lista
1. Ruta `/admin/distribuciones` — tabla con filtros y búsqueda.
2. Modal de "nueva distribución" con select de posts.
3. Loading states progresivos.

### Paso 6 — Admin UI — detalle
1. Ruta `/admin/distribuciones/[id]` con tabs por plataforma.
2. Componente `CarouselPreview` con navegación.
3. Componente `SlideEditor` con edición inline.
4. Export pack (ZIP download).
5. Copy buttons para caption, hashtags, tweets.

### Paso 7 — Pulido
1. Transiciones y animaciones en el preview.
2. Loading states con skeleton.
3. Atajos de teclado en el detalle (← → para cambiar slide).
4. Mensajes de error claros.

---

## Variables de entorno nuevas

Agregar a `.env.local` y al dashboard de Vercel:

```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_STORAGE_BUCKET=distributions
DISTRIBUTION_BASE_URL=https://silvano.dev
```

Crear un bucket público `distributions` en Supabase Storage con policy de read público.

---

## Validación del sistema — checklist final

Antes de considerar el sistema terminado:

- [ ] Genero una distribución del post `manifiesto-editorial` y los 6 slides de LinkedIn son visualmente correctos con mi identidad de marca.
- [ ] Los slides de LinkedIn cumplen 1080×1080px y pesan menos de 500KB cada uno.
- [ ] El caption de LinkedIn tiene el tono correcto (cercano, directo, sin manifiesto).
- [ ] El hilo de Twitter tiene frases cortas con saltos de línea deliberados.
- [ ] Puedo editar un slide en el admin y el PNG se regenera.
- [ ] Puedo descargar un ZIP con todo el pack.
- [ ] El sistema no falla si Claude devuelve JSON malformado (muestra error en UI).
- [ ] El sistema cachea imágenes (no re-renderiza si el contenido no cambió).
- [ ] El admin muestra cuántos tokens gasté por distribución.

---

## Notas finales

- **No automatizar publicación directa a redes.** El sistema genera assets, yo publico manualmente. Reduce riesgo de errores de tono o bugs que publiquen contenido incorrecto.
- **Priorizar LinkedIn primero.** Es donde más impacto tiene la calidad visual. Instagram puede usar los mismos PNG al principio.
- **Iterar el prompt maestro.** El primer output no va a ser perfecto. Medí cuál de los tres posts salió mejor y ajustá el prompt según eso.
- **No mezclar este trabajo con features del blog.** Es un módulo independiente bajo `/admin/distribuciones` — no toca el flujo de publicación de posts existente.

---

**Fin del spec.** Pegar en Claude Code junto con el contexto del proyecto.
