# IT Help Desk Design System

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** IT Help Desk Multi-Hotel Support
**Category:** Enterprise Dashboard / Operations Control Center

---

## Global Direction

- Use a deep violet operations shell with near-white glass content surfaces.
- Keep dashboards dense enough for scanning, but leave consistent breathing room between panels.
- Prefer calm realtime cues: status color, count updates, and subtle transitions. Do not use animated glow, pulsing borders, or flashing KPI cards.
- Use Lucide icons for actions and status markers. Icons must sit centered inside fixed-size icon containers.
- Keep cards at `0.5rem` to `0.75rem` radius. Avoid oversized rounded blobs.

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary / Brand | `#6D28D9` | `--ops-primary` |
| Primary Dark | `#4C1D95` | `--ops-primary-strong` |
| Accent | `#7C3AED` | `--ops-accent` |
| Sidebar Background | `#1D0A34` | `--ops-sidebar-bg` |
| Sidebar Border | `#2D1C45` | `--ops-sidebar-border` |
| Light Background | `#F6F3FB` | `--ops-bg` |
| Glass Surface | `rgba(255,255,255,0.92)` | `--ops-glass` |
| Strong Glass Surface | `rgba(255,255,255,0.96)` | `--ops-glass-strong` |
| Border | `#E7DFF2` | `--ops-border` |
| Text | `#0F172A` | `--ops-text` |
| Text Muted | `#64748B` | `--ops-muted` |
| Success | `#10B981` | `--ops-success` |
| Warning | `#F59E0B` | `--ops-warning` |
| Danger | `#EF4444` | `--ops-danger` |

### Typography
- **Heading Font:** Inter / Outfit
- **Body Font:** Noto Sans Thai / Inter
- **Mood:** Clean, Professional, Trustworthy, Modern

---

## Component Rules

### Surfaces
- Use `.ops-panel` for page sections, management blocks, report panels, and form containers.
- Use `.ops-card` for repeated items and compact content cards.
- Use `.ops-soft-kpi` for KPI cards. Do not pair it with pulse/glow animation classes.
- Use `.ops-empty-state` for empty/loading-friendly states that need framed space.

### Controls
- Use `.ops-button-primary` for main submit/create actions.
- Use `.ops-button-secondary` for filters, pagination, exports, and secondary commands.
- Use `.ops-input` for inputs, selects, and textareas unless a shared UI component wraps it.
- Use `.ops-chip-primary` for primary context chips and `.ops-chip` for neutral chips.

### Status Color
- Purple: primary workflow, active navigation, selected filters.
- Amber: warning, due soon, medium risk.
- Rose: destructive, critical, overdue, delete.
- Emerald: healthy, active, resolved, success.

### Motion
- Allowed: color/background/shadow transitions around 150-200ms.
- Avoid: animated light trails, pulsing card borders, flashing badges, or constant dashboard motion.

### Interaction States
- Icon-only action buttons should use `.ops-icon-button` for centered icons, hover, active, focus, and disabled states.
- Dropdown/action menus should use `.ops-menu-panel`, `.ops-menu-item`, and `.ops-menu-item-danger`.
- Loading cards should use `.ops-skeleton-card` and `.ops-skeleton-line` so skeletons match the glass theme.
- Disabled states must preserve layout, reduce opacity, and remove hover affordance.
- Destructive actions use rose styling consistently, including hover and disabled states.

---

## Pre-Delivery Checklist
- [ ] No emojis used as icons (use Lucide SVG icons instead)
- [ ] Clickable cards and options clearly show cursor/hover affordance
- [ ] Transitions are smooth (150-200ms)
- [ ] Contrast ratios respect a11y guidelines (minimum 4.5:1 for light/dark text)
- [ ] KPI cards do not use animated glow or border pulse
- [ ] No blue/indigo legacy visual tokens remain in JSX/CSS unless they are data labels, not styling
