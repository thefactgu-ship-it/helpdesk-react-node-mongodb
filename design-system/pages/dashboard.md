# Dashboard Page Design System

> **LOGIC:** This page overrides global design system variables to provide page-specific dashboard component aesthetics.

## Dashboard Layout Specs

### 1. Charcoal Teal Hero Banner
- **Background:** Charcoal teal shell gradient from `#06181C` through `#0A1F23` to `#0F766E`.
- **Text:** White (`text-white`) with high contrast. Secondary text/subtitle in soft teal-white (`text-teal-50/90`).
- **Action Buttons:**
  - Primary button: use `.ops-hero-primary`.
  - Secondary buttons: use `.ops-hero-secondary`.

### 2. KPI Cards
- **Structure:** 5 columns on desktop.
- **Visuals:** Top-border colored border accent, 4px thick.
  - Card 1: Charcoal/slate (`#334155`)
  - Card 2: Orange/Yellow (`#F59E0B`)
  - Card 3: Red (`#EF4444`)
  - Card 4: Pink (`#EC4899`)
  - Card 5: Teal/Green (`#10B981`)
- **Icon Containers:** Top-right pastel background with matching colored icon.
- **Motion:** No animated border glow or light trail. Hover may lift shadow subtly only.

### 3. Hotel cards (Right Column)
- **Visuals:** Clean spacing, thin bottom accent line for active status.
- **Metric styling:** Custom colors for metrics to represent operational urgencies.
  - Urgent: Red text
  - Unassigned: Orange/Yellow text
  - Overdue: Slate/charcoal text, rose when urgent
