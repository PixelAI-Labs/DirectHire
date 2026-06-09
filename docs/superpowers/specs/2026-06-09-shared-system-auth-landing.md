# Design Spec — Shared Design System, Landing Page & Auth Flow

**Date:** 2026-06-09
**Project:** DirectHire
**Scope:** Build the entire `frontend/shared/` package, the public-facing landing page, and the full authentication flow (frontend + backend).

---

## 1. Goals

- Provide a premium, minimalist, highly reusable UI foundation for both `candidate/` and `recruiter/` apps.
- Create a single, breathtaking landing page that communicates the product's AI-powered value proposition.
- Implement a complete auth system (register, login, JWT) with premium UI/UX.

## 2. Architecture

### 2.1. Shared Package (`frontend/shared/`)

```
frontend/shared/
├── src/
│   ├── theme/
│   │   ├── tokens.ts         # Colors, typography, spacing, motion
│   │   └── index.ts
│   ├── motion/
│   │   ├── variants.ts       # Reusable Framer Motion variants (fadeUp, stagger, etc.)
│   │   ├── hooks.ts          # useReveal, useReducedMotion
│   │   └── index.ts
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── TextArea.tsx
│   │   ├── Select.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Toast.tsx
│   │   ├── Modal.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Skeleton.tsx
│   │   ├── DataTable.tsx
│   │   └── index.ts
│   ├── layout/
│   │   ├── FluidContainer.tsx
│   │   ├── SplitScreen.tsx
│   │   ├── CenteredSection.tsx
│   │   └── index.ts
│   ├── services/
│   │   ├── api.ts            # Axios instance with JWT interceptors
│   │   ├── auth.ts           # Auth API wrappers
│   │   └── index.ts
│   ├── utils/
│   │   ├── cn.ts             # Conditional class name utility
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## 3. Design Tokens

### Colors
| Name | Hex | Usage |
|------|-----|-------|
| `bg` | `#0c1324` | Page background |
| `surface` | `#151b2d` | Card/surface backgrounds |
| `primary` | `#adc6ff` | Primary buttons, active states |
| `secondary` | `#d0bcff` | Secondary accents, gradients |
| `accent` | `#ffb95f` | Warnings, highlights |
| `text` | `#dce1fb` | Primary text |
| `muted` | `#8b92b4` | Secondary/muted text |

### Typography
- **Headings:** Sora
- **Body:** Geist
- **Meta/Mono:** JetBrains Mono

### Motion
- **Micro (100–200ms):** Hover, focus, click
- **Interface (300–600ms):** Cards, drawers, modals
- **Narrative (800–1500ms):** Hero animations, agent flows

## 4. UI Components

### Button
- **Variants:** ghost, outline, filled
- **States:** rest, hover (glow + slight scale), active, disabled, loading
- **Motion:** `whileHover={{ scale: 1.03 }}`, `whileTap={{ scale: 0.98 }}`
- **Accessibility:** `focus-visible` ring, `aria-busy` on loading

### Input / TextArea / Select
- **States:** rest, focus (glow ring), error (shake animation + red border), valid (green hint)
- **Floating label:** Label floats up on focus
- **Motion:** Label `y: 0 → -20`, border opacity transition

### Card
- **Style:** `bg-surface`, `border border-white/5`, `rounded-2xl`
- **Motion:** `whileHover={{ y: -4, boxShadow: '0 0 40px rgba(173,198,255,0.1)' }}`

### Toast
- **Behavior:** Stackable, auto-dismiss 5s, `framer-motion` exit animation (slide up + fade)
- **Types:** success, error, info

### Modal
- **Behavior:** AnimatePresence, backdrop blur, scale in from 0.95, focus trap

## 5. Motion System

### Variants (in `variants.ts`)
```ts
export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
}
```

### Hooks (in `hooks.ts`)
- `useReveal(threshold = 0.2)` — IntersectionObserver hook to trigger motion on scroll
- `useReducedMotion()` — Wraps `window.matchMedia('(prefers-reduced-motion: reduce)')`

## 6. Landing Page (`frontend/shared/pages/Landing.tsx`)

### 6.1. Hero Section
- **Layout:** Full viewport, centered content, z-10 above background orbs
- **Background:** Two large blurred gradient orbs (primary + secondary) slowly drifting via CSS animation
- **Headline:** "Hiring, Handled by Intelligence." — Animated gradient text, line-by-line reveal
- **Subtitle:** Typewriter effect cycling through:
  - "Your AI Career Agent works 24/7."
  - "Automated matching. Negotiation. Scheduling."
  - "The future of hiring, today."
- **CTAs:**
  - "For Candidates" → `/candidate/login`
  - "For Recruiters" → `/recruiter/login`
- **Motion:** Text stagger-in, orbs drifting, CTA buttons hover glow

### 6.2. How It Works
- **Layout:** Three-column card grid, centered
- **Content:**
  1. **Upload & Analyze** — Candidate uploads resume, Career Agent extracts skills
  2. **Intelligent Matching** — Agent matches to best-fit jobs, scores alignment
  3. **Seamless Hiring** — Interview scheduled, offer negotiated automatically
- **Motion:** Scroll-triggered stagger reveal, icons animate on hover (agent pulse)

### 6.3. Agent Visualization
- **Layout:** Wide banner, centered
- **Content:** Animated sequence of agent icons connected by flowing data dots
- **Motion:** Data packets pulse along the line, agent orbs glow when active

### 6.4. Social Proof / Footer
- **Stats:** "50K+ Candidates", "2,000+ Companies", "98% Match Rate" — animated counters
- **Footer:** Minimal links, copyright

## 7. Auth Flow

### 7.1. Frontend

#### Login Page (`frontend/shared/pages/Login.tsx`)
- **Layout:** Split screen — left: animated gradient background with orbs, right: glassmorphism login card
- **Form Fields:**
  - Email (floating label, real-time validation)
  - Password (with show/hide toggle icon)
- **Actions:**
  - "Sign In" button (primary, full width)
  - "Don't have an account? Register" link
- **Motion:**
  - Card slides in from right on mount
  - Input focus: border glow transition
  - Error: shake animation on the form card
  - Loading state: button text swaps to spinner

#### Register Page (`frontend/shared/pages/Register.tsx`)
- **Layout:** Same split screen layout
- **Form Fields:**
  - Full Name
  - Email
  - Password (with strength indicator: weak/medium/strong)
  - Confirm Password (match validation)
  - Role: Radio buttons "Candidate" / "Recruiter"
- **Motion:** Same as login + password strength bar fills with color (red → yellow → green)

### 7.2. Backend (`backend/apps/auth/`)

#### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create user, return JWT |
| POST | `/api/auth/login` | Validate credentials, return JWT |
| GET | `/api/auth/me` | Return current user from token |

#### Models
- `User`: id, email, name, role (CANDIDATE|RECRUITER|ADMIN), hashed_password, created_at
- `Token`: access_token, token_type
- `LoginPayload`: email, password
- `RegisterPayload`: full_name, email, password, role

#### Security
- Passwords hashed with `bcrypt`
- JWT tokens with.Validates JWT from `Authorization: Bearer <token>` header
- CORS configured for frontend origins

## 8. API Services (`frontend/shared/src/services/`)

### `api.ts`
- Axios instance with base URL `/api`
- **Request interceptor:** Attach `Authorization: Bearer <token>` from `localStorage`
- **Response interceptor:** On 401, clear token and redirect to `/login`

### `auth.ts`
```ts
const register = (data: RegisterPayload) => api.post('/auth/register', data)
const login = (data: LoginPayload) => api.post('/auth/login', data)
const me = () => api.get('/auth/me')
```

## 9. Accessibility

- **Keyboard Navigation:** All interactive elements focusable, `Tab` order logical
- **Reduced Motion:** All animations respect `prefers-reduced-motion` via `useReducedMotion()`
- **Screen Readers:** Proper `aria-label`, `aria-live` on error messages, `aria-busy` on loading
- **Color Contrast:** All text meets WCAG AA against dark backgrounds

## 10. Performance

- **Lighthouse:** Target 95+ for all categories
- **Bundle:** No heavy animation libraries beyond Framer Motion (already in deps)
- **Images:** All icons from `lucide-react` (tree-shakeable SVGs)

---

*Spec written by Claude Code — 2026-06-09*
