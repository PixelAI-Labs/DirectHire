import { useEffect, useRef, useState, useCallback } from 'react'

export function useReveal(threshold = 0.2): {
  ref: (el: HTMLElement | null) => void
  isVisible: boolean
} {
  const [isVisible, setIsVisible] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)

  const ref = useCallback((el: HTMLElement | null) => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    elementRef.current = el

    if (!el) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observerRef.current?.disconnect()
        }
      },
      { threshold }
    )

    observerRef.current.observe(el)
  }, [threshold])

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  return { ref, isVisible }
}

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}

export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight <= 0) {
        setProgress(0)
        return
      }
      const currentProgress = window.scrollY / scrollHeight
      setProgress(Math.min(1, Math.max(0, currentProgress)))
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  return progress
}