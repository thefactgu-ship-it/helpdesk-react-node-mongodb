---
name: IT Help Desk System
description: A hotel operations helpdesk interface built for calm clarity and reliable workflow focus.
colors:
  primary: "#0f766e"
  primary-strong: "#0a1f23"
  accent: "#334155"
  success: "#10b981"
  warning: "#f59e0b"
  danger: "#ef4444"
  background: "#f4f7f6"
  surface: "#ffffff"
  surface-muted: "#f2f6f5"
  border: "#dbe5e2"
  border-strong: "#c7d4d1"
  text: "#0f172a"
  muted: "#64748b"
  sidebar-bg: "#0a1f23"
  sidebar-border: "#99f6e4"
  glow: "#0f766e"
typography:
  display:
    fontFamily: "Inter, Noto Sans Thai, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, Noto Sans Thai, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, Noto Sans Thai, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.08em"
rounded:
  sm: "0.5rem"
  md: "0.625rem"
  lg: "0.75rem"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "0.75rem 1rem"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "0.75rem 1rem"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "1rem"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "0.75rem 1rem"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "1.25rem"
---

# Design System: IT Help Desk System

## 1. Overview

Creative North Star: "The Operations Control Room"

This system is a hotel IT helpdesk interface that prioritizes steady visibility, clear decision points, and calm operational confidence. It uses a committed teal accent and layered off-white surfaces to keep status, assignments, and queue actions easy to scan without adding visual noise.

The UI is grounded in practical dashboard work: stable navigation, distinct surface cards, and compact but readable controls. Depth is conveyed with subtle shadows, soft borders, and restrained translucency rather than heavy glass or bold brand ornament.

Key Characteristics:
- A committed teal accent supporting a light, low-contrast neutral base.
- Measured hierarchy through strong weights, compact spacing, and clear state cues.
- Surfaces built from softly rounded cards, panels, and seamless overlays.
- A calm operational voice that avoids flashy SaaS tropes and terminal-style theatrics.

## 2. Colors

The palette is anchored by a purposeful teal accent with neutral surfaces and a strong navy grounding tone for actions. It supports a work-focused product with clear semantic status color.

### Primary
- **Teal Accent** (#0f766e): used for interactive controls, active nav, key status badges, and primary action states.
- **Deep Anchor** (#0a1f23): used for primary buttons, strong text on dark panels, and high-contrast emphasis.

### Secondary
- **Soft Accent** (#334155): used for muted labels, secondary text, and quiet supporting states where the primary teal would be too strong.

### Semantic
- **Success** (#10b981): used for resolved status, confirmation states, and success badges.
- **Warning** (#f59e0b): used for due-soon indicators, caution banners, and warning badges.
- **Danger** (#ef4444): used for errors, destructive actions, and critical status markers.

### Neutral
- **Page Background** (#f4f7f6): the main screen fill behind cards and panels.
- **Surface** (#ffffff): the primary card and panel background.
- **Muted Surface** (#f2f6f5): for soft containers, subdued panels, and form grouping.
- **Border** (#dbe5e2): for dividers, field strokes, and subtle separation.
- **Strong Border** (#c7d4d1): for more defined outlines and input focus surfaces.
- **Text** (#0f172a): the main body text color for strong legibility.
- **Muted Text** (#64748b): used for helper text, secondary labels, and low-priority copy.
- **Sidebar Background** (#0a1f23): the dark anchor for the desktop navigation rail and mobile headers.
- **Sidebar Border** (#99f6e4): the subtle highlight edge for sidebar overlays and active container edges.
- **Glow** (#0f766e): used for diffused accent highlights and hover glow effects.

### Named Rules
**The One Accent Rule.** The teal accent is the one active color in the palette; keep it focused on controls, active states, and meaningful status rather than broad surface fills.

## 3. Typography

Display Font: Inter (with Noto Sans Thai fallback)
Body Font: Inter (with Noto Sans Thai fallback)
Label Font: Inter (with Noto Sans Thai fallback)

Character: The system is direct and confident, with a bold headline voice for page titles and compact, legible body text for ticket details and form labels.

### Hierarchy
- **Display** (800, 2rem, 1.1): used for page titles and major section headers.
- **Headline** (700, 1.25rem, 1.35): used for card titles, section headings, and prominent labels.
- **Title** (600, 1rem, 1.4): used for field labels, table headings, and side labels.
- **Body** (400, 1rem, 1.6): used for paragraph copy, field text, and standard content.
- **Label** (700, 0.75rem, 1.4): used for status tags, metadata labels, and micro copy.

### Named Rules
**The Constrained Line Rule.** Body text should stay under 75ch where possible to preserve scanability in ticket details and dashboard panels.

## 4. Elevation

The design uses tonal layering and soft shadows to separate surfaces without making the interface feel heavy. Cards and panels float lightly over the page background; hover states add modest lift. Translucent overlays and backdrop blur are used sparingly to support depth in top bars and menus.

### Shadow Vocabulary
- **Soft Shadow** (`0 18px 46px rgba(6, 24, 28, 0.1)`): used for large background containers and hero surfaces.
- **Card Shadow** (`0 10px 30px rgba(6, 24, 28, 0.07)`): used for standard cards and panels.
- **Hero Shadow** (`0 14px 34px rgba(6, 24, 28, 0.22)`): used for featured banners and immersive surface treatments.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are calm and flat at rest; shadows appear only to distinguish layered panels, hovered cards, and elevated overlays.

## 5. Components

This interface is built from softly rounded, readable components with clear state changes and minimal visual clutter.

### Buttons
- **Shape:** rounded corners with a 0.75rem radius.
- **Primary:** dark anchor background, white text, strong weight, and compact horizontal padding. Used for main actions like Save, Submit, or Open Ticket.
- **Secondary:** white surface background with a soft border and dark text. Used for secondary or cancel actions.
- **Hover / Focus:** subtle color darkening or tint shift, with visible focus ring and preserved contrast.

### Chips
- **Style:** rounded-full pill shapes with a light neutral fill or a stronger soft accent fill for active states.
- **State:** primary chips are denser and darker for selected filters; neutral chips remain muted in supporting roles.

### Cards / Containers
- **Corner Style:** softly rounded at 0.75rem.
- **Background:** primarily white on light mode, with a translucent dark panel for sidebar and hero contexts.
- **Shadow Strategy:** card shadows are soft and diffuse; more assertive shadows are reserved for hero banners and elevated panels.
- **Border:** subtle lines or glassy edges separate card surfaces.
- **Internal Padding:** comfortable spacing, typically 1rem for cards and 1.25rem for larger panels.

### Inputs / Fields
- **Style:** full-width fields with a soft neutral border, white fill, and rounded corners.
- **Focus:** border darkens slightly and the field remains crisp; placeholder text is legible and not too light.
- **Error / Disabled:** error states use the danger color clearly; disabled states lower opacity and remove hover interactions.

### Navigation
- **Style:** the desktop sidebar is a dark teal anchor with pale icon labels and active states that use a bright teal highlight.
- **Mobile treatment:** a sticky dark mobile header and bottom nav provide focused access to primary routes.
- **Active state:** the active item uses a soft fill, border, and elevated shadow to stand out from idle items.

## 6. Do's and Don'ts

### Do:
- **Do** keep the first-level UI framed by calm off-white surfaces with the teal accent reserved for actionable items.
- **Do** use 0.75rem corner radii on cards, panels, buttons, and form fields for a cohesive feel.
- **Do** preserve the single neutral font family across display, body, and label text to keep the interface consistent.
- **Do** use subtle glass and blur only for overlay surfaces like the top bar, menu panels, and the mobile header.
- **Do** keep body copy under 75ch and use strong weight contrast for headings.

### Don't:
- **Don't** use heavy gradient text, side-stripe borders, or decorative gradients on headlines.
- **Don't** drift toward dark terminal or gamified interfaces; the product should feel grounded and operational.
- **Don't** apply glassmorphism as a default visual style; use translucency sparingly and with purpose.
- **Don't** make neutral text too gray or low contrast; body copy should remain at least 4.5:1 on the page background.
- **Don't** use a border-left accent stripe as the primary visual cue on cards or list rows; use full surface color, badge labels, or icon indicators instead.
