# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** IT Help Desk Multi-Hotel Support
**Category:** Enterprise Dashboard / Operations Control Center

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary / Brand | `#6D28D9` | `--ops-primary` |
| Primary Dark | `#4C1D95` | `--ops-primary-strong` |
| Accent | `#7C3AED` | `--ops-accent` |
| Sidebar Background | `#1D0A34` | `--ops-sidebar-bg` |
| Sidebar Border | `#2D1C45` | `--ops-sidebar-border` |
| Light Background | `#F8FAFC` | `--ops-bg` |
| Dark Background | `#090514` | `--ops-bg-dark` |
| Text | `#0F172A` | `--ops-text` |
| Text Muted | `#64748B` | `--ops-muted` |

### Typography
- **Heading Font:** Inter / Outfit
- **Body Font:** Noto Sans Thai / Inter
- **Mood:** Clean, Professional, Trustworthy, Modern

---

## Component Specs

### Buttons
```css
/* Primary Button */
.ops-button-primary {
  background: var(--ops-primary);
  color: white;
  transition: all 150ms ease;
}
.ops-button-primary:hover {
  background: var(--ops-primary-strong);
}
```

### Cards
```css
.ops-soft-kpi {
  background: white;
  border: 1px solid var(--ops-border);
  box-shadow: var(--ops-shadow-card);
  transition: all 200ms ease;
}
.ops-soft-kpi:hover {
  box-shadow: var(--ops-shadow-soft);
}
```

---

## Pre-Delivery Checklist
- [ ] No emojis used as icons (use Lucide SVG icons instead)
- [ ] `cursor-pointer` on all clickable cards and options
- [ ] Transitions are smooth (150-200ms)
- [ ] Contrast ratios respect a11y guidelines (minimum 4.5:1 for light/dark text)
