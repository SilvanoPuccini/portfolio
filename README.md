# 🚀 Silvano Puccini | Portfolio

## 📚 CSS Tarea Entregable 4 | ConquerBlocks Academy

---

### 👤 Información del Estudiante

| Campo | Detalle |
|-------|---------|
| **Nombre** | Silvano Puccini |
| **Curso** | Desarrollo Web - CSS Avanzado |
| **Academia** | ConquerBlocks |
| **Fecha** | Febrero 2026 |

---

### 🌐 Demo en Vivo

🔗 **[Ver Portfolio](https://silvanopuccini.github.io/portfolio/)**

---

### 📋 Descripción del Proyecto

Portfolio personal profesional como Full Stack Developer en formación. Sitio web responsive con soporte para múltiples idiomas (EN/ES) y temas (Dark/Light).

**Características principales:**
- 🌙 Modo oscuro/claro
- 🌍 Bilingüe (Inglés/Español)
- 📱 Diseño Mobile First
- 📧 Formulario de contacto funcional (Formspree)
- ⚡ Build con Vite
- 🎨 Estilos con SASS modular

---

### 🛠️ Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| **Vite** | Build tool & dev server |
| **SASS/SCSS** | Preprocesador CSS modular |
| **JavaScript ES6+** | Interactividad, i18n, theme toggle |
| **HTML5** | Estructura semántica |
| **Formspree** | Backend para formulario de contacto |
| **Google Fonts** | Space Grotesk |

---

### 🎨 Design System

#### Colores (Dark Theme)

| Color | Hex | Uso |
|-------|-----|-----|
| Negro | `#151515` | Fondo principal |
| Verde | `#4EE1A0` | Acentos, hover |
| Gris oscuro | `#242424` | Fondos secundarios |
| Gris claro | `#D9D9D9` | Textos secundarios |
| Blanco | `#FFFFFF` | Textos principales |

#### Colores (Light Theme)

| Color | Hex | Uso |
|-------|-----|-----|
| Gris claro | `#F5F5F5` | Fondo principal |
| Blanco | `#FFFFFF` | Fondos secundarios |
| Negro | `#151515` | Textos principales |
| Gris | `#444444` | Textos secundarios |

#### Tipografía

| Elemento | Font | Tamaño | Peso |
|----------|------|--------|------|
| Heading XL | Space Grotesk | 88px | 700 |
| Heading L | Space Grotesk | 48px | 700 |
| Heading M | Space Grotesk | 24px | 700 |
| Body | Space Grotesk | 18px | 500 |

---

### 📁 Estructura del Proyecto

```
portfolio/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   ├── icons/
│   │   │   ├── rings.svg
│   │   │   ├── oval.svg
│   │   │   └── pattern-*.svg
│   │   └── images/
│   │       └── profile.png
│   ├── js/
│   │   ├── main.js
│   │   └── i18n.js
│   └── scss/
│       ├── _variables.scss
│       ├── _mixins.scss
│       ├── _base.scss
│       ├── _buttons.scss
│       ├── _header.scss
│       ├── _hero.scss
│       ├── _skills.scss
│       ├── _projects.scss
│       ├── _contact.scss
│       ├── _footer.scss
│       └── main.scss
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

### ⚙️ Funcionalidades JavaScript

#### 🌙 Theme Toggle
- Alterna entre modo oscuro y claro
- Persiste preferencia en localStorage
- Transiciones suaves

#### 🌍 Language Toggle
- Cambia entre inglés y español
- Sistema i18n personalizado
- Persiste preferencia en localStorage

#### 📧 Contact Form
- Validación en tiempo real
- Integración con Formspree
- Mensajes de error/éxito
- Estados de campos (error, focus)

#### 📊 Skills Animation
- Barras de progreso animadas
- Animación al entrar en viewport (Intersection Observer)

---

### 🚀 Instalación y Desarrollo

```bash
# Clonar repositorio
git clone https://github.com/silvanopuccini/portfolio.git

# Entrar al directorio
cd portfolio

# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

---

### 📜 Scripts Disponibles

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

### 📱 Breakpoints

| Breakpoint | Dispositivo |
|------------|-------------|
| Base | Mobile (< 768px) |
| 768px | Tablet |
| 1200px | Desktop |

---

### 📂 Secciones

1. **Header** - Logo, redes sociales, toggles de tema e idioma
2. **Hero** - Presentación, foto de perfil, CTA
3. **Skills** - Frontend, Backend, Herramientas (con barras de progreso)
4. **Projects** - Grid de proyectos con hover effects
5. **Contact** - Formulario funcional con Formspree
6. **Footer** - Logo y redes sociales

---

### 🔗 Proyectos Incluidos

| Proyecto | Tecnologías | Demo |
|----------|-------------|------|
| Modern Art Gallery | HTML, CSS, SASS | [Ver](https://silvanopuccini.github.io/modern-art-gallery/) |
| GathSession | HTML, CSS, SASS | [Ver](https://silvanopuccini.github.io/GathSession/) |
| GlowQueen SPA | HTML, CSS, JS | [Ver](https://silvanopuccini.github.io/glowqueen-spa/) |
| Payment Tracker | React, TS, Supabase | [Ver](https://payment-tracker-bot.vercel.app/) |
| FacturIA 2.0 | Python, Streamlit, AI | Próximamente |
| Cat Gallery | HTML, CSS, JS, API | [Ver](https://silvanopuccini.github.io/cat-gallery/) |

---

### 📞 Contacto

- 📧 Email: silvano.jm.puccini@gmail.com
- 💼 LinkedIn: [Silvano Puccini](https://www.linkedin.com/in/silvano-jose-maria-puccini-394992265)
- 🐙 GitHub: [@silvanopuccini](https://github.com/silvanopuccini)
- 💬 Discord: [silvanopuccini](https://discord.com/users/925401070388256778)

---

### ✅ Checklist de Entrega

- [x] Diseño fiel al Figma/PDF
- [x] Mobile First responsive
- [x] SASS modular con arquitectura limpia
- [x] JavaScript ES6+ modular
- [x] Build con Vite
- [x] Tema oscuro/claro
- [x] Multiidioma EN/ES
- [x] Formulario funcional (Formspree)
- [x] Animaciones y transiciones
- [x] Estados hover en elementos interactivos
- [x] Semántica HTML5
- [x] Accesibilidad (aria-labels, alt texts)
- [x] SEO básico (meta tags)
- [x] Deploy en GitHub Pages

---

### 📄 Licencia

Este proyecto es parte del programa educativo de **ConquerBlocks Academy** y también sirve como portfolio personal profesional.

---

<div align="center">

**Silvano Puccini** | Full Stack Developer in Training | 2026

</div>
