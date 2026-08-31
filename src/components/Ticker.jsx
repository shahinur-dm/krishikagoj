import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteData } from '../context/SiteDataContext'
import { useLang } from '../context/LanguageContext'

const ITEM_HEIGHT = 40
const HOLD_MS = 4000
const SLIDE_MS = 600

export default function Ticker() {
  const { headlines, latest, breakingNews } = useSiteData()
  const { t, text } = useLang()
  const managed = (breakingNews || []).filter((b) => b.titleBn || b.titleEn)
  const fallback = (headlines.length ? headlines : latest).slice(0, 10)
  const items = managed.length
    ? managed.map((b) => ({
        id: b._id,
        title: text(b.titleBn, b.titleEn),
        path: '/',
      }))
    : fallback
  const count = items.length
  const [index, setIndex] = useState(0)
  const [sliding, setSliding] = useState(true)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!count || paused) return
    const timer = setInterval(() => setIndex((i) => i + 1), HOLD_MS)
    return () => clearInterval(timer)
  }, [count, paused])

  useEffect(() => {
    if (index !== count) return
    const timer = setTimeout(() => {
      setSliding(false)
      setIndex(0)
    }, SLIDE_MS)
    return () => clearTimeout(timer)
  }, [index, count])

  useEffect(() => {
    if (sliding) return
    const timer = setTimeout(() => setSliding(true), 60)
    return () => clearTimeout(timer)
  }, [sliding])

  if (!count) return null
  const loop = [...items, items[0]]

  return (
    <section className="container mt-2">
      <div
        className="breaking-bar"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="breaking-label">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5.52.359A.5.5 0 0 1 6 0h4a.5.5 0 0 1 .474.658L8.694 6H12.5a.5.5 0 0 1 .395.807l-7 9a.5.5 0 0 1-.873-.454L6.823 9.5H3.5a.5.5 0 0 1-.48-.641l2.5-8.5z" />
          </svg>
          <span>{t.breakingNews}</span>
        </div>
        <div className="breaking-track">
          <div
            className="breaking-move"
            style={{
              transform: `translateY(-${index * ITEM_HEIGHT}px)`,
              transition: sliding ? `transform ${SLIDE_MS}ms ease` : 'none',
            }}
          >
            {loop.map((item, i) => (
              <Link
                key={`${item.id}-${i}`}
                to={item.path || `/news/${item.slug || item.id}`}
                className="breaking-item"
              >
                <span className="breaking-item-text">{text(item.title, item.titleEn)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
