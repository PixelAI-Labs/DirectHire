// Design Tokens — DirectHire Design System
// https://directhire.io/design

export const colors = {
  background: '#0a0f1e',
  backgroundElevated: '#0c1324',
  surface: '#121a2e',
  surfaceRaised: '#1a2238',
  border: '#1e2a42',
  borderHover: '#2b3a5a',
  primary: '#8b5cf6',
  primaryLight: '#a78bfa',
  primaryDark: '#7c3aed',
  secondary: '#06b6d4',
  secondaryLight: '#22d3ee',
  success: '#22c55e',
  successLight: '#4ade80',
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  error: '#ef4444',
  errorLight: '#f87171',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  textSubdued: '#64748b',
} as const

export const typography = {
  display: 'var(--font-display)',
  heading: 'var(--font-heading)',
  body: 'var(--font-body)',
  caption: 'var(--font-caption)',
} as const

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
  '4xl': '6rem',
  '5xl': '8rem',
} as const

export const radius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  '3xl': '2rem',
  full: '9999px',
} as const

export const shadows = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  glow: 'var(--shadow-glow)',
  glowStrong: 'var(--shadow-glow-strong)',
} as const

export const easing = {
  default: 'var(--ease-default)',
  spring: 'var(--ease-spring)',
} as const