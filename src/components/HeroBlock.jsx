import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SafeImage from './SafeImage'

export default function HeroBlock({ headlines = [], featured = [] }) {
  const [active, setActive] = useState(0)
  const slides = featured.length ? featured : headlines

  useEffect(() => {
    if (slides.length <= 1) return undefined
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % slides.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [slides.length])

  if (!slides.length) return null

  const current = slides[active]

  return (
    <section className="hero-block">
      <div className="container">
        <div className="hero-slider-wrap">
          <div className="hero-slider-frame">
            <Link to={current.path || `/news/${current.slug || current.id}`} className="hero-slider-main">
              <SafeImage src={current.image} alt={current.title} key={current.id} />
              <div className="hero-slider-caption">
                <span className="hero-cat">{current.categoryName}</span>
                <h2>{current.title}</h2>
              </div>
            </Link>
            <button
              type="button"
              className="hero-nav hero-nav-prev"
              onClick={() => setActive((i) => (i - 1 + slides.length) % slides.length)}
              aria-label="আগের"
            >
              ‹
            </button>
            <button
              type="button"
              className="hero-nav hero-nav-next"
              onClick={() => setActive((i) => (i + 1) % slides.length)}
              aria-label="পরের"
            >
              ›
            </button>
            <div className="hero-dots">
              {slides.slice(0, 6).map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  className={i === active ? 'active' : ''}
                  onClick={() => setActive(i)}
                  aria-label={`স্লাইড ${i + 1}`}
                />
              ))}
            </div>
          </div>
          <div className="hero-slider-thumbs">
            {slides.slice(0, 5).map((item, i) => (
              <button
                key={item.id}
                type="button"
                className={i === active ? 'active' : ''}
                onClick={() => setActive(i)}
              >
                <SafeImage src={item.image} alt="" />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
