# Design System Strategy: The Atmospheric Sommelier

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Connoisseur."** 

Unlike generic e-commerce platforms or SaaS dashboards that prioritize utility over emotion, this system treats digital real estate like a high-end editorial spread in a physical magazine. We are building a "collectible" experience. The goal is to move away from rigid, boxy layouts toward an intentional, asymmetric composition that feels curated rather than generated. 

We break the "template" look by utilizing wide margins, overlapping image elements that break container boundaries, and a "tonal layering" approach that replaces harsh structural lines with soft, atmospheric transitions.

---

## 2. Colors: Tonal Depth & Warmth
The palette is rooted in the organic hues of aged spirits and fine paper. We avoid "flat" aesthetics by using the surface tiers to create a sense of physical thickness and weight.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Traditional borders create a "grid-trap" that feels cheap and clinical. Instead:
- Define boundaries through background shifts (e.g., a `surface-container-low` card resting on a `surface` background).
- Use the **Spacing Scale** (specifically `spacing-8` or `spacing-10`) to create "rivers" of negative space that act as natural dividers.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, fine-milled paper sheets.
- **Base Layer:** `surface` (#fdf9f0) for the primary canvas.
- **Secondary Sections:** `surface-container-low` (#f7f3ea) for subtle content grouping.
- **Featured Elements:** `surface-container-highest` (#e6e2d9) for high-contrast callouts.
- **Floating Cards:** Use `surface-container-lowest` (#ffffff) to create a "pop" of bright white, suggesting a clean label on a dark bottle.

### The "Glass & Gradient" Rule
To evoke the translucency of a crystal decanter, the header and primary navigation must utilize **Glassmorphism**.
- **Header:** Use `surface` with 80% opacity and a `backdrop-filter: blur(20px)`.
- **Primary CTAs:** Instead of flat fills, apply a subtle linear gradient from `primary` (#8b4a2c) to `primary_container` (#a96242) at a 135-degree angle to simulate the "glow" of amber liquid.

---

## 3. Typography: The Editorial Voice
We use a high-contrast pairing to balance heritage with technical precision.

*   **Display & Headlines (Newsreader):** This is our "Editorial" voice. Use `display-lg` for hero sections and `headline-md` for product categories. The serif reflects the history and craftsmanship of the distillery.
*   **Metadata & UI (Manrope):** This is our "Functional" voice. Use `label-md` for price data, ABV percentages, and comparison tables. It ensures high legibility even at small sizes (`0.75rem`) when information density is high.
*   **Hierarchy Note:** To create a signature look, use `display-sm` Newsreader for product names, but pair it immediately with a `label-sm` Manrope sub-header in `on_surface_variant` (#524439) for a "cataloging" feel.

---

## 4. Elevation & Depth
Depth is achieved through light and tone, not shadows alone.

### The Layering Principle
Avoid the "Z-index 1" shadow cliché. Instead, stack tiers:
- Place a `surface-container-lowest` card on top of a `surface-container-low` background. The slight shift from `#f7f3ea` to `#ffffff` creates a sophisticated, natural lift.

### Ambient Shadows
When a floating effect is required (e.g., for a premium bottle detail modal):
- **Shadow Token:** Use `on-surface` (#1c1c17) at 5% opacity.
- **Specs:** Blur: 40px, Spread: -5px, Y-offset: 15px. This mimics soft, ambient room light rather than a harsh overhead flash.

### The "Ghost Border" Fallback
If accessibility requires a container edge:
- Use `outline-variant` (#d8c3b4) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Primary Buttons
- **Style:** `surface-tint` (#8e4d2f) fill with `on_primary` (#ffffff) text.
- **Rounding:** `md` (0.375rem) to maintain a classic, slightly sharp tailored look.
- **Detail:** Add a 1px inner "glow" on the top edge using a lighter amber to simulate light hitting the shoulder of a bottle.

### Product Comparison Cards
- **Construction:** Use `surface-container-low` (#f7f3ea) without a border. 
- **Typography:** Use `title-md` for the spirit name and `label-md` for the "Lowest Price" badge.
- **Constraint:** Forbid the use of divider lines. Separate the "Price History" from "Store Details" using a vertical `spacing-4` gap.

### Price Tags (Chips)
- **Style:** Small, high-contrast elements using `secondary_container` (#fed65b) to draw the eye to the best deal. 
- **Rounding:** `full` (9999px) to distinguish them as interactive, clickable filters.

### Input Fields
- **Style:** Underline-only or subtle `surface-variant` fills. Avoid the "boxed-in" input field look.
- **State:** On focus, the underline transitions from `outline` to `primary`.

### Navigation Header
- **Style:** Refined Glassmorphism.
- **Interaction:** As the user scrolls, the background opacity should shift from 0% to 80%, revealing the `surface` tint and a soft "paper texture" overlay (2% opacity noise).

---

## 6. Do's and Don'ts

### Do:
- **Use Intentional Asymmetry:** Align text to the left but allow product images to break the right margin or overlap into the next section.
- **Embrace Information Density:** Users of this platform are researchers. Give them the data (ABV, Region, Cask Type) using `body-sm`, but wrap it in generous `surface` margins so it feels breathable.
- **Use Tonal Hover States:** When hovering over a list item, shift the background from `surface` to `surface-container-low` rather than adding a border.

### Don't:
- **Don't use pure black:** Use `on_surface` (#1c1c17) for text to keep the "atmospheric" warmth.
- **Don't use standard icons:** Avoid generic, thin-line "SaaS" icons. Use solid-fill, slightly organic icons that feel like stamps or wax seals.
- **Don't use "Dark Mode" as a default:** This system is built for the "Warm Ivory" experience. If a dark mode is requested later, it must be "Deep Charcoal & Copper," never "Pure Black & Neon."
- **Don't use dividers:** If you feel the urge to add a `<hr>` line, increase the `spacing` token by one level instead.