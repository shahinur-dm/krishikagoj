import { useEffect, useState } from 'react'
import AdCard, { adsForSlider } from './AdCard'
import { useSiteData } from '../context/SiteDataContext'

const INTERVAL_MS = 10_000

/** Right-to-left rotating ads — one after another every 10s */
export default function AdSlider({ ads = [], position, variant = 'banner', startOffset = 0 }) {
  const { settings } = useSiteData()
  const list = adsForSlider(ads, position, settings)
  const [index, setIndex] = useState(() => (list.length ? startOffset % list.length : 0))

  useEffect(() => {
    if (list.length < 2) return undefined
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % list.length)
    }, INTERVAL_MS)
    return () => window.clearInterval(t)
  }, [list.length])

  if (!list.length) return null

  const safeIndex = index % list.length

  return (
    <div className="ad-slider" aria-roledescription="carousel">
      <div
        className="ad-slider-track"
        style={{ transform: `translateX(-${safeIndex * 100}%)` }}
      >
        {list.map((ad, i) => (
          <div className="ad-slider-slide" key={ad.id || ad._id || `${ad.position}-${i}`}>
            <AdCard ad={ad} variant={variant} />
          </div>
        ))}
      </div>
    </div>
  )
}
