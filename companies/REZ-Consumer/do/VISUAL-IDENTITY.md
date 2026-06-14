# Do — Visual Identity

## Brand Overview

| Element | Value |
|---------|-------|
| **Name** | Do |
| **Tagline** | "Your AI that actually does" |
| **Category** | AI Personal Assistant |
| **Parent Brand** | ReZ |
| **Personality** | Helpful, capable, slightly playful |

---

## Logo

### Primary Logo

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│           D O                       │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Specifications:**
- Font: Custom wordmark, bold weight
- Colors: White on dark, Purple (#7C3AED) on light
- Minimum size: 32px width
- Clear space: 1x letter height on all sides

### Icon Mark

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│           [●]                       │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Specifications:**
- Single dot or "D" in circle
- Used for: App icon, favicon, tab bar
- Sizes: 1024px (App Store), 192px, 144px, 96px, 72px, 48px, 36px

---

## Color System

### Primary Palette

```css
:root {
  /* Core Purple - Action/Primary */
  --do-primary: #7C3AED;           /* Main brand color */
  --do-primary-light: #A78BFA;      /* Hover/pressed states */
  --do-primary-dark: #5B21B6;      /* Dark variant */
  --do-primary-glow: rgba(124, 58, 237, 0.3); /* Glow effect */

  /* Warm Orange - Accent */
  --do-secondary: #F97316;          /* CTAs, highlights */
  --do-secondary-light: #FB923C;    /* Hover states */

  /* Success Green */
  --do-success: #10B981;           /* Confirmations */
  --do-success-light: #34D399;      /* Light variant */

  /* Rewards Gold */
  --do-gold: #FBBF24;              /* Coins, karma */
  --do-gold-light: #FCD34D;        /* Light variant */
  --do-gold-dark: #D97706;        /* Dark variant */

  /* Neutrals - Dark Mode */
  --do-bg: #0F0F12;                /* App background */
  --do-surface: #1A1A1F;            /* Cards, elevated surfaces */
  --do-surface-elevated: #252529;   /* Modals, dropdowns */
  --do-border: #2D2D33;             /* Borders, dividers */
  --do-border-light: #3D3D44;       /* Lighter borders */

  /* Neutrals - Light Mode */
  --do-bg-light: #FFFFFF;
  --do-surface-light: #F4F4F5;
  --do-surface-elevated-light: #FFFFFF;
  --do-border-light-mode: #E4E4E7;

  /* Text */
  --do-text: #FFFFFF;               /* Primary text */
  --do-text-secondary: #A1A1AA;     /* Secondary text */
  --do-text-muted: #71717A;         /* Muted text */
  --do-text-inverse: #0F0F12;       /* Text on light backgrounds */

  /* Semantic */
  --do-error: #EF4444;
  --do-warning: #F59E0B;
  --do-info: #3B82F6;
}
```

### Color Usage

| Color | Usage |
|-------|-------|
| `--do-primary` | Primary buttons, links, active states |
| `--do-secondary` | Secondary actions, highlights |
| `--do-success` | Confirmations, success states |
| `--do-gold` | Coins, karma, rewards |
| `--do-surface` | Cards, message bubbles |
| `--do-text` | Main text content |

---

## Typography

### Font Stack

```css
/* Primary - Headings & Body */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monospace - Numbers, codes */
font-family: 'JetBrains Mono', 'SF Mono', Monaco, monospace;
```

### Type Scale

```css
/* Display */
--text-display: {
  font-size: 32px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* Heading 1 */
--text-h1: {
  font-size: 24px;
  line-height: 1.3;
  font-weight: 700;
  letter-spacing: -0.01em;
}

/* Heading 2 */
--text-h2: {
  font-size: 20px;
  line-height: 1.4;
  font-weight: 600;
}

/* Heading 3 */
--text-h3: {
  font-size: 17px;
  line-height: 1.4;
  font-weight: 600;
}

/* Body */
--text-body: {
  font-size: 16px;
  line-height: 1.5;
  font-weight: 400;
}

/* Body Small */
--text-body-sm: {
  font-size: 14px;
  line-height: 1.5;
  font-weight: 400;
}

/* Caption */
--text-caption: {
  font-size: 12px;
  line-height: 1.4;
  font-weight: 400;
}

/* Button */
--text-button: {
  font-size: 16px;
  line-height: 1;
  font-weight: 600;
}

/* Mono */
--text-mono: {
  font-size: 14px;
  line-height: 1.5;
  font-weight: 500;
}
```

### Line Heights

| Style | Line Height |
|-------|-------------|
| Display | 1.2 |
| Headings | 1.3-1.4 |
| Body | 1.5 |
| Caption | 1.4 |

---

## Spacing System

```css
/* Base unit: 4px */
--space-0: 0px;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

### Usage Guidelines

| Token | Usage |
|-------|-------|
| `space-1` to `space-2` | Icon padding, tight gaps |
| `space-3` to `space-4` | Standard padding, list gaps |
| `space-5` to `space-6` | Section padding, card padding |
| `space-8` to `space-12` | Major section breaks |
| `space-16`+ | Screen-level padding |

---

## Border Radius

```css
--radius-sm: 8px;      /* Buttons, inputs */
--radius-md: 12px;      /* Cards, modals */
--radius-lg: 16px;      /* Large cards */
--radius-xl: 24px;      /* Sheets, overlays */
--radius-full: 9999px;  /* Pills, avatars */
```

---

## Shadows

```css
--shadow-sm: {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

--shadow-md: {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

--shadow-lg: {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

--shadow-glow: {
  box-shadow: 0 0 20px rgba(124, 58, 237, 0.4);
}
```

---

## Motion & Animation

### Timing

```css
--duration-instant: 0ms;    /* Immediate feedback */
--duration-fast: 150ms;      /* Micro-interactions */
--duration-normal: 250ms;    /* Standard transitions */
--duration-slow: 400ms;      /* Major changes */
--duration-dramatic: 600ms;  /* Celebrations */
```

### Easing

```css
/* Smooth deceleration */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);

/* Bouncy entrance */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Elastic bounce */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Linear for progress */
--ease-linear: linear;
```

### Animation Patterns

| Animation | Duration | Easing | Use Case |
|-----------|----------|--------|----------|
| Fade in | 200ms | ease-out | Content appear |
| Slide up | 300ms | ease-out | Cards, modals |
| Scale bounce | 400ms | ease-spring | Coin earn, celebration |
| Pulse | 1000ms | ease-in-out | Typing indicator |
| Shake | 300ms | ease-bounce | Error, warning |

---

## Iconography

### Icon Style

- **Type**: Outlined, 2px stroke
- **Size**: 24px default, 20px compact, 32px emphasis
- **Color**: Current color (inherits text color)
- **Library**: Lucide React Native

### Core Icons

| Icon | Usage |
|------|-------|
| `MessageCircle` | Chat tab |
| `Compass` | Explore tab |
| `Coins` | Wallet tab |
| `User` | Profile tab |
| `Send` | Send message |
| `Mic` | Voice input |
| `X` | Close, cancel |
| `Check` | Confirm, done |
| `ChevronRight` | Navigate |
| `MapPin` | Location |
| `Star` | Rating, favorite |
| `Gift` | Rewards |
| `Bell` | Notifications |
| `Settings` | Settings |
| `HelpCircle` | Help |

---

## Component States

### Button States

| State | Visual |
|-------|--------|
| Default | Primary color bg |
| Hover/Press | Primary light bg, scale 0.98 |
| Disabled | 50% opacity |
| Loading | Spinner replaces text |

### Input States

| State | Visual |
|-------|--------|
| Default | Border subtle |
| Focused | Border primary, glow |
| Error | Border error, message below |
| Disabled | 50% opacity |

### Card States

| State | Visual |
|-------|--------|
| Default | Surface bg, border subtle |
| Hover | Border primary light |
| Pressed | Scale 0.98, darker bg |
| Disabled | 50% opacity |

---

## Dark Mode (Primary)

Do uses dark mode as the primary theme. Light mode is supported as an alternative.

### Dark Mode Colors

- Background: `--do-bg` (#0F0F12)
- Surface: `--do-surface` (#1A1A1F)
- Text: `--do-text` (#FFFFFF)

### Light Mode Override

```css
:root[data-theme="light"] {
  --do-bg: var(--do-bg-light);
  --do-surface: var(--do-surface-light);
  --do-surface-elevated: var(--do-surface-elevated-light);
  --do-border: var(--do-border-light-mode);
  --do-text: var(--do-text-inverse);
}
```

---

## Imagery

### Photography Style

- **Mood**: Warm, urban, lifestyle
- **Colors**: Natural, vibrant, slightly desaturated
- **Composition**: Human-focused, authentic moments
- **Treatment**: Slight vignette, warm tone

### Illustration Style

- **Style**: Flat, minimal, geometric
- **Colors**: Brand palette only
- **Details**: Simple shapes, no complex textures
- **Animations**: Subtle, purposeful

### Icon Style

- **Type**: Outline with rounded caps
- **Weight**: Light to medium
- **Consistency**: Uniform across all icons

---

## App Icon

### Design

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│           D O                       │
│                                     │
│                                     │
│                                     │
│         [Gradient glow]              │
│                                     │
└─────────────────────────────────────┘
```

**Specifications:**
- Background: Gradient from #7C3AED to #5B21B6
- Text: White "DO" centered
- Shape: Rounded rectangle (all platforms)
- Safe zones: 20px padding minimum

### Sizes Required

| Platform | Size |
|----------|------|
| iOS App Store | 1024 x 1024 |
| iOS Device | 180 x 180 (60pt @3x) |
| Android Play Store | 512 x 512 |
| Android Device | 48-192px |

---

## Splash Screen

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│                                     │
│           D O                       │
│                                     │
│                                     │
│                                     │
│                                     │
│         [Loading indicator]          │
│                                     │
└─────────────────────────────────────┘
```

**Specifications:**
- Background: #0F0F12 (dark)
- Logo: White "DO" centered
- Loading: Subtle pulsing dot below logo

---

## Release Notes

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | May 3, 2026 | Initial spec |
