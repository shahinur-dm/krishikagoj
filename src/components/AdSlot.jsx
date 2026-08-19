import { useEffect, useRef } from 'react'

/**
 * Renders admin-pasted ad HTML, or a visible placeholder when empty.
 * Scripts in HTML are not executed (browser limitation of innerHTML).
 */
export default function AdSlot({
  html = '',
  label = 'বিজ্ঞাপন',
  size = '728×90',
  className = '',
  showPlaceholder = true,
}) {
  const ref = useRef(null)
  const code = (html || '').trim()

  useEffect(() => {
    if (!ref.current || !code) return
    ref.current.innerHTML = code
  }, [code])

  if (!code && !showPlaceholder) return null

  return (
    <div className={`ad-slot${className ? ` ${className}` : ''}`} role="complementary" aria-label={label}>
      {code ? (
        <div className="ad-slot-html" ref={ref} />
      ) : (
        <div className="ad-slot-placeholder">
          <span>{label}</span>
          <small>{size}</small>
        </div>
      )}
    </div>
  )
}
