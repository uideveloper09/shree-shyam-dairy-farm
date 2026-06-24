/* ════════════════════════════════════════════════
   LAYOUT TOKENS  —  pixel-perfect design system
   Derived from design spec + reference screenshot
   ════════════════════════════════════════════════

   Container : max-w-[1280px]  (content: ~1200px inside px-[40px])
   Section   : py-[90px]
   Card gap  : gap-6           (24px)
   Grid gap  : gap-8           (32px)
*/

/* 1280px outer, 1200px inner content (40px side pad on lg) */
export const CONTAINER = "max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-[40px]";

/* Standard section vertical rhythm: 90px */
export const SECTION = "py-[90px]";

/* Grid gaps */
export const GAP_CARD = "gap-6";   /* 24px */
export const GAP_GRID = "gap-8";   /* 32px */
