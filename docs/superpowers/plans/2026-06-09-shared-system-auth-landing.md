# Shared Design System, Landing Page & Auth Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the entire `frontend/shared/` package (theme tokens, motion system, UI components, layout components, API services), a premium animated landing page, and the full auth flow (frontend + backend).

**Architecture:** Monorepo with `frontend/shared` as a shared UI package consumed by `candidate/` and `recruiter/` apps. Backend built with FastAPI, JWT auth, MongoDB.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Axios, FastAPI, MongoDB, Pydantic, bcrypt, PyJWT

---

## File Structure Map

```
frontend/shared/
├── src/
│   ├── theme/
│   │   ├── tokens.ts
│   │   └── index.ts
│   ├── motion/
│   │   ├── variants.ts
│   │   ├── hooks.ts
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
│   │   ├── ToastProvider.tsx
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
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── cn.ts
│   │   └── index.ts
│   └── index.ts
backend/apps/auth/
├── models.py
├── schemas.py
├── routes.py
├── security.py
└── __init__.py
```

---

## Task 1: Theme Tokens

**Files:**
- Create: `frontend/shared/src/theme/tokens.ts`
- Create: `frontend/shared/src/theme/index.ts`
- Modify: `frontend/apps/candidate/src/index.css`
- Modify: `frontend/apps/recruiter/src/index.css`

- [ ] **Step 1: Write theme tokens**

```typescript
// tokens.ts
export const colors = {
  bg: '#0c1324',
  surface: '#151b2d',
  surfaceHighlight: '#1e2640',
  primary: '#adc6ff',
  secondary: '#d0bcff',
  accent: '#ffb95f',
  text: '#dce1fb',
  textMuted: '#8b92b4',
  border: '#2a3150',
  error: '#ff6b6b',
  success: '#6bffa6',
  warning: '#ffb95f',
}

export const typography = {
  heading: "'Sora', sans-serif",
  body: "'Geist', sans-serif",
  mono: "'JetBrains Mono', monospace",
}

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '24px',
  6: '32px',
  7: '48px',
  8: '64px',
  9: '96px',
  10: '128px',
}

export const motion = {
  micro: '150ms',
  interface: '400ms',
  narrative: '1200ms',
}

export const shadows = {
  glow: '0 0 40px rgba(173,198,255,0.15)',
  glowStrong: '0 0 60px rgba(173,198,255,0.3)',
  cardHover: '0 0 40px rgba(173,198,255,0.1)',
}

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}
```

- [ ] **Step 2: Create theme index**

```typescript
// index.ts
export * from './tokens'
```

- [ ] **Step 3: Import Tailwind in candidate app**

In `frontend/apps/candidate/src/index.css` add at top if not present:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Import Tailwind in recruiter app**

Do the same for `frontend/apps/recruiter/src/index.css`.

- [ ] **Step 5: Commit**

```bash
git add frontend/shared/src/theme frontend/apps/*/src/index.css
git commit -m "feat(shared): add design tokens (colors, typography, spacing, motion)"
```

---

## Task 2: Motion System

**Files:**
- Create: `frontend/shared/src/motion/variants.ts`
- Create: `frontend/shared/src/motion/hooks.ts`
- Create: `frontend/shared/src/motion/index.ts`

- [ ] **Step 1: Write motion variants**

```typescript
// variants.ts
import { Variants } from 'framer-motion'

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

export const staggerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}
```

- [ ] **Step 2: Write motion hooks**

```typescript
// hooks.ts
import { useEffect, useState } from 'react'

export function useReveal(threshold = 0.2) {
  const [ref, setRef] = useState<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!ref) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(ref)
        }
      },
      { threshold }
    )
    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref, threshold])

  return { ref: setRef, isVisible }
}

export function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mql.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return prefersReduced
}

export function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handler = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? scrollTop / docHeight : 0)
    }
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return progress
}
```

- [ ] **Step 3: Create motion index**

```typescript
// index.ts
export * from './variants'
export * from './hooks'
```

- [ ] **Step 4: Commit**

```bash
git add frontend/shared/src/motion
git commit -m "feat(motion): add reusable motion variants and hooks"
```

---

## Task 3: Utility — cn helper

**Files:**
- Create: `frontend/shared/src/utils/cn.ts`
- Create: `frontend/shared/src/utils/index.ts`

- [ ] **Step 1: Write cn utility**

```typescript
// cn.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: Create utils index**

```typescript
// index.ts
export * from './cn'
```

- [ ] **Step 3: Install deps**

```bash
cd frontend/shared && npm install clsx tailwind-merge
ncd ../..
```

- [ ] **Step 4: Commit**

```bash
git add frontend/shared/src/utils frontend/shared/package* frontend/shared/node_modules
git commit -m "feat(utils): add cn() conditional class helper"
```

---

## Task 4: Layout Components

**Files:**
- Create: `frontend/shared/src/layout/FluidContainer.tsx`
- Create: `frontend/shared/src/layout/SplitScreen.tsx`
- Create: `frontend/shared/src/layout/CenteredSection.tsx`
- Create: `frontend/shared/src/layout/index.ts`

- [ ] **Step 1: Write FluidContainer**

```typescript
// FluidContainer.tsx
import React from 'react'
import { cn } from '../utils'

interface FluidContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const maxWidths = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-8xl',
}

export const FluidContainer: React.FC<FluidContainerProps> = ({
  children,
  className,
  size = 'lg',
}) => {
  return (
    <div className={cn('mx-auto w-full px-6', maxWidths[size], className)}>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Write SplitScreen**

```typescript
// SplitScreen.tsx
import React from 'react'
import { cn } from '../utils'

interface SplitScreenProps {
  children: [React.ReactNode, React.ReactNode]
  className?: string
  leftRatio?: number
}

export const SplitScreen: React.FC<SplitScreenProps> = ({
  children,
  className,
  leftRatio = 60,
}) => {
  return (
    <div className={cn('flex min-h-screen', className)}>
      <div
        className="flex flex-col items-center justify-center p-8"
        style={{ width: `${leftRatio}%` }}
      >
        {children[0]}
      </div>
      <div
        className="flex flex-col items-center justify-center p-8 bg-[#151b2d]"
        style={{ width: `${100 - leftRatio}%` }}
      >
        {children[1]}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write CenteredSection**

```typescript
// CenteredSection.tsx
import React from 'react'
import { cn } from '../utils'

interface CenteredSectionProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
}

export const CenteredSection: React.FC<CenteredSectionProps> = ({
  children,
  className,
  glow = true,
}) => {
  return (
    <section
      className={cn(
        'relative flex flex-col items-center justify-center py-24 text-center overflow-hidden',
        className
      )}
    >
      {glow && (
        <>
          <div className="pointer-events-none absolute -left-[20%] -top-[20%] h-[600px] w-[600px] rounded-full bg-[#adc6ff]/5 blur-[120px]" />
          <div className="pointer-events-none absolute -right-[20%] top-[40%] h-[500px] w-[500px] rounded-full bg-[#d0bcff]/5 blur-[100px]" />
        </>
      )}
      {children}
    </section>
  )
}
```

- [ ] **Step 4: Create layout index**

```typescript
// index.ts
export { FluidContainer } from './FluidContainer'
export { SplitScreen } from './SplitScreen'
export { CenteredSection } from './CenteredSection'
```

- [ ] **Step 5: Commit**

```bash
git add frontend/shared/src/layout
git commit -m "feat(layout): add FluidContainer, SplitScreen, CenteredSection"
```

---

## Task 5: UI Components — Button, Card, Badge

**Files:**
- Create: `frontend/shared/src/ui/Button.tsx`
- Create: `frontend/shared/src/ui/Card.tsx`
- Create: `frontend/shared/src/ui/Badge.tsx`

- [ ] **Step 1: Write Button**

```typescript
// Button.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = 'primary', size = 'md', isLoading, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#adc6ff]/50'

    const variants = {
      primary:
        'bg-gradient-to-r from-[#adc6ff] to-[#d0bcff] text-[#0c1324] shadow-[0_0_40px_rgba(173,198,255,0.4)] hover:shadow-[0_0_60px_rgba(173,198,255,0.6)] hover:scale-[1.03] active:scale-[0.98]',
      outline:
        'border border-[#2a3150] bg-[#151b2d]/80 text-[#dce1fb] backdrop-blur-md hover:border-[#adc6ff]/50 hover:bg-[#1e2640] hover:scale-[1.03] active:scale-[0.98]',
      ghost: 'text-[#8b92b4] hover:text-[#adc6ff] hover:bg-[#adc6ff]/10',
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    }

    return (
      <motion.button
        ref={ref}
        whileHover={!disabled && !isLoading ? { scale: 1.03 } : undefined}
        whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </motion.button>
    )
  }
)
Button.displayName = 'Button'
```

- [ ] **Step 2: Write Card**

```typescript
// Card.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hover?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, hover = true, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={
          hover
            ? {
                y: -4,
                boxShadow: '0 0 40px rgba(173,198,255,0.1)',
              }
            : undefined
        }
        transition={{ duration: 0.3 }}
        className={cn(
          'rounded-2xl border border-white/5 bg-[#151b2d] p-6 backdrop-blur-sm',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
Card.displayName = 'Card'
```

- [ ] **Step 3: Write Badge**

```typescript
// Badge.tsx
import React from 'react'
import { cn } from '../utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
}

export const Badge: React.FC<BadgeProps> = ({ children, className, variant = 'default', ...props }) => {
  const variants = {
    default: 'bg-[#2a3150] text-[#8b92b4]',
    primary: 'bg-[#adc6ff]/20 text-[#adc6ff]',
    success: 'bg-[#6bffa6]/20 text-[#6bffa6]',
    warning: 'bg-[#ffb95f]/20 text-[#ffb95f]',
    error: 'bg-[#ff6b6b]/20 text-[#ff6b6b]',
  }

  return (
    <span
      className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/shared/src/ui/Button.tsx frontend/shared/src/ui/Card.tsx frontend/shared/src/ui/Badge.tsx
git commit -m "feat(ui): add Button, Card, Badge components"
```

---

## Task 6: UI Components — Input, TextArea, Select

**Files:**
- Create: `frontend/shared/src/ui/Input.tsx`
- Create: `frontend/shared/src/ui/TextArea.tsx`
- Create: `frontend/shared/src/ui/Select.tsx`

- [ ] **Step 1: Write Input**

```typescript
// Input.tsx
import React, { useState, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  showPasswordToggle?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, showPasswordToggle, type: initialType, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const type = initialType === 'password' && showPasswordToggle && showPassword ? 'text' : initialType

    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-[#8b92b4]">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full rounded-xl border bg-[#151b2d] px-4 py-3 text-[#dce1fb] placeholder-[#8b92b4]/50 outline-none transition-all duration-200',
              'focus:border-[#adc6ff]/50 focus:ring-2 focus:ring-[#adc6ff]/20',
              showPasswordToggle ? 'pr-12' : '',
              error
                ? 'border-[#ff6b6b]/50 focus:border-[#ff6b6b]/80 focus:ring-[#ff6b6b]/20'
                : 'border-[#2a3150]',
              className
            )}
            {...props}
          />
          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b92b4] hover:text-[#adc6ff]"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-1 text-sm text-[#ff6b6b]"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)
Input.displayName = 'Input'
```

- [ ] **Step 2: Write TextArea**

```typescript
// TextArea.tsx
import React, { forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../utils'

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-[#8b92b4]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full rounded-xl border bg-[#151b2d] px-4 py-3 text-[#dce1fb] placeholder-[#8b92b4]/50 outline-none transition-all duration-200',
            'focus:border-[#adc6ff]/50 focus:ring-2 focus:ring-[#adc6ff]/20',
            error
              ? 'border-[#ff6b6b]/50 focus:border-[#ff6b6b]/80 focus:ring-[#ff6b6b]/20'
              : 'border-[#2a3150]',
            className
          )}
          {...props}
        />
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-1 text-sm text-[#ff6b6b]"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)
TextArea.displayName = 'TextArea'
```

- [ ] **Step 3: Write Select**

```typescript
// Select.tsx
import React, { forwardRef } from 'react'
import { cn } from '../utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-[#8b92b4]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full rounded-xl border bg-[#151b2d] px-4 py-3 text-[#dce1fb] outline-none transition-all duration-200',
            'focus:border-[#adc6ff]/50 focus:ring-2 focus:ring-[#adc6ff]/20',
            error
              ? 'border-[#ff6b6b]/50 focus:border-[#ff6b6b]/80 focus:ring-[#ff6b6b]/20'
              : 'border-[#2a3150]',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-[#ff6b6b]">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
```

- [ ] **Step 4: Commit**

```bash
git add frontend/shared/src/ui/Input.tsx frontend/shared/src/ui/TextArea.tsx frontend/shared/src/ui/Select.tsx
git commit -m "feat(ui): add Input, TextArea, Select form components"
```

---

## Task 7: UI Components — Avatar, Skeleton, Tooltip, Modal

**Files:**
- Create: `frontend/shared/src/ui/Avatar.tsx`
- Create: `frontend/shared/src/ui/Skeleton.tsx`
- Create: `frontend/shared/src/ui/Tooltip.tsx`
- Create: `frontend/shared/src/ui/Modal.tsx`

- [ ] **Step 1: Write Avatar**

```typescript
// Avatar.tsx
import React from 'react'
import { cn } from '../utils'

interface AvatarProps {
  src?: string
  alt?: string
  initials?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-base',
  xl: 'h-24 w-24 text-xl',
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, initials, size = 'md', className }) => {
  const base = 'inline-flex items-center justify-center rounded-full bg-[#adc6ff]/10 text-[#adc6ff] font-bold'

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(base, sizeMap[size], 'object-cover', className)}
      />
    )
  }

  return <div className={cn(base, sizeMap[size], className)}>{initials || '?'}</div>
}
```

- [ ] **Step 2: Write Skeleton**

```typescript
// Skeleton.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../utils'

interface SkeletonProps {
  className?: string
  width?: number | string
  height?: number | string
  rounded?: boolean
  circle?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  rounded = true,
  circle,
}) => {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      className={cn(
        'bg-[#2a3150]/30',
        rounded && !circle && 'rounded-lg',
        circle && 'rounded-full',
        className
      )}
      style={{ width, height }}
    />
  )
}
```

- [ ] **Step 3: Write Tooltip**

```typescript
// Tooltip.tsx
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../utils'

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  className?: string
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content, className }) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#151b2d] px-3 py-1.5 text-sm text-[#dce1fb] shadow-lg border border-white/5',
              'bottom-full mb-2',
              className
            )}
          >
            {content}
            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#151b2d]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 4: Write Modal**

```typescript
// Modal.tsx
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './Button'
import { cn } from '../utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className={cn('relative z-10 w-full max-w-lg rounded-2xl bg-[#151b2d] p-6 border border-white/5', className)}
          >
            {title && (
              <h2 className="mb-4 text-xl font-bold text-[#dce1fb]">
                {title}
              </h2>
            )}
            {children}
            <Button onClick={onClose} variant="ghost" className="absolute right-4 top-4">
              Close
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/shared/src/ui/Avatar.tsx frontend/shared/src/ui/Skeleton.tsx frontend/shared/src/ui/Tooltip.tsx frontend/shared/src/ui/Modal.tsx
git commit -m "feat(ui): add Avatar, Skeleton, Tooltip, Modal components"
```

---

## Task 8: UI Components — Toast System

**Files:**
- Create: `frontend/shared/src/ui/Toast.tsx`
- Create: `frontend/shared/src/ui/ToastProvider.tsx`

- [ ] **Step 1: Write Toast type and context**

```typescript
// Toast.tsx
import React, { createContext, useContext, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../utils'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextType {
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextType | null>(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm',
                toast.type === 'success' && 'border-[#6bffa6]/30 bg-[#151b2d]/90 text-[#6bffa6]',
                toast.type === 'error' && 'border-[#ff6b6b]/30 bg-[#151b2d]/90 text-[#ff6b6b]',
                toast.type === 'info' && 'border-[#adc6ff]/30 bg-[#151b2d]/90 text-[#adc6ff]'
              )}
            >
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 text-[#8b92b4] hover:text-[#dce1fb] transition-colors"
              >
                Close
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/shared/src/ui/Toast.tsx frontend/shared/src/ui/ToastProvider.tsx
git commit -m "feat(ui): add Toast system with provider and useToast hook"
```

---

## Task 9: UI Components — DataTable

**Files:**
- Create: `frontend/shared/src/ui/DataTable.tsx`

- [ ] **Step 1: Write DataTable**

```typescript
// DataTable.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../utils'

interface Column<T> {
  key: keyof T | string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  className?: string
}

export function DataTable<T extends Record<string, unknown>>({ data, columns, className }: DataTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-white/5', className)}>
      <table className="w-full text-left text-sm">
        <thead className="bg-[#151b2d]">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="px-6 py-4 font-medium text-[#8b92b4]">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <motion.tr
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="border-t border-white/5 hover:bg-[#151b2d]/50 transition-colors"
            >
              {columns.map((col) => (
                <td key={String(col.key)} className={cn('px-6 py-4 text-[#dce1fb]', col.className)}>
                  {col.cell(row)}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/shared/src/ui/DataTable.tsx
git commit -m "feat(ui): add DataTable component"
```

---

## Task 10: UI Index Export

**Files:**
- Create: `frontend/shared/src/ui/index.ts`

- [ ] **Step 1: Write barrel export**

```typescript
// index.ts
export { Button } from './Button'
export { Card } from './Card'
export { Badge } from './Badge'
export { Input } from './Input'
export { TextArea } from './TextArea'
export { Select } from './Select'
export { Avatar } from './Avatar'
export { Skeleton } from './Skeleton'
export { Tooltip } from './Tooltip'
export { Modal } from './Modal'
export { ToastProvider, useToast } from './Toast'
export { DataTable } from './DataTable'
```

- [ ] **Step 2: Commit**

```bash
git add frontend/shared/src/ui/index.ts
git commit -m "chore(ui): add barrel export for all UI components"
```

---

## Task 11: API Services

**Files:**
- Create: `frontend/shared/src/services/api.ts`
- Create: `frontend/shared/src/services/auth.ts`
- Create: `frontend/shared/src/services/index.ts`

- [ ] **Step 1: Write api.ts**

```typescript
// api.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

- [ ] **Step 2: Write auth.ts**

```typescript
// auth.ts
import { api } from './api'

export interface User {
  id: string
  email: string
  name: string
  role: 'CANDIDATE' | 'RECRUITER' | 'ADMIN'
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  full_name: string
  email: string
  password: string
  role: 'CANDIDATE' | 'RECRUITER'
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export const authService = {
  register: (data: RegisterPayload) =>
    api.post<TokenResponse>('/auth/register', data).then((r) => r.data),

  login: (data: LoginPayload) =>
    api.post<TokenResponse>('/auth/login', data).then((r) => r.data),

  me: () => api.get<User>('/auth/me').then((r) => r.data),
}
```

- [ ] **Step 3: Create services index**

```typescript
// index.ts
export { api } from './api'
export { authService, type User, type LoginPayload, type RegisterPayload, type TokenResponse } from './auth'
```

- [ ] **Step 4: Commit**

```bash
git add frontend/shared/src/services
git commit -m "feat(services): add API client and auth service wrappers"
```

---

## Task 12: Shared Package Entry Point

**Files:**
- Modify: `frontend/shared/src/index.ts`

- [ ] **Step 1: Write main export**

```typescript
// index.ts
export * from './theme'
export * from './motion'
export * from './ui'
export * from './layout'
export * from './services'
export * from './utils'
```

- [ ] **Step 2: Commit**

```bash
git add frontend/shared/src/index.ts
git commit -m "chore(shared): add main barrel export"
```

---

## Task 13: Backend Auth Module

**Files:**
- Create: `backend/apps/auth/models.py`
- Create: `backend/apps/auth/schemas.py`
- Create: `backend/apps/auth/security.py`
- Create: `backend/apps/auth/routes.py`
- Create: `backend/apps/auth/__init__.py`

- [ ] **Step 1: Install backend deps**

```bash
cd backend
source .venv/bin/activate
pip install passlib[bcrypt] python-jose pydantic motor fastapi python-multipart
```

- [ ] **Step 2: Write models.py**

```python
# backend/apps/auth/models.py
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from datetime import datetime

async def get_users_collection() -> AsyncIOMotorCollection:
    from main import db  # lazy import to avoid circular deps
    return db.users

class User:
    @staticmethod
    async def create(email: str, hashed_password: str, name: str, role: str):
        users = await get_users_collection()
        result = await users.insert_one({
            "email": email.lower(),
            "hashed_password": hashed_password,
            "name": name,
            "role": role,
            "created_at": datetime.utcnow()
        })
        return str(result.inserted_id)

    @staticmethod
    async def get_by_email(email: str):
        users = await get_users_collection()
        return await users.find_one({"email": email.lower()})

    @staticmethod
    async def get_by_id(user_id: str):
        users = await get_users_collection()
        return await users.find_one({"_id": ObjectId(user_id)})
```

- [ ] **Step 3: Write schemas.py**

```python
# backend/apps/auth/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Literal

class RegisterPayload(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Literal["CANDIDATE", "RECRUITER"]

class LoginPayload(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
```

- [ ] **Step 4: Write security.py**

```python
# backend/apps/auth/security.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str):
    from .models import User
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await User.get_by_id(user_id)
    if user is None:
        raise credentials_exception
    return user
```

- [ ] **Step 5: Write routes.py**

```python
# backend/apps/auth/routes.py
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from .schemas import RegisterPayload, LoginPayload, TokenResponse, UserOut
from .models import User
from .security import hash_password, verify_password, create_access_token, get_current_user
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterPayload):
    existing = await User.get_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(payload.password)
    user_id = await User.create(payload.email, hashed, payload.full_name, payload.role)
    token = create_access_token({"sub": user_id})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await User.get_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    token = create_access_token({"sub": str(user["_id"])})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
async def me(token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
    }
```

- [ ] **Step 6: Write __init__.py**

```python
# backend/apps/auth/__init__.py
from .routes import router as auth_router
```

- [ ] **Step 7: Wire into main.py**

In `backend/main.py`, add:
```python
from apps.auth import auth_router
app.include_router(auth_router, prefix="/api")
```

- [ ] **Step 8: Commit**

```bash
git add backend/
git commit -m "feat(auth): add full backend auth module (register, login, me)"