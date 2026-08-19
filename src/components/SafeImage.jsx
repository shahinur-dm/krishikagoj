import { useEffect, useState } from 'react'

const FALLBACK = '/placeholder-news.svg'
const FALLBACK_POOL = ['/fallback-03.png', '/fallback-04.png', '/fallback-05.png', '/fallback-06.png']

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : ''

function hashSeed(seed = '') {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function pickFallback(seed = '', offset = 0) {
  return FALLBACK_POOL[(hashSeed(seed) + offset) % FALLBACK_POOL.length]
}

/** Resize Unsplash (and similar) URLs for faster downloads */
export function optimizeImage(src, width = 480) {
  if (!src || typeof src !== 'string') return FALLBACK
  if (src.startsWith('/api/media/')) return `${API_BASE}${src}`
  if (src.startsWith('data:')) return src
  if (src.includes('res.cloudinary.com')) {
    const parts = src.split('/upload/')
    if (parts.length === 2) {
      return `${parts[0]}/upload/f_auto,q_auto,w_${width},c_fill,g_auto/${parts[1]}`
    }
  }
  if (src.includes('images.unsplash.com')) {
    const base = src.split('?')[0]
    return `${base}?auto=format&fit=crop&w=${width}&h=${Math.round(width * 0.66)}&q=70`
  }
  return src
}

export default function SafeImage({
  src,
  alt = '',
  className,
  width = 480,
  priority = false,
  ...props
}) {
  const seed = `${src || ''}:${alt || ''}:${width}`
  const optimized = src ? optimizeImage(src, width) : pickFallback(seed)
  const [url, setUrl] = useState(optimized)

  useEffect(() => {
    setUrl(src ? optimizeImage(src, width) : pickFallback(seed))
  }, [seed, src, width])

  function handleError() {
    const currentIndex = FALLBACK_POOL.indexOf(url)
    if (currentIndex >= 0) {
      setUrl(FALLBACK_POOL[(currentIndex + 1) % FALLBACK_POOL.length])
      return
    }
    setUrl(pickFallback(seed))
  }

  return (
    <img
      {...props}
      src={url || FALLBACK}
      alt={alt}
      className={className}
      onError={handleError}
      loading={priority ? 'eager' : props.loading || 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
    />
  )
}
