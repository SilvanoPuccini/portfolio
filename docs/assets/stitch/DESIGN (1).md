# Design System Strategy: The Architectural Curator

## 1. Overview & Creative North Star
The North Star of this design system is **"The Architectural Curator."** We are not building interfaces; we are designing digital environments that prioritize structural integrity, spatial rhythm, and editorial clarity. 

This system moves away from the "generic SaaS" aesthetic by embracing intentional asymmetry and tonal depth. By utilizing a deep, professional blue and a sharp, electric cyan against a monolithic dark background, we create a high-contrast experience that feels both authoritative and visionary. The goal is to make the user feel as though they are navigating a high-end architectural portfolio or a curated museum gallery—where the space *between* the content is as important as the content itself.

---

## 2. Color & Atmospheric Theory
The color palette is rooted in a "Deep Space" hierarchy, utilizing high-end blue tones to establish professional trust, while cyan serves as a precision tool for interaction.

### The Palette
*   **Primary (`#3B82F6`):** The Professional Anchor. Used for high-level brand moments and core interaction states. 
*   **Secondary (`#22D3EE`):** The Precision Tool. Used for accents, progress indicators, and "active" focal points.
*   **Background (`#0d1322`):** A deep, midnight obsidian that provides the canvas for light and depth.

### The "No-Line" Rule
**Traditional 1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined solely through background color shifts or tonal transitions.
*   Use `surface-container-low` for large section blocks.
*   Use `surface-container-highest` for interactive elements like cards.
*   Let the transition from `#0d1322` to `#191f2f` create the structural edge.

### The "Glass & Gradient" Rule
To avoid a flat, "out-of-the-box" appearance:
*   **Signature Textures:** Use subtle linear gradients for primary CTAs (e.g., `primary` to `primary_container`).
*   **Frosted Glass:** For floating elements (drawers, navigation bars), use `surface_container` with a `backdrop-blur` of 12px–20px and 80% opacity. This allows the architectural background to bleed through, creating a sense of physical permanence.

---

## 3. Typography: Editorial Authority
We utilize **Space Grotesk** across the entire system. Its geometric terminals and idiosyncratic "g" and "a" provide a tech-forward, bespoke character that standard sans-serifs lack.

*   **Display (L/M/S):** Large, dramatic scales (up to 3.5rem) used for hero moments. Use tight letter-spacing (-0.02em) to create a dense, "header" feel.
*   **Headline & Title:** Used to define the architectural hierarchy. Bold weights should be used sparingly to maintain an elegant, editorial tone.
*   **Body:** Optimized for legibility. Use `body-lg` (1rem) for primary reading and `body-md` (0.875rem) for secondary metadata.
*   **Labels:** Small, all-caps treatments with generous letter-spacing (+0.05em) for a technical, curated aesthetic.

---

## 4. Elevation & Depth: Tonal Layering
In this system, depth is a product of light and layering, not artificial drop shadows.

### The Layering Principle
Hierarchy is achieved by "stacking" the surface-container tiers. 
1.  **Level 0 (Base):** `surface` (#0d1322)
2.  **Level 1 (Sections):** `surface_container_low` (#151b2b)
3.  **Level 2 (Cards/Interaction):** `surface_container_highest` (#2f3445)

### Ambient Shadows
If an element must "float" (e.g., a Modal):
*   **Shadow:** Large blur (32px–64px), low opacity (6%).
*   **Tint:** The shadow color must be a dark blue tint derived from `on_primary_fixed_variant` rather than a neutral black.

### The "Ghost Border" Fallback
If accessibility requires a border, use a **Ghost Border**: `outline_variant` at 15% opacity. It should feel like a suggestion of an edge, not a hard cage.

---

## 5. Components: Structural Primitives

### Buttons
*   **Primary:** A gradient-filled container (`primary` to `primary_container`) with `on_primary` text. No border.
*   **Secondary:** A "Ghost" style. Transparent background with a `secondary` Ghost Border (20% opacity) and `secondary` text.
*   **Rounding:** Follow the `md` scale (0.375rem) for a crisp, professional corner.

### Cards & Lists
*   **Forbidden:** Divider lines between list items.
*   **Required:** Use 24px–32px of vertical white space (Spacing Scale) to separate content blocks.
*   **Interaction:** On hover, a card should shift from `surface_container_high` to `surface_container_highest` with a subtle `secondary` glow (2px outer blur).

### Input Fields
*   **Base:** `surface_container_low`.
*   **Active State:** Transition the "Ghost Border" to 100% opacity `secondary` (`#22D3EE`).
*   **Typography:** Labels use `label-md` in `on_surface_variant`.

### Floating Curator Bar (New Component)
A bottom-centered navigation or action pill. Use Glassmorphism (`surface_bright` at 70% opacity + 20px blur) with `secondary` icons. This reinforces the "Architectural Curator" identity by freeing the UI from the top-heavy header tradition.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use intentional asymmetry. Align a headline to the far left and the body text to a 60% offset grid to create visual interest.
*   **DO** use `secondary` (`#22D3EE`) for micro-interactions (loaders, toggle switches, active pips).
*   **DO** embrace "Negative Space." If a layout feels crowded, remove a container rather than adding a border.

### Don’t
*   **DON'T** use pure black or pure white. Use the provided `surface` and `on_surface` tokens to maintain the obsidian atmosphere.
*   **DON'T** use standard Material shadows. They are too "heavy" for this professional, architectural aesthetic.
*   **DON'T** use 1px dividers. If you need to separate content, use a 4px `surface_container_lowest` horizontal bar as a "structural gap."