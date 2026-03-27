# FoodBela — Design System

Unified design system for all 6 FoodBela apps. Ensures visual consistency across web and mobile.

---

## Brand Identity

**Brand Color:** `#ffc107` (Amber/Gold — warm, appetizing, food-centric)
**Brand Name:** FoodBela (ফুডবেলা)
**Tagline:** "Eat & Smile"
**Mascot:** Bela the Bengal Cat (customer-app only)

### Tagline Usage
- **Login/Register pages** — below the logo, `text-muted` color, `text-sm`
- **Email footers** — "FoodBela — Eat & Smile"
- **Splash/loading screens** — centered under brand name
- **About/footer sections** — web dashboard footers
- Do NOT use as a heading or hero text — keep it subtle and secondary

---

## Color Palette

### Primary Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `primary` | `#ffc107` | `#ffc107` | Brand, CTAs, active states, highlights |
| `primary-hover` | `#e6ad00` | `#ffd54f` | Hover/pressed state for primary |
| `primary-light` | `#fff8e1` | `#3d3200` | Backgrounds, badges, subtle tints |
| `primary-dark` | `#c79100` | `#ffca28` | Text on light bg, emphasis |
| `primary-foreground` | `#1a1a1a` | `#1a1a1a` | Text on primary color (always dark — amber is light) |

### Neutral Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `background` | `#ffffff` | `#0a0a0a` | Page background |
| `surface` | `#f9fafb` | `#141414` | Cards, panels, modals |
| `surface-hover` | `#f3f4f6` | `#1f1f1f` | Hover state on cards |
| `border` | `#e5e7eb` | `#2a2a2a` | Dividers, borders, outlines |
| `border-strong` | `#d1d5db` | `#404040` | Active borders, focus rings |
| `text-primary` | `#111827` | `#f9fafb` | Headings, primary text |
| `text-secondary` | `#6b7280` | `#9ca3af` | Descriptions, labels |
| `text-muted` | `#9ca3af` | `#6b7280` | Hints, placeholders, timestamps |

### Semantic Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `success` | `#22c55e` | `#4ade80` | Approved, delivered, online |
| `success-bg` | `#f0fdf4` | `#052e16` | Success badges/backgrounds |
| `warning` | `#f59e0b` | `#fbbf24` | Pending, processing, caution |
| `warning-bg` | `#fffbeb` | `#451a03` | Warning badges/backgrounds |
| `error` | `#ef4444` | `#f87171` | Failed, rejected, cancelled |
| `error-bg` | `#fef2f2` | `#450a0a` | Error badges/backgrounds |
| `info` | `#3b82f6` | `#60a5fa` | Links, informational, new features |
| `info-bg` | `#eff6ff` | `#172554` | Info badges/backgrounds |

### Order Status Colors

| Status | Color | Badge Style |
|--------|-------|-------------|
| `payment_pending` | `warning` | Yellow outline |
| `pending` | `warning` | Yellow filled |
| `confirmed` | `info` | Blue filled |
| `preparing` | `info` | Blue filled, animated |
| `ready` | `primary` | Amber filled |
| `assigned` | `info` | Blue outline |
| `picked_up` | `primary` | Amber filled, animated |
| `delivered` | `success` | Green filled |
| `cancelled` | `error` | Red filled |

---

## Typography

### Web (restaurant-web, admin-web)

```
Font family: Inter (Google Fonts) — clean, modern, great for dashboards
Fallback: system-ui, -apple-system, sans-serif

Sizes (Tailwind scale):
  xs:    12px / 0.75rem   — badges, timestamps
  sm:    14px / 0.875rem  — labels, secondary text
  base:  16px / 1rem      — body text
  lg:    18px / 1.125rem  — subheadings
  xl:    20px / 1.25rem   — section titles
  2xl:   24px / 1.5rem    — page titles
  3xl:   30px / 1.875rem  — hero/dashboard numbers

Weights:
  normal:   400  — body text
  medium:   500  — labels, table headers
  semibold: 600  — subheadings, buttons
  bold:     700  — page titles, stat numbers
```

### Mobile (customer-app, rider-app, restaurant-app)

```
Font family: System default (San Francisco on iOS, Roboto on Android)
— Expo default, no custom font loading needed

Sizes:
  caption:  12  — badges, timestamps
  body-sm:  14  — secondary text, labels
  body:     16  — body text, inputs
  subtitle: 18  — section headers
  title:    22  — screen titles
  hero:     28  — large stat numbers

Bangla text: System default renders Bangla correctly on both platforms
```

---

## Spacing & Layout

### Spacing Scale (shared)

```
1:   4px    — tight gaps (icon-text)
2:   8px    — small gaps (between badges)
3:  12px    — compact padding (badge padding)
4:  16px    — standard padding (card padding, input padding)
5:  20px    — section spacing
6:  24px    — card gaps, section padding
8:  32px    — large section spacing
10: 40px    — page margins (web)
12: 48px    — major section breaks
```

### Web Layout

```
Sidebar: 260px (expanded) / 64px (collapsed)
Header:  64px height
Content: max-width 1280px, centered with auto margins
Page padding: 24px (desktop), 16px (mobile)
Card gap: 24px (grid) / 16px (mobile)
```

### Mobile Layout

```
Safe area: expo-safe-area-context handles notches
Screen padding: 16px horizontal
Card gap: 12px
Bottom tab: 56px height (expo-router tabs)
Floating Bela: 80px from bottom-right, above tab bar
```

---

## Border Radius

```
none:  0px    — sharp edges (progress bars)
sm:    4px    — badges, tags
md:    8px    — buttons, inputs
lg:    12px   — cards, modals
xl:    16px   — large cards, panels
full:  9999px — avatar circles, pills
```

---

## Shadows (web only)

```
sm:   0 1px 2px rgba(0,0,0,0.05)               — subtle card shadow
md:   0 4px 6px -1px rgba(0,0,0,0.1)            — elevated cards
lg:   0 10px 15px -3px rgba(0,0,0,0.1)          — modals, dropdowns
xl:   0 20px 25px -5px rgba(0,0,0,0.1)          — popovers

Dark mode: same values, slightly lower opacity (0.3 → 0.2)
```

---

## Components

### Web (Tailwind + shadcn/ui)

Tech stack:
- **Tailwind CSS v4** — utility-first styling
- **shadcn/ui** — copy-paste components (NOT a dependency — components live in your codebase)
- **Lucide React** — icon library (consistent with shadcn)
- **Recharts** — charts (admin-web analytics only)

shadcn/ui components to use:
```
Layout:     Sidebar, Sheet (mobile nav)
Data:       Table, DataTable, Badge, Card
Forms:      Input, Select, Textarea, Switch, Checkbox, RadioGroup, DatePicker
Feedback:   Alert, Toast (sonner), Skeleton, Progress
Overlay:    Dialog, AlertDialog, Popover, DropdownMenu, Tooltip
Navigation: Tabs, Breadcrumb, Pagination
```

Custom components (built with Tailwind, not from shadcn):
```
StatCard       — dashboard stat number with icon + trend arrow
OrderStatusBadge — colored badge per order status
ImageUpload    — click-to-upload with preview + Cloudinary integration
EmptyState     — illustration + text + action button
```

### Mobile (React Native)

Tech stack:
- **React Native StyleSheet** — default styling (no external lib needed)
- **react-native-reanimated** — animations (already in stack for Bela)
- **expo-haptics** — tactile feedback on buttons

Shared mobile component set:
```
Button.jsx     — primary (amber), secondary (outline), destructive (red)
Input.jsx      — text input with label + error state
Loading.jsx    — spinner with optional text
EmptyState.jsx — illustration + text + action
Card.jsx       — elevated card container
Badge.jsx      — status badges with semantic colors
```

---

## Dark Mode Implementation

### Web — Tailwind dark class strategy

```
Mode: class-based (not media query) — allows user toggle
Storage: localStorage key "foodbela-theme" (values: "light" | "dark" | "system")
Default: "system" (follows OS preference)

Implementation:
- <html class="dark"> toggles dark mode
- Tailwind classes: bg-white dark:bg-neutral-950
- shadcn/ui supports dark mode natively
- ThemeProvider context wraps app
- Toggle in Header: sun/moon icon button
```

### Mobile — React Native appearance

```
Mode: useColorScheme() from react-native (follows OS)
No manual toggle in MVP (can add later)
Colors: constants/colors.js exports { light: {...}, dark: {...} }
Usage: const colors = useThemeColors() hook
```

---

## Tailwind Configuration (Web)

```js
// tailwind.config.js (shared approach for both web apps)
{
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ffc107',
          hover: '#e6ad00',
          light: '#fff8e1',
          dark: '#c79100',
          foreground: '#1a1a1a'
        },
        surface: {
          DEFAULT: '#f9fafb',  // overridden in dark mode via CSS vars
          hover: '#f3f4f6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      // shadcn/ui uses CSS variables for theming
      // These are set in globals.css
    }
  }
}
```

### CSS Variables for shadcn/ui (globals.css)

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 220 13% 11%;
    --card: 210 20% 98%;
    --card-foreground: 220 13% 11%;
    --primary: 45 100% 51%;        /* #ffc107 */
    --primary-foreground: 0 0% 10%;
    --secondary: 210 20% 96%;
    --secondary-foreground: 220 13% 11%;
    --muted: 210 20% 96%;
    --muted-foreground: 215 13% 50%;
    --accent: 210 20% 96%;
    --accent-foreground: 220 13% 11%;
    --destructive: 0 84% 60%;
    --border: 214 14% 90%;
    --input: 214 14% 90%;
    --ring: 45 100% 51%;           /* focus ring = primary */
    --radius: 0.5rem;
  }

  .dark {
    --background: 0 0% 4%;
    --foreground: 210 20% 98%;
    --card: 0 0% 8%;
    --card-foreground: 210 20% 98%;
    --primary: 45 100% 51%;        /* #ffc107 stays same */
    --primary-foreground: 0 0% 10%;
    --secondary: 0 0% 12%;
    --secondary-foreground: 210 20% 98%;
    --muted: 0 0% 12%;
    --muted-foreground: 215 13% 60%;
    --accent: 0 0% 12%;
    --accent-foreground: 210 20% 98%;
    --destructive: 0 63% 56%;
    --border: 0 0% 16%;
    --input: 0 0% 16%;
    --ring: 45 100% 51%;
  }
}
```

---

## Mobile Color Constants

```js
// constants/colors.js (all mobile apps)
export const colors = {
  light: {
    primary: '#ffc107',
    primaryHover: '#e6ad00',
    primaryLight: '#fff8e1',
    primaryDark: '#c79100',
    primaryForeground: '#1a1a1a',

    background: '#ffffff',
    surface: '#f9fafb',
    surfaceHover: '#f3f4f6',
    border: '#e5e7eb',
    borderStrong: '#d1d5db',

    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',

    success: '#22c55e',
    successBg: '#f0fdf4',
    warning: '#f59e0b',
    warningBg: '#fffbeb',
    error: '#ef4444',
    errorBg: '#fef2f2',
    info: '#3b82f6',
    infoBg: '#eff6ff',
  },
  dark: {
    primary: '#ffc107',
    primaryHover: '#ffd54f',
    primaryLight: '#3d3200',
    primaryDark: '#ffca28',
    primaryForeground: '#1a1a1a',

    background: '#0a0a0a',
    surface: '#141414',
    surfaceHover: '#1f1f1f',
    border: '#2a2a2a',
    borderStrong: '#404040',

    textPrimary: '#f9fafb',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',

    success: '#4ade80',
    successBg: '#052e16',
    warning: '#fbbf24',
    warningBg: '#451a03',
    error: '#f87171',
    errorBg: '#450a0a',
    info: '#60a5fa',
    infoBg: '#172554',
  }
}
```

---

## Bela Cat Palette (customer-app only)

These are separate from the brand palette — used only for the SVG cat mascot.

```js
// modules/bela/svg/colors.js
export const belaColors = {
  body: '#F4A460',        // warm sandy orange-brown
  stripes: '#CD853F',     // tiger stripes
  earInside: '#FFB6C1',   // light pink
  nose: '#FF69B4',        // hot pink
  eyeIris: '#2E8B57',     // sea green
  eyePupil: '#000000',
  eyeWhite: '#FFFAF0',    // floral white
  pawPads: '#FFB6C1',     // pink
  belly: '#FFDEAD',       // navajo white
  whiskers: '#2F2F2F',    // dark gray
  blush: 'rgba(255,182,193,0.4)'
}
```

---

## Icon System

### Web
- **Lucide React** — default icon set (consistent with shadcn/ui)
- Size: 16px (inline), 20px (buttons), 24px (nav items)
- Color: inherits from parent `text-*` class

### Mobile
- **@expo/vector-icons** (Ionicons subset) — default Expo icon set
- Size: 20 (tab bar), 24 (buttons), 28 (headers)
- Color: tinted from `colors.textPrimary` / `colors.primary`

---

## Responsive Breakpoints (Web)

```
sm:   640px   — mobile landscape
md:   768px   — tablet
lg:   1024px  — desktop
xl:   1280px  — wide desktop
2xl:  1536px  — ultra-wide

Dashboard sidebar:
  < md:  hidden (hamburger menu → Sheet)
  ≥ md:  visible, collapsible
```

---

## Animation Guidelines

### Web
- Transitions: `transition-all duration-200` (default Tailwind)
- Hover: subtle `scale-[1.02]` on cards, `opacity-80` on buttons
- Skeleton: pulse animation for loading states (shadcn Skeleton)
- Page transitions: none (instant — fast is better than fancy for dashboards)

### Mobile
- **react-native-reanimated** for all animations
- Spring config: `damping: 15, stiffness: 150` (bouncy but controlled)
- Layout animations: `entering={FadeInDown}` for list items
- Haptics: light impact on button press, medium on toggle, success on order placed

---

## Packages to Install (Web Apps)

### restaurant-web
```bash
npm install @tanstack/react-query zustand axios react-router-dom lucide-react sonner
npx tailwindcss init -p
npx shadcn@latest init
```

### admin-web
```bash
npm install @tanstack/react-query zustand axios react-router-dom lucide-react sonner recharts react-leaflet leaflet
npx tailwindcss init -p
npx shadcn@latest init
```

---

## File Organization for Theme

```
src/
├── lib/
│   └── utils.js           # cn() helper for Tailwind class merging (shadcn standard)
├── components/
│   └── ui/                 # shadcn components go here (auto-installed by CLI)
│       ├── button.jsx
│       ├── input.jsx
│       ├── card.jsx
│       └── ...
├── hooks/
│   └── useTheme.js         # Theme toggle hook (dark/light/system)
├── providers/
│   └── ThemeProvider.jsx    # Wraps app, manages <html class="dark">
├── styles/
│   └── globals.css          # Tailwind directives + CSS variables
└── constants/
    └── colors.js            # Optional JS exports for programmatic use
```

---

## Key Rules

1. **Brand color `#ffc107` is ALWAYS the primary** — buttons, links, highlights, active states
2. **Dark mode is class-based** on web, OS-based on mobile
3. **shadcn/ui components are copied into your codebase** — not imported from a package. This means zero bundle bloat from unused components
4. **No performance concern with shadcn** — it's just Tailwind classes + Radix primitives, tree-shakes perfectly
5. **Inter font** for web, system fonts for mobile
6. **Lucide icons** on web, Expo vector icons on mobile
7. **All colors defined as CSS variables** (web) and JS constants (mobile) — single source of truth
8. **Bangla text** renders natively — no special font needed
