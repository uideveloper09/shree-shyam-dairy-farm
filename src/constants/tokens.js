/**
 * SHREE SHYAM DAIRY FARM — Design System Tokens
 * ------------------------------------------------
 * Reverse-engineered from the full-page mockup.
 * All values map directly to Tailwind utility classes.
 *
 * COLOR PALETTE
 * ─────────────
 * Navy (Primary)   #082F63   bg-[#082F63]  text-[#082F63]
 * Gold  (Accent)   #C89B3C   text-[#C89B3C]
 * White            #FFFFFF
 * Body text        #1A1A1A
 * Muted text       #6B7280   text-gray-500
 * Section bg (alt) #F3F4F6   bg-[#f3f4f6]
 * Card bg          #FFFFFF   bg-white
 * Footer dark      #061E3D   bg-[#061e3d]
 * Icon green       #3D8B40   text-[#3d8b40]
 * Icon circle bg   #ECECEC   bg-[#ececec]
 *
 * TYPOGRAPHY
 * ──────────
 * Headings  : Playfair Display (serif)  — font-heading
 * Body/UI   : Poppins (sans-serif)      — font-body (default body)
 *
 * Font size hierarchy (px → Tailwind)
 *   Section label   : 11px  text-[11px]  uppercase tracking-[0.2em]
 *   Body small      : 13px  text-[13px]
 *   Body default    : 14px  text-sm
 *   Body medium     : 15px  text-[15px]
 *   Body large      : 16px  text-base
 *   Card title      : 17px  text-[17px]
 *   Nav links       : 11px  text-[11px]  uppercase tracking-[0.12em]
 *   Topbar          : 12px  text-xs
 *   H2 section      : 38px  text-[2.375rem]
 *   H1 hero         : 56px  text-[3.5rem] → xl:text-[3.75rem]
 *   CTA heading     : 26px  text-[1.625rem]
 *   Footer h4       : 13px  text-[13px]  uppercase tracking-wide
 *
 * SPACING SCALE (4px base unit)
 * ──────────────────────────────
 *   4px   p-1  / gap-1
 *   8px   p-2  / gap-2
 *  12px   p-3  / gap-3
 *  16px   p-4  / gap-4
 *  20px   p-5  / gap-5
 *  24px   p-6  / gap-6
 *  32px   p-8  / gap-8
 *  40px   p-10 / gap-10
 *  48px   p-12 / gap-12
 *  64px   p-16 / gap-16
 *  80px   py-20
 *  96px   py-24
 *
 * CONTAINER
 * ──────────
 *   max-w-7xl (1280px) mx-auto px-4 sm:px-6 lg:px-8
 *
 * SECTION VERTICAL RHYTHM
 * ────────────────────────
 *   TopBar              : py-2        (8px top/bottom)
 *   Navbar              : h-[76px] lg:h-[90px]
 *   Hero                : min-h-[560px] lg:min-h-[680px]
 *   Features bar        : negative overlap -mt-[52px] lg:-mt-[60px]
 *   About               : pt-28 lg:pt-32  pb-20 lg:pb-24   (top accounts for feature overlap)
 *   Products            : py-20 lg:py-24
 *   Why Choose Us       : py-20 lg:py-24
 *   CTA                 : py-10 sm:py-12  (compact banner)
 *   Footer              : pt-16 lg:pt-20  pb-0
 *   Copyright bar       : py-4
 *
 * GRID SYSTEM
 * ───────────
 *   About               : lg:grid-cols-2    gap-12 lg:gap-20
 *   Products            : grid-cols-2 lg:grid-cols-5   gap-4 lg:gap-5
 *   Why Choose Us       : lg:grid-cols-[2fr_3fr]   gap-10 lg:gap-14
 *   Why features        : grid-cols-2 lg:grid-cols-4   gap-5 mt-8
 *   Features bar        : grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
 *   Footer              : sm:grid-cols-2 lg:grid-cols-4   gap-10 lg:gap-12
 *
 * CARD DESIGN
 * ───────────
 *   Background    : bg-white
 *   Border radius : rounded-2xl  (16px)
 *   Shadow        : shadow-[0_2px_16px_rgba(0,0,0,0.07)]
 *   Image area    : flush top — no inner margin/padding
 *   Image height  : h-40 sm:h-44 lg:h-48
 *   Content pad   : px-4 pb-5 pt-4
 *
 * BUTTON
 * ──────
 *   Primary   : bg-[#082F63] text-white px-6 py-3 rounded-md text-[11px] uppercase tracking-wider
 *   White CTA : bg-white text-[#082F63] px-7 py-3 rounded-md text-[11px] uppercase tracking-wider
 *   Hover     : hover:bg-[#0a3a7a] / hover:bg-gray-100
 *   Arrow     : FaArrowRight size=9 gap-2
 *
 * BORDER RADIUS
 * ─────────────
 *   Button      : rounded-md    (6px)
 *   Card        : rounded-2xl   (16px)
 *   Image box   : rounded-2xl   (16px)
 *   Feature bar : rounded-xl    (12px)
 *   CTA banner  : rounded-xl    (12px) inside container
 *   Logo circle : rounded-full
 *   Icon circle : rounded-full
 *
 * NAVBAR
 * ──────
 *   Height        : h-[76px] desktop lg:h-[90px]
 *   Logo img      : h-[52px] w-[52px] lg:h-14 lg:w-14
 *   Logo text     : text-[10px] lg:text-[11px] uppercase tracking-[0.06em]
 *   Logo tagline  : text-[9px] lg:text-[10px] text-[#C89B3C]
 *   Nav links     : text-[11px] font-semibold uppercase tracking-[0.12em]
 *   Active line   : w-5 h-[2px] bg-[#C89B3C] centered under link
 *   CTA button    : px-6 py-2.5 text-[11px]
 *
 * TOPBAR
 * ──────
 *   Height   : py-2 (auto)
 *   Text     : text-xs (12px)
 *   Icons    : size-11 (11px)
 *   Social   : h-7 w-7 rounded-full border border-white/25
 *
 * HERO
 * ────
 *   Min height   : min-h-[560px] lg:min-h-[680px]
 *   H1 size      : text-[2.25rem] sm:text-5xl lg:text-[3.5rem] xl:text-[3.75rem]
 *   H1 weight    : font-bold
 *   H1 leading   : leading-[1.08]
 *   Subtitle     : text-sm sm:text-base text-gray-600 max-w-md
 *   Button mt    : mt-8
 *   Gradient     : from-white/80 via-white/45 to-transparent
 *   Pb (for bar) : pb-[88px] sm:pb-[96px]
 *
 * SECTION HEADING
 * ───────────────
 *   Label  : text-[11px] uppercase tracking-[0.22em] text-[#C89B3C] font-semibold
 *   Lines  : h-px w-12 lg:w-20 bg-[#C89B3C]/70
 *   Diamond: ◆ text-[7px] text-[#C89B3C]
 *   H2     : mt-4 text-[1.75rem] sm:text-4xl lg:text-[2.375rem] font-heading font-bold
 *   H2 col : text-[#082F63]
 *   Leading: leading-[1.15]
 *
 * FOOTER
 * ──────
 *   Bg       : bg-[#082F63]
 *   Col heads: text-[13px] font-semibold uppercase tracking-wide mb-5
 *   Links    : text-sm text-white/60 hover:text-white
 *   Icons    : h-8 w-8 rounded-full border border-white/20
 *   Logo img : h-[52px] w-[52px]
 *   Copyright: bg-[#061e3d] py-4 text-xs text-white/45 text-center
 */

export const COLORS = {
  navy: "#082F63",
  gold: "#C89B3C",
  footerDark: "#061E3D",
  iconGreen: "#3D8B40",
  iconBg: "#ECECEC",
  sectionBg: "#F3F4F6",
};

export const RADIUS = {
  btn: "rounded-md",
  card: "rounded-2xl",
  feature: "rounded-xl",
  circle: "rounded-full",
};

export const SHADOW = {
  card: "shadow-[0_2px_16px_rgba(0,0,0,0.07)]",
  cardHover: "hover:shadow-[0_6px_24px_rgba(8,47,99,0.12)]",
  navbar: "shadow-md",
};
