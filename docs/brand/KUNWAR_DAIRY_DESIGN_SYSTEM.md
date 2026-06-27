# Kunwar Dairy — Design System Specification

**Version:** 1.0  
**Status:** Reference specification — **not implemented in application code**  
**Companion:** [KUNWAR_DAIRY_BRAND_IDENTITY.md](./KUNWAR_DAIRY_BRAND_IDENTITY.md)

This document defines UI tokens for engineering handoff. Values align with the live product direction (navy `#082F63`, gold `#C89B3C`, cream `#F8F6F1`).

---

## 1. Color tokens

### 1.1 Semantic palette

| Token                        | HEX       | RGB           | Usage                                 |
| ---------------------------- | --------- | ------------- | ------------------------------------- |
| `color.primary`              | `#082F63` | 8, 47, 99     | Brand navy, headings, primary dark UI |
| `color.primary.hover`        | `#0B3D7A` | 11, 61, 122   | Hover on navy surfaces                |
| `color.primary.foreground`   | `#FFFFFF` | 255, 255, 255 | Text on primary                       |
| `color.secondary`            | `#F8F6F1` | 248, 246, 241 | Page background                       |
| `color.secondary.foreground` | `#1A1A1A` | 26, 26, 26    | Text on secondary                     |
| `color.accent`               | `#C89B3C` | 200, 155, 60  | CTA, highlights                       |
| `color.accent.hover`         | `#B08830` | 176, 136, 48  | CTA hover                             |
| `color.accent.foreground`    | `#082F63` | 8, 47, 99     | Text on gold buttons                  |
| `color.background`           | `#FFFFFF` | 255, 255, 255 | Cards, modals                         |
| `color.foreground`           | `#1A1A1A` | 26, 26, 26    | Default text                          |
| `color.muted`                | `#555555` | 85, 85, 85    | Secondary text                        |
| `color.muted.background`     | `#FAF9F6` | 250, 249, 246 | Alternate sections                    |
| `color.border`               | `#E8E4DC` | 232, 228, 220 | Borders, dividers                     |
| `color.ring`                 | `#C89B3C` | 200, 155, 60  | Focus ring                            |
| `color.success`              | `#059669` | 5, 150, 105   | Success states                        |
| `color.success.foreground`   | `#FFFFFF` | 255, 255, 255 |                                       |
| `color.warning`              | `#D97706` | 217, 119, 6   | Warnings                              |
| `color.warning.foreground`   | `#FFFFFF` | 255, 255, 255 |                                       |
| `color.error`                | `#DC2626` | 220, 38, 38   | Errors                                |
| `color.error.foreground`     | `#FFFFFF` | 255, 255, 255 |                                       |
| `color.footer`               | `#061E3D` | 6, 30, 61     | Footer bar                            |
| `color.footer.foreground`    | `#FFFFFF` | 255, 255, 255 | Footer text @ 55–90% opacity          |

---

## 2. CSS custom properties (reference)

Copy into `:root` when implementing — **do not apply until approved**.

```css
:root {
  /* Brand */
  --kd-navy: #082f63;
  --kd-navy-deep: #061e3d;
  --kd-navy-hover: #0b3d7a;
  --kd-gold: #c89b3c;
  --kd-gold-hover: #b08830;
  --kd-gold-soft: #e8d5a8;
  --kd-cream: #f8f6f1;
  --kd-ivory: #faf9f6;
  --kd-border: #e8e4dc;

  /* Semantic */
  --kd-background: #ffffff;
  --kd-foreground: #1a1a1a;
  --kd-muted: #555555;
  --kd-primary: var(--kd-navy);
  --kd-primary-foreground: #ffffff;
  --kd-secondary: var(--kd-cream);
  --kd-secondary-foreground: var(--kd-foreground);
  --kd-accent: var(--kd-gold);
  --kd-accent-foreground: var(--kd-navy);

  /* Status */
  --kd-success: #059669;
  --kd-warning: #d97706;
  --kd-error: #dc2626;

  /* Typography */
  --font-heading: "Playfair Display", Georgia, serif;
  --font-body: "Poppins", system-ui, sans-serif;
  --font-logo: "Marcellus", Georgia, serif;
  --font-tagline: "Cormorant Garamond", Georgia, serif;

  /* Radius */
  --kd-radius-sm: 8px;
  --kd-radius-md: 12px;
  --kd-radius-lg: 16px;
  --kd-radius-xl: 20px;
  --kd-radius-full: 9999px;

  /* Shadow */
  --kd-shadow-sm: 0 4px 28px rgba(8, 47, 99, 0.1);
  --kd-shadow-md: 0 12px 40px rgba(8, 47, 99, 0.08);
  --kd-shadow-lg: 0 20px 50px rgba(8, 47, 99, 0.12);

  /* Spacing scale (4px base) */
  --kd-space-1: 4px;
  --kd-space-2: 8px;
  --kd-space-3: 12px;
  --kd-space-4: 16px;
  --kd-space-5: 20px;
  --kd-space-6: 24px;
  --kd-space-8: 32px;
  --kd-space-10: 40px;
  --kd-space-12: 48px;
  --kd-space-16: 64px;
  --kd-space-20: 80px;

  /* Motion */
  --kd-duration-fast: 150ms;
  --kd-duration-normal: 250ms;
  --kd-duration-slow: 400ms;
  --kd-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
}
```

---

## 3. Tailwind theme extension (reference)

Add to `tailwind.config` when implementing:

```js
// REFERENCE ONLY — not merged into project yet
const kunwarDairyTheme = {
  colors: {
    navy: {
      DEFAULT: "#082F63",
      deep: "#061E3D",
      hover: "#0B3D7A",
    },
    gold: {
      DEFAULT: "#C89B3C",
      hover: "#B08830",
      soft: "#E8D5A8",
    },
    cream: {
      DEFAULT: "#F8F6F1",
      ivory: "#FAF9F6",
    },
    stone: {
      border: "#E8E4DC",
    },
    kd: {
      primary: "#082F63",
      "primary-foreground": "#FFFFFF",
      secondary: "#F8F6F1",
      "secondary-foreground": "#1A1A1A",
      accent: "#C89B3C",
      "accent-foreground": "#082F63",
      background: "#FFFFFF",
      foreground: "#1A1A1A",
      muted: "#555555",
      border: "#E8E4DC",
      success: "#059669",
      warning: "#D97706",
      error: "#DC2626",
    },
  },
  fontFamily: {
    heading: ["var(--font-heading)", "Georgia", "serif"],
    body: ["var(--font-body)", "system-ui", "sans-serif"],
    logo: ["var(--font-logo)", "Georgia", "serif"],
    tagline: ["var(--font-tagline)", "Georgia", "serif"],
  },
  borderRadius: {
    kd: "12px",
    "kd-lg": "16px",
    "kd-xl": "20px",
  },
  boxShadow: {
    kd: "0 12px 40px rgba(8, 47, 99, 0.08)",
    "kd-sm": "0 4px 28px rgba(8, 47, 99, 0.10)",
    "kd-lg": "0 20px 50px rgba(8, 47, 99, 0.12)",
  },
};
```

---

## 4. Figma design tokens

Import as **Figma Variables** (collections):

### Collection: `Kunwar/Color`

| Variable      | Value   | Mode: Light |
| ------------- | ------- | ----------- |
| primary       | #082F63 | ✓           |
| primary-hover | #0B3D7A | ✓           |
| on-primary    | #FFFFFF | ✓           |
| secondary     | #F8F6F1 | ✓           |
| on-secondary  | #1A1A1A | ✓           |
| accent        | #C89B3C | ✓           |
| on-accent     | #082F63 | ✓           |
| background    | #FFFFFF | ✓           |
| surface       | #FAF9F6 | ✓           |
| on-background | #1A1A1A | ✓           |
| muted         | #555555 | ✓           |
| border        | #E8E4DC | ✓           |
| success       | #059669 | ✓           |
| warning       | #D97706 | ✓           |
| error         | #DC2626 | ✓           |
| footer        | #061E3D | ✓           |

### Collection: `Kunwar/Radius`

| Variable | Value |
| -------- | ----- |
| sm       | 8     |
| md       | 12    |
| lg       | 16    |
| xl       | 20    |
| full     | 9999  |

### Collection: `Kunwar/Spacing`

4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80 (px)

### Collection: `Kunwar/Typography`

| Style        | Font               | Size  | Weight | Line height |
| ------------ | ------------------ | ----- | ------ | ----------- |
| display/h1   | Playfair Display   | 48–72 | 700    | 1.1         |
| heading/h2   | Playfair Display   | 32–42 | 600    | 1.2         |
| heading/h3   | Poppins            | 24–28 | 600    | 1.25        |
| body/lg      | Poppins            | 16    | 400    | 1.8         |
| body/md      | Poppins            | 14    | 400    | 1.6         |
| label        | Poppins            | 12    | 600    | 1.4         |
| button       | Poppins            | 14–16 | 600    | 1           |
| logo/primary | Marcellus          | 20    | 400    | 1.05        |
| logo/tagline | Cormorant Garamond | 13    | 500    | 1.4         |

---

## 5. Component specifications

### 5.1 Buttons

| Variant              | Background        | Text      | Border        | Height | Radius |
| -------------------- | ----------------- | --------- | ------------- | ------ | ------ |
| **Primary (gold)**   | `#C89B3C`         | `#082F63` | none          | 44px   | 12px   |
| **Primary hover**    | `#B08830`         | `#082F63` | none          | —      | —      |
| **Secondary (navy)** | `#082F63`         | `#FFFFFF` | none          | 44px   | 12px   |
| **Outline**          | transparent       | `#082F63` | 1px `#E8E4DC` | 44px   | 12px   |
| **Ghost**            | transparent       | `#082F63` | none          | 44px   | 12px   |
| **Disabled**         | any @ 40% opacity | —         | —             | —      | —      |

**Focus:** 2px ring `#C89B3C`, offset 2px

### 5.2 Cards

| Property   | Value                         |
| ---------- | ----------------------------- |
| Background | `#FFFFFF`                     |
| Border     | 1px `#E8E4DC`                 |
| Radius     | 16–20px                       |
| Padding    | 24px                          |
| Shadow     | `shadow-kd` on hover optional |

### 5.3 Inputs

| Property     | Value                   |
| ------------ | ----------------------- |
| Height       | 44px                    |
| Background   | `#FFFFFF`               |
| Border       | 1px `#E8E4DC`           |
| Radius       | 12px                    |
| Focus border | `#C89B3C` @ 50% opacity |
| Focus ring   | 2px `#C89B3C` @ 20%     |
| Placeholder  | `#555555` @ 60%         |
| Error border | `#DC2626`               |

### 5.4 Navbar

| Property        | Value               |
| --------------- | ------------------- |
| Height          | 64–72px             |
| Background      | `#FFFFFF`           |
| Border bottom   | 1px `#E8E4DC`       |
| Sticky          | yes                 |
| Logo max height | 46–56px             |
| Link color      | `#082F63`           |
| Link hover      | `#C89B3C`           |
| CTA             | gold primary button |

### 5.5 Footer

| Property   | Value                              |
| ---------- | ---------------------------------- |
| Background | `#082F63`                          |
| Bottom bar | `#061E3D`                          |
| Text       | white @ 55–90%                     |
| Accents    | `#C89B3C`                          |
| Legal line | Shree Shyam Dairy Farm @ 40% white |

---

## 6. Logo asset specification

| Asset                   | Dimensions | Format | Notes               |
| ----------------------- | ---------- | ------ | ------------------- |
| `logo-lockup-light.svg` | vector     | SVG    | Navy on cream/white |
| `logo-lockup-dark.svg`  | vector     | SVG    | White on navy       |
| `logo-monogram.svg`     | vector     | SVG    | KD only             |
| `favicon-32.png`        | 32×32      | PNG    | KD bold             |
| `favicon-64.png`        | 64×64      | PNG    | KD + drop optional  |
| `apple-touch-icon.png`  | 180×180    | PNG    | PWA / iOS           |
| `icon-512.png`          | 512×512    | PNG    | Android / manifest  |
| `og-image.jpg`          | 1200×630   | JPG    | Social share        |

**Clear space:** 1× cap height of “K” minimum on all sides.

---

## 7. Spacing & layout grid

| Breakpoint | Container max | Horizontal padding |
| ---------- | ------------- | ------------------ |
| sm         | 640px         | 16px               |
| md         | 768px         | 24px               |
| lg         | 1024px        | 32px               |
| xl         | 1280px        | 32px               |
| 2xl        | 1440px        | 40px               |

**Section vertical rhythm:** 60px mobile · 90px desktop

---

## 8. Icon system

| Property      | Value                   |
| ------------- | ----------------------- |
| Library       | Lucide (rounded stroke) |
| Default size  | 20–24px                 |
| Stroke        | 1.5–2px                 |
| Color default | `#082F63`               |
| Color muted   | `#555555`               |
| Color on dark | `#FFFFFF` or `#C89B3C`  |

---

## 9. Animation tokens

| Token                | Value                        |
| -------------------- | ---------------------------- |
| `motion.fast`        | 150ms ease-out               |
| `motion.normal`      | 250ms ease-out               |
| `motion.slow`        | 400ms ease-out               |
| `motion.page-loader` | navy → gold gradient bar     |
| `motion.splash`      | monogram fade + scale 0.95→1 |

Respect `prefers-reduced-motion: reduce`.

---

## 10. Implementation handoff checklist

When engineering implements (future sprint):

- [ ] Merge CSS variables into `globals.css`
- [ ] Extend Tailwind config with `kd.*` colors
- [ ] Replace hardcoded hex in components with tokens
- [ ] Export Figma → SVG logo assets to `/public/brand/`
- [ ] Update `manifest.json` icons to KD monogram
- [ ] Add `metadata.openGraph.images` with branded OG template
- [ ] Invoice PDF template with dual branding (Kunwar + legal footer)

---

_Specification only. No application code modified in this deliverable._
