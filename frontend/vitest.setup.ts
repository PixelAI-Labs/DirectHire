import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import React from 'react'

// Mock framer-motion to skip animations in tests.
// The mock filters out motion-specific props (whileHover, whileTap, layout, ...)
// before spreading to DOM elements — otherwise React warns that unknown
// attributes are being passed to <button>/<div>/etc.
const MOTION_ONLY_PROPS = [
  'whileHover',
  'whileTap',
  'whileDrag',
  'whileFocus',
  'whileInView',
  'layout',
  'layoutId',
  'variants',
  'initial',
  'animate',
  'exit',
  'transition',
  'drag',
  'dragConstraints',
  'dragElastic',
  'dragMomentum',
  'dragPropagation',
  'dragSnapToOrigin',
  'onDragStart',
  'onDragEnd',
  'onDrag',
  'onAnimationStart',
  'onAnimationComplete',
  'onAnimationIteration',
  'onUpdate',
]
const stripMotionProps = (
  props: Record<string, unknown> & { children?: React.ReactNode }
): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue
    if (MOTION_ONLY_PROPS.includes(key)) continue
    out[key] = value
  }
  return out
}

vi.mock('framer-motion', () => ({
  motion: {
    button: (props: any) =>
      React.createElement('button', stripMotionProps(props), props.children),
    div: (props: any) =>
      React.createElement('div', stripMotionProps(props), props.children),
    p: (props: any) =>
      React.createElement('p', stripMotionProps(props), props.children),
    span: (props: any) =>
      React.createElement('span', stripMotionProps(props), props.children),
    h2: (props: any) =>
      React.createElement('h2', stripMotionProps(props), props.children),
  },
  AnimatePresence: ({ children }: any) =>
    React.createElement(React.Fragment, null, children),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Eye: () => React.createElement('span', null, 'Eye'),
  EyeOff: () => React.createElement('span', null, 'EyeOff'),
  CheckCircle: () => React.createElement('span', null, 'Check'),
  XCircle: () => React.createElement('span', null, 'Error'),
  Info: () => React.createElement('span', null, 'Info'),
  X: () => React.createElement('span', null, 'X'),
  Menu: () => React.createElement('span', null, 'Menu'),
  Search: () => React.createElement('span', null, 'Search'),
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock crypto.randomUUID to return a unique value on every call — without
// this, repeated calls return `'test-uuid-1234'` and React warns about
// duplicate keys when Toast.tsx maps over a list of toasts.
let _uuidCounter = 0
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => `test-uuid-${++_uuidCounter}`,
  },
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  localStorageMock.clear()
  _uuidCounter = 0
})
