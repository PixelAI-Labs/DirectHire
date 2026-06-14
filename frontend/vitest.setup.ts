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

// Mock lucide-react icons. Each named export returns a span whose label is the
// icon name, so tests can assert `getByText('Briefcase')` etc.
const LUCIDE_ICONS = [
  'Eye', 'EyeOff', 'CheckCircle', 'XCircle', 'Info', 'X', 'Menu', 'Search',
  'DollarSign', 'Briefcase', 'Users', 'Calendar', 'Mail', 'TrendingUp', 'RefreshCw', 'Send',
  'FileText', 'ChevronRight', 'CheckCircle2', 'AlertCircle', 'Bell', 'User',
  'UserPlus', 'LogIn', 'LogOut', 'Loader', 'Loader2', 'ArrowRight', 'ArrowLeft',
  'Plus', 'Minus', 'Edit', 'Edit2', 'Trash', 'Trash2', 'Settings', 'LogOut',
  'Home', 'ChevronLeft', 'ChevronDown', 'ChevronUp', 'Star', 'Heart',
  'MessageSquare', 'MessageCircle', 'Phone', 'Video', 'MapPin', 'Globe',
  'Award', 'Target', 'Zap', 'Cpu', 'Code', 'Code2', 'Terminal', 'GitBranch',
  'Github', 'Linkedin', 'Twitter', 'Facebook', 'Instagram', 'Youtube',
  'Upload', 'Download', 'Save', 'Copy', 'Share', 'Share2', 'Link', 'ExternalLink',
  'Filter', 'SortAsc', 'SortDesc', 'MoreHorizontal', 'MoreVertical', 'Menu',
  'Grid', 'List', 'Columns', 'Rows', 'Maximize', 'Minimize', 'Volume', 'VolumeX',
  'Play', 'Pause', 'SkipForward', 'SkipBack', 'FastForward', 'Rewind',
]
const lucideMock: Record<string, React.FC> = {}
for (const name of LUCIDE_ICONS) {
  lucideMock[name] = () => React.createElement('span', null, name)
}
vi.mock('lucide-react', () => lucideMock)

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
