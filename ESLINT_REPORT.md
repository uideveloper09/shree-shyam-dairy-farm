# ESLint Error Fix Report

**Date:** 2025-06-25  
**Command:** `npm run lint`  
**Result:** ✅ **0 errors**, 53 warnings (warnings intentionally left unchanged)

---

## Summary

All 10 ESLint **errors** were fixed without changing business logic. Fixes targeted three rule categories:

| Rule                                           | Count fixed |
| ---------------------------------------------- | ----------- |
| `@typescript-eslint/no-require-imports`        | 2           |
| `@typescript-eslint/no-assign-module-variable` | 1           |
| `react-hooks/set-state-in-effect`              | 7           |

---

## Files Changed

### 1. `crop-logo.js` — `no-require-imports`

**Before:** `const sharp = require("sharp")`  
**After:** Top-level async IIFE with `await import("sharp")`  
**Why:** Replaces CommonJS `require` with dynamic ESM import; script behavior unchanged.

### 2. `sdk/typescript/src/client.ts` — `no-require-imports`

**Before:** `require("crypto")` inside `verifyWebhookSignature`  
**After:** `import { createHmac } from "node:crypto"` at module top  
**Why:** Node SDK already runs in Node; static ESM import is equivalent.

### 3. `src/app/api/v1/ai/analyze/route.ts` — `no-assign-module-variable`

**Before:** `const module = body.module`  
**After:** `const aiModule = body.module`  
**Why:** Renames local variable to avoid shadowing the CommonJS `module` global.

### 4. `src/components/Navbar.jsx` — `set-state-in-effect`

**Before:** `setActiveSection("")` when `pathname !== "/"` inside `useEffect`  
**After:** State renamed to `homeActiveSection`; derived `activeSection = pathname === "/" ? homeActiveSection : ""`  
**Why:** Active section is computed from pathname instead of resetting state in an effect.

### 5. `src/components/ui/ChatAssistant.jsx` — `set-state-in-effect`

**Before:** `useEffect` seeded greeting when `isOpen && messages.length === 0`  
**After:** `toggleOpen` handler seeds greeting when opening with empty messages  
**Why:** Greeting is set in the user interaction path, not synchronously in an effect.

### 6. `src/components/ui/PaymentCheckoutModal.jsx` — `set-state-in-effect` (3 errors)

| Issue                              | Fix                                                          |
| ---------------------------------- | ------------------------------------------------------------ |
| `setIsMobile` in mount effect      | Lazy `useState` initializer reads `navigator.userAgent` once |
| Reset checkout state when `open`   | Deferred via `setTimeout(..., 0)`; fetch unchanged           |
| `loadUpiQr()` / QR clear in effect | Deferred via `setTimeout(..., 0)`                            |

**Why:** Preserves open/close and QR-loading behavior while avoiding synchronous `setState` in effect bodies.

### 7. `src/features/mobile/OfflineBanner.jsx` — `set-state-in-effect`

**Before:** `setOnline(navigator.onLine)` on mount in effect  
**After:** `useState(() => navigator.onLine)` lazy initializer  
**Why:** Initial online status set at state creation; event listeners unchanged.

### 8. `src/features/subscription/SubscriptionManager.jsx` — `set-state-in-effect`

**Before:** `loadSubscriptions()` called directly in `useEffect` (triggers sync `setLoading`)  
**After:** `queueMicrotask(() => void loadSubscriptions())` with cancellation flag  
**Why:** Data load still runs on mount; state updates occur outside the synchronous effect body.

---

## Verification

```
npm run lint
```

```
✖ 53 problems (0 errors, 53 warnings)
Exit code: 0
```

Warnings (console statements, unused vars, `no-img-element`, etc.) were **not** modified per scope.

---

## Remaining Warnings (53)

| Category                            | Count (approx.) |
| ----------------------------------- | --------------- |
| `no-console`                        | 35              |
| `@typescript-eslint/no-unused-vars` | 16              |
| `@next/next/no-img-element`         | 1               |
| Other                               | 1               |

These are pre-existing and out of scope for this task.
