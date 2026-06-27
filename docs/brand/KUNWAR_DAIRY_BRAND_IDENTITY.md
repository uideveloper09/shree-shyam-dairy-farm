# Kunwar Dairy — Brand Identity System

**Version:** 1.0  
**Date:** June 2025  
**Prepared for:** Shree Shyam Dairy Farm (legal entity)  
**Customer brand:** Kunwar Dairy  
**Platform:** Next.js 16 · Dairy ERP · E-commerce · Subscriptions

---

## Document index

| Document                                                         | Purpose                                                                             |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| This file                                                        | Brand identity, logo concepts, voice, marketing, guidelines                         |
| [KUNWAR_DAIRY_DESIGN_SYSTEM.md](./KUNWAR_DAIRY_DESIGN_SYSTEM.md) | UI tokens, Tailwind/CSS/Figma token spec (reference only — not implemented in code) |

---

# 1. Brand Identity

## Brand name

| Layer               | Name                   | Usage                                            |
| ------------------- | ---------------------- | ------------------------------------------------ |
| **Customer brand**  | **Kunwar Dairy**       | Website, app, packaging, ads, checkout, social   |
| **Legal / company** | Shree Shyam Dairy Farm | Invoice footer, GST, contracts, bank, compliance |
| **Short name**      | Kunwar                 | PWA, notifications, app icon label, SMS          |
| **Monogram**        | KD                     | Favicon, stamp, embroidery, small surfaces       |

**Pronunciation:** KUN-waar (Hindi: कुंवर — noble, princely; evokes trust and heritage without royalty cliché)

---

## Brand story

Kunwar Dairy was born on the fields of Bihar — where mornings begin with mist over green fodder, the sound of milking pails, and families who measure quality by taste, not labels.

We are not a middleman brand. We are the farm, the herd, the chillers, and the delivery route — connected by one promise: **what leaves our gate is what reaches your glass.**

_Kunwar_ speaks to dignity and care — for our cows, our land, and every household we serve. _Dairy_ keeps us honest: we do one thing, and we do it with mastery.

**Legal note (small print only):** Kunwar Dairy is operated by Shree Shyam Dairy Farm.

**One-line story:**  
_From our farm in Bihar to your family's table — Kunwar Dairy delivers purity you can taste every morning._

---

## Brand personality

| Trait           | Expression                                            | Avoid                                         |
| --------------- | ----------------------------------------------------- | --------------------------------------------- |
| **Trustworthy** | Clear pricing, farm traceability, consistent delivery | Hype, exaggerated “100%” claims without proof |
| **Warm**        | Hindi-English mix, family-centric copy                | Cold corporate jargon                         |
| **Premium**     | Refined visuals, generous whitespace                  | Cheap discount aesthetics                     |
| **Grounded**    | Real farm photography, local pride                    | Stock-photo “fake farm” imagery               |
| **Modern**      | Clean app, subscriptions, digital receipts            | Outdated cluttered layouts                    |
| **Caring**      | Vet care, hygiene, customer support tone              | Purely transactional messaging                |

**Brand archetype blend:** _Caregiver_ (70%) + _Ruler_ (30%) — nurtures families while standing for standards and reliability.

---

## Mission

To deliver farm-fresh, hygienically processed dairy products directly to households and businesses — eliminating unnecessary intermediaries while honoring the land, the animals, and the customer.

---

## Vision

To become Bihar’s most trusted dairy name — and a model farm-to-home brand that rural families and urban professionals choose with equal confidence.

---

## Brand values

1. **Purity (Shuddhata)** — No compromise on sourcing, chilling, or handling.
2. **Freshness (Taazgi)** — Daily production rhythm; cold chain discipline.
3. **Transparency (Imandaari)** — Clear origin, pricing, and subscription terms.
4. **Care (Dekhbhaal)** — Animal welfare, staff dignity, customer respect.
5. **Community (Samuday)** — Local employment, local delivery, local pride.
6. **Consistency (Bharosemandi)** — Same taste, same time, every day.

---

## Tone of voice

| Context          | Tone                             | Example                                                  |
| ---------------- | -------------------------------- | -------------------------------------------------------- |
| Homepage         | Warm, confident, aspirational    | “Discover milk that still remembers the farm.”           |
| Product pages    | Factual + sensory                | “Cow milk, chilled within 2 hours of milking.”           |
| App / SMS        | Short, clear, bilingual-friendly | “Aaj subah 6 baje delivery — Kunwar Dairy”               |
| Errors / support | Calm, accountable                | “Delivery delay ho gaya. Hum abhi update kar rahe hain.” |
| Legal / invoice  | Formal, precise                  | “Shree Shyam Dairy Farm · GSTIN …”                       |

**Voice principles:**

- Prefer **you/your family** over “consumers”
- Use **Hindi-English naturally** — not forced Hinglish
- **Lead with benefit**, prove with farm detail
- Never fear mentioning the farm; never hide the legal entity on formal docs

---

# 2. Logo Concepts

Three directions for design exploration. Final vector files: AI/EPS/SVG + PNG @1x–4x.

---

## Concept 1 — Minimal Modern

**Description:** Wordmark _KUNWAR_ (Marcellus or similar serif) over _DAIRY_ (clean sans). Optional single-line milk-drop dot on the “i” or as a period after DAIRY. No literal cow illustration.

```
   KUNWAR
   ──◆──
   DAIRY
```

**Why it works:**

- Scales from favicon wordmark to billboard
- Feels **urban-premium** — suits app, website, and metro subscriptions
- Pairs with existing navy + gold UI without visual clutter
- Easy to animate (line draw, drop settle) for digital loading states

**Best for:** Website header, app splash, investor decks, metro marketing

---

## Concept 2 — Farm + Cow + Milk

**Description:** Circular or shield emblem: stylized cow silhouette + horizon line (fields) + rising sun or leaf. Wordmark beside or below. Milk stream abstracted as 2–3 curves, never photographic.

**Why it works:**

- **Instant category recognition** for rural and semi-urban audiences
- Builds **heritage trust** — “yeh gaon ka doodh hai”
- Strong on **packaging, delivery van, milk pouch**
- Differentiates from generic minimalist D2C brands

**Best for:** Milk packets, bottle labels, vehicle livery, village retail POS

**Caution:** Keep illustration **geometric and minimal** — avoid clip-art cow.

---

## Concept 3 — Premium Monogram (KD)

**Description:** Interlocked or stacked **K** and **D** inside a rounded square or circle. Gold-on-navy or navy-on-cream. Full wordmark appears beside monogram on large formats only.

**Why it works:**

- **Maximum legibility at 16px** — favicon, app icon, WhatsApp DP
- Signals **premium dairy** (monogram = established house)
- Works on **embroidery** (caps, staff shirts) and **metal crate stamps**
- Flexible for sub-brands later (KD Ghee, KD Paneer) without new logos

**Best for:** App icon, favicon, social avatar, uniform crest, invoice stamp

---

## Recommended system

Use **Concept 3 (monogram)** as primary icon + **Concept 1 (wordmark)** as primary lockup. Reserve **Concept 2** for print/packaging and rural touchpoints.

---

# 3. Color Palette

Premium dairy palette: **deep trust navy**, **warm cream**, **harvest gold** — evoking morning light on fields and brass milk cans.

| Role               | Name          | HEX                   | Usage                                    |
| ------------------ | ------------- | --------------------- | ---------------------------------------- |
| **Primary**        | Kunwar Navy   | `#082F63`             | Navbar, headings, primary buttons, trust |
| **Primary hover**  | Deep Farm     | `#061E3D`             | Footer, pressed states                   |
| **Secondary**      | Cream Morning | `#F8F6F1`             | Page background, warmth                  |
| **Accent**         | Harvest Gold  | `#C89B3C`             | CTAs, highlights, taglines, badges       |
| **Accent soft**    | Wheat Glow    | `#E8D5A8`             | Hover fills, subtle emphasis             |
| **Background**     | Pure White    | `#FFFFFF`             | Cards, modals                            |
| **Surface**        | Soft Ivory    | `#FAF9F6`             | Sections, alternate rows                 |
| **Border**         | Warm Stone    | `#E8E4DC`             | Inputs, dividers                         |
| **Text primary**   | Charcoal Ink  | `#1A1A1A`             | Body on light                            |
| **Text secondary** | Slate Milk    | `#555555`             | Supporting copy                          |
| **Text on dark**   | White / 90%   | `#FFFFFF` · `#E5E7EB` | Footer, hero overlay                     |
| **Success**        | Fresh Meadow  | `#059669`             | Order confirmed, paid                    |
| **Warning**        | Morning Amber | `#D97706`             | Low stock, pending                       |
| **Error**          | Barn Red      | `#DC2626`             | Errors, failed payment                   |

**Gradient (hero / marketing only):** `#082F63` → `#0B3D7A` with cream overlay — never on body text blocks.

---

# 4. Typography

All via Google Fonts (already partially in stack — align to this system).

| Role                        | Font                                                  | Weight  | Size scale | Notes                                           |
| --------------------------- | ----------------------------------------------------- | ------- | ---------- | ----------------------------------------------- |
| **Heading (H1–H2)**         | **Playfair Display**                                  | 600–700 | 32–72px    | Premium editorial; product heroes               |
| **Subheading (H3–H4)**      | **Playfair Display** or **Poppins**                   | 600     | 20–28px    | Section titles                                  |
| **Logo wordmark**           | **Marcellus**                                         | 400     | —          | KUNWAR line                                     |
| **Logo subtitle / tagline** | **Cormorant Garamond** or **Great Vibes** (sparingly) | 500     | —          | Hindi tagline, signature moments                |
| **Body**                    | **Poppins**                                           | 400–500 | 14–16px    | UI, forms, paragraphs                           |
| **Buttons**                 | **Poppins**                                           | 600     | 14–16px    | Sentence case or Title Case — pick one globally |
| **Numbers / data**          | **Poppins** tabular                                   | 500     | —          | Invoices, dashboards                            |

**Line height:** Body 1.6–1.8 · Headings 1.1–1.25  
**Letter-spacing:** Logo uppercase +3–8% · Labels uppercase +12–22%

---

# 5. Icon Style

| Style       | Verdict                                                             |
| ----------- | ------------------------------------------------------------------- |
| **Rounded** | ✓ Primary — friendly, approachable, mobile-first                    |
| **Outline** | ✓ Secondary — nav, settings, account (Lucide-style, 1.5–2px stroke) |
| **Filled**  | △ Sparingly — active tab, success states only                       |

**Recommendation:** **Rounded outline** as default (Lucide / Phosphor Rounded). Use **filled gold circle** for primary actions (cart, order). Avoid sharp 90° icon corners — they clash with dairy warmth.

**Custom icon set (future):** Milk drop, cow head (abstract), leaf, sun, delivery scooter, subscription calendar — all **24px grid, 2px stroke, round caps**.

---

# 6. Logo Usage Rules

## Light background (cream / white)

- Full lockup: navy wordmark + gold rule/gem
- Minimum clear space: **1× height of “K”** on all sides
- Do not recolor wordmark to gold-only (insufficient contrast)

## Dark background (navy footer / photos)

- Wordmark: **white** primary, **gold** accent line
- Monogram: gold on navy or white on navy circle
- Add subtle shadow only on photo overlays — not on flat navy

## Website

- Header: compact lockup left; max height **46–56px**
- Footer: compact or monogram + “Kunwar Dairy” text
- Favicon: KD monogram only

## Mobile app

- App icon: Concept 3 on navy field, no thin lines < 2px
- Splash: monogram center, wordmark below, cream background

## Invoice

- Top left: full lockup or monogram + “Kunwar Dairy”
- Footer legal: **Shree Shyam Dairy Farm** · GST · address · CIN if applicable

## Packaging (milk pouch / bottle)

- Front: Concept 2 emblem + “Kunwar Dairy” large
- Back: nutrition, FSSAI, farm address (legal entity)
- Gold foil optional on ghee/premium SKU only

## Delivery vehicle

- Side panel: Concept 2 + tagline + phone + **kunwardairy.com**
- Rear: monogram + phone (legibility at distance)

## Milk bottle

- Wrap label: cream field, navy type, gold band cap seal
- Emboss monogram on premium glass line

## Social media

- Profile: KD monogram on navy
- Cover: farm photo + 40% navy gradient + wordmark left
- Never stretch, rotate, or add drop-shadow glow

---

# 7. Favicon Concepts

| Asset               | Concept                                                                      |
| ------------------- | ---------------------------------------------------------------------------- |
| **32×32**           | Bold **KD** letters, navy `#082F63` on cream `#F8F6F1`, 2px internal padding |
| **64×64**           | KD + tiny milk drop above D ascender                                         |
| **SVG**             | Single-color path monogram; scalable for header                              |
| **PWA 512**         | Monogram centered on navy circle, 12% safe zone                              |
| **Apple Touch 180** | Same as PWA with subtle cream outer ring for iOS mask                        |

**Alternative:** Minimal milk drop silhouette in gold on navy (only if KD tests poorly at 16px).

---

# 8. App Branding

| Element            | Specification                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------- |
| **App name**       | Kunwar Dairy                                                                                 |
| **Short name**     | Kunwar                                                                                       |
| **Splash screen**  | Cream `#F8F6F1` → subtle top-to-bottom fade; KD monogram fade-in 400ms; wordmark 200ms after |
| **Loading screen** | Navy progress bar `#082F63` → gold tip `#C89B3C` (matches current PageLoader direction)      |
| **App icon**       | Navy field · gold KD · optional 1px cream inner border                                       |

**Notification title default:** “Kunwar Dairy”  
**Push icon:** Monogram on cream circle

---

# 9. UI Theme (summary)

Full token tables: see [KUNWAR_DAIRY_DESIGN_SYSTEM.md](./KUNWAR_DAIRY_DESIGN_SYSTEM.md).

**Principles:**

- **Border radius:** 12px inputs · 16–20px cards · full pill for tags
- **Shadow:** soft navy-tint `0 12px 40px rgba(8,47,99,0.08)` — never harsh black
- **Buttons:** Gold primary CTA · Navy secondary · Outline for tertiary
- **Cards:** White on cream, 1px `#E8E4DC` border
- **Navbar:** White sticky, subtle border-bottom
- **Footer:** `#082F63` with gold accents (current pattern — on-brand)

---

# 10. Marketing Assets

| Asset                | Format                        | Key content                                             |
| -------------------- | ----------------------------- | ------------------------------------------------------- |
| **Business card**    | 90×50mm                       | Monogram front; name, role, phone, kunwardairy.com back |
| **Letterhead**       | A4                            | Logo top-left; legal footer Shree Shyam Dairy Farm      |
| **Invoice**          | A4 PDF                        | Kunwar Dairy header; legal entity + GST footer          |
| **Delivery bag**     | Insulated silver + navy print | KD + phone + “Farm Fresh”                               |
| **Milk packet**      | 500ml / 1L                    | Concept 2; green freshness strip; FSSAI                 |
| **Bottle label**     | 200ml–1L                      | Cream label, navy type, gold cap band                   |
| **Vehicle branding** | Eicher/Tata Ace               | Side 60% panel; Concept 2 + tagline                     |
| **Staff T-shirt**    | Navy polo                     | Gold KD left chest; “Kunwar Dairy” back                 |
| **Cap**              | Navy                          | Gold embroidered KD                                     |
| **ID card**          | CR80                          | Photo, name, role, QR to verify staff                   |
| **WhatsApp DP**      | 500×500                       | KD monogram navy circle                                 |
| **Facebook cover**   | 820×312                       | Farm dawn photo + wordmark + tagline                    |
| **LinkedIn banner**  | 1584×396                      | Professional farm + “Farm to home dairy”                |
| **YouTube banner**   | 2560×1440                     | Safe zone center: logo + subscribe CTA                  |

**Photography direction:** Golden hour, real cows, real staff, steam on milk, morning delivery — **never** sterile lab milk.

---

# 11. Taglines (30)

### English-forward

1. Farm Fresh Every Morning
2. Pure Milk. Pure Trust.
3. From Our Farm to Your Family.
4. Freshness You Can Trust.
5. The Taste of Morning.
6. Delivered Before the Day Begins.
7. Where Purity Meets Tradition.
8. Your Daily Dose of Trust.
9. Milk Worth Waking Up For.
10. Honest Dairy. Honest Price.

### Hindi-English (market fit)

11. Shuddh Doodh, Seedha Aapke Ghar Tak
12. Gaon Ki Taazgi, Sheher Tak
13. Har Subah, Farm Fresh
14. Vishwas Jo Chakh Kar Dikhe
15. Kunwar Dairy — Parivar Ka Bharosa
16. Doodh Jo Gaon Jaisa Ho
17. Taazgi Ka Waada, Roz Subah
18. Hamare Farm Se, Aapke Glass Tak
19. Sada Fresh, Sada Shuddh
20. Subah Ki Pehli Kiran, Pehla Glass

### Premium / subscription

21. Subscribe to Freshness
22. Daily Milk. Zero Worry.
23. The Premium Morning Ritual
24. Crafted by Farm, Cherished at Home
25. Bihar’s Morning Tradition, Delivered
26. Cold Chain. Warm Service.
27. Nutrition Without Compromise
28. One Farm. One Promise.
29. Kunwar Dairy — Noble by Nature
30. Rise with Kunwar

**Primary tagline (recommended):** _Shuddh Doodh, Seedha Aapke Ghar Tak_  
**Secondary (English):** _Farm Fresh Every Morning_

---

# 12. Brand Guidelines

## Logo — Do's

- Use approved lockups only
- Maintain clear space
- Use SVG on web
- Place legal name on formal documents only

## Logo — Don'ts

- No stretch, skew, or rotation
- No drop shadows on flat applications
- No rainbow gradients on wordmark
- No cow clip-art from stock sites
- Do not use “SSD” or old Shree Shyam wordmark on customer materials

## Spacing

- Logo clear space = **1× cap height**
- Section padding: **60–90px** desktop · **40–60px** mobile
- Card padding: **24px**

## Colors

- Navy + gold + cream only on customer UI
- Max **2 accent colors** per layout
- WCAG AA minimum for body text

## Photography

- Real farm, real people, natural light
- Warm color grade; avoid blue clinical look
- Show hygiene without hospital aesthetic

## Illustration

- Flat geometric, 2–3 colors max
- Use for icons and empty states — not hero replacement

## Buttons

- Primary: gold bg, navy text, 44px min height
- Secondary: navy bg, white text
- Disabled: 40% opacity — never remove focus ring

## Shadows

- Elevation 1: `0 4px 28px rgba(8,47,99,0.10)`
- Elevation 2: `0 12px 40px rgba(8,47,99,0.08)`
- No pure `#000` shadows

## Animation

- Duration 200–400ms ease-out
- Milk drop: subtle bounce once on success
- Respect `prefers-reduced-motion`

---

# 13. Deliverables Checklist

| Deliverable                 | Status       | Location                                      |
| --------------------------- | ------------ | --------------------------------------------- |
| Brand Identity Document     | ✅           | This file                                     |
| Design System Specification | ✅           | `KUNWAR_DAIRY_DESIGN_SYSTEM.md`               |
| Logo Concepts (3)           | ✅           | Section 2 — vectors pending design production |
| UI Theme tokens             | ✅           | Design system doc                             |
| Tailwind color tokens       | ✅ Spec only | Not implemented in code                       |
| CSS variables               | ✅ Spec only | Not implemented in code                       |
| Figma design tokens         | ✅ Spec only | Import table in design system doc             |

**Next steps (design production — outside code):**

1. Designer produces KD monogram + lockups in Figma
2. Export favicon set + PWA icons
3. Print packaging mockups (Concept 2)
4. Photography shoot brief on farm
5. Implement tokens in codebase (future sprint — not this deliverable)

---

_Kunwar Dairy · Operated by Shree Shyam Dairy Farm · kunwardairy.com_
