/**
 * Detects physical mobile devices regardless of browser "Desktop site" settings.
 * Ensures the website preserves the existing mobile layout on mobile devices.
 */
export function initPhysicalMobileDetection() {
  if (typeof window === 'undefined') return

  function evaluate() {
    try {
      const w = window.screen?.width || 0
      const h = window.screen?.height || 0
      const screenMin = Math.min(w, h)
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)
      const isPhysicalMobile = isTouch && screenMin > 0 && screenMin < 600

      if (isPhysicalMobile) {
        document.documentElement.classList.add('is-physical-mobile')
      } else {
        document.documentElement.classList.remove('is-physical-mobile')
      }
    } catch {
      /* ignore */
    }
  }

  evaluate()
  window.addEventListener('resize', evaluate, { passive: true })
  window.addEventListener('orientationchange', evaluate, { passive: true })
}
