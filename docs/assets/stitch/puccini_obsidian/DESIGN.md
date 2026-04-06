# Design System Document: Tech Premium Editorial

## 1. Overview & Creative North Star
**Creative North Star: "The Architectural Curator"**

This design system is built to elevate Silvano Puccini’s portfolio from a standard "tech resume" to a high-end digital gallery. We move away from the rigid, boxy layouts of common frameworks and instead embrace **Architectural Minimalism**. 

The goal is to convey technical mastery through intentional "negative space," asymmetric balance, and a sophisticated layering of dark surfaces. We avoid "flashy" animations in favor of high-inertia transitions (fades and subtle translates) that feel purposeful and heavy. The system communicates that Silvano is not just a developer, but a curator of clean, scalable, and premium digital experiences.

---

### 2. Colors & Surface Philosophy

This palette is rooted in deep obsidian tones, utilizing the Cyan and Blue tokens to provide "digital luminescence" rather than flat decoration.

*   **The "No-Line" Rule:** Standard 1px solid borders are strictly prohibited for sectioning. Structural boundaries must be created through background color shifts. For instance, a `surface-container-low` section should transition into a `surface` background without a stroke.
*   **Surface Hierarchy & Nesting:** We treat the UI as a series of physical layers. 
    *   **Level 0 (Foundation):** `surface-dim` (#0d1322) for the primary background.
    *   **Level 1 (Sections):** `surface-container-low` (#151b2b) for large content blocks.
    *   **Level 2 (Objects):** `surface-container` (#191f2f) for primary cards or modular elements.
*   **The "Glass & Gradient" Rule:** Floating elements (Modals, Navigation Bars) must utilize Glassmorphism. Use `surface-container-highest` at 60% opacity with a `24px` backdrop-blur. 
*   **Signature Textures:** For primary CTAs or high-impact Hero sections, use a subtle radial gradient: `primary` (#8aebff) transitioning to `secondary_container` (#0566d9) at a 45-degree angle. This adds "soul" and depth to the tech-heavy interface.

---

### 3. Typography: The Editorial Scale

Typography is our primary tool for hierarchy. By pairing the technical, geometric **Space Grotesk** with the neutral, legible **Inter**, we create a "Technical Editorial" feel.

*   **Display & Headlines (Space Grotesk):** Use these for high-level concepts and section titles. The wide apertures of Space Grotesk feel modern and engineering-focused. Use `display-lg` for hero statements with a `-0.02em` letter-spacing to give it a "tight," custom-designed look.
*   **Body & Titles (Inter):** Use for all long-form content. Inter provides the "Trustworthy" anchor to the more eccentric headings. Maintain a line-height of `1.6` for `body-lg` to ensure maximum breathability.
*   **Technical Details (JetBrains Mono):** Reserved strictly for code snippets, metadata, or small technical labels (e.g., "v1.0.4"). This should always be set in `label-sm` or `body-sm`.

---

### 4. Elevation & Depth

We achieve depth through **Tonal Layering** rather than traditional drop shadows.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a soft, natural "recessed" or "lifted" look based on the tonal value.
*   **Ambient Shadows:** If an element must float (e.g., a hover state on a project card), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(8, 14, 29, 0.4)`. The shadow color is a darker tint of the background, not pure black.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use the `outline-variant` token at 15% opacity. Never use 100% opaque strokes.
*   **Glassmorphism Depth:** To make the layout feel integrated, navigation menus should use `surface-variant` at 40% opacity with a `12px` blur, allowing the primary/secondary accent glows to bleed through from behind.

---

### 5. Components

#### Buttons
*   **Primary:** Solid `primary_container` (#22d3ee) with `on_primary_container` text. Use `xl` (0.75rem) roundedness. Apply a subtle 10px outer glow of the same color on hover.
*   **Secondary:** `surface-container-high` background with a `ghost border` (15% opacity `outline-variant`). 
*   **Tertiary:** Pure text using `primary` color with a 2px underline offset by 4px.

#### Cards & Project Blocks
*   **Strict Rule:** No dividers. Use `2rem` (32px) of vertical white space to separate content. 
*   **Interactions:** On hover, a card should translate -4px on the Y-axis and shift its background from `surface-container` to `surface-container-high`.

#### Chips (Tech Stack Tags)
*   **Style:** Minimalist. Use `surface-container-highest` background with `on_surface_variant` text. Roundedness should be `full`.

#### Input Fields
*   **Default State:** `surface-container-lowest` background, no border, `sm` roundedness.
*   **Focus State:** A 1px "Ghost Border" using `primary` at 40% opacity.

#### Technical Metadata (New Component)
*   For portfolio pieces, use a "Spec Sheet" component: A vertical list using `JetBrains Mono` at `label-sm` size, using `secondary_text` (#94A3B8) for keys and `primary` (#22D3EE) for values.

---

### 6. Do's and Don'ts

#### Do
*   **Do** use intentional asymmetry. Align a heading to the left but push the body text to a 60% width column on the right.
*   **Do** use `Accent` (#F59E0B) sparingly—only for critical alerts or a single "Available for Work" dot.
*   **Do** use fade-in animations with a `translateY(20px)` start point for all section entrances.

#### Don't
*   **Don't** use pure black (#000000). Always use the `surface` or `background` tokens to maintain the "premium dark" depth.
*   **Don't** use "Gamer" aesthetics like heavy neon glows or high-contrast saturated gradients. Keep glows diffused and low-opacity.
*   **Don't** use standard 12-column grids for everything. Allow images to "bleed" off the edge of the grid to create a high-end editorial feel.
*   **Don't** use icons for everything. Often, a well-typeset label in `JetBrains Mono` is more professional than a generic icon.