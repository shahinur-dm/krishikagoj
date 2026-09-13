import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, mapArticle, formatBnDate } from '../api/client'
import SafeImage from '../components/SafeImage'
import SeoHead from '../components/SeoHead'
import { useSiteData } from '../context/SiteDataContext'
import { useLang } from '../context/LanguageContext'

export default function SearchPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const q = (params.get('q') || '').trim()
  const { settings } = useSiteData()
  const { t, text, lang } = useLang()
  const [input, setInput] = useState(q)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const moreLock = useRef(false)
  const moreRef = useRef(null)

  useEffect(() => {
    setInput(q)
    if (!q) {
      setItems([])
      setHasMore(false)
      return undefined
    }
    let alive = true
    setLoading(true)
    api
      .getArticles({ q, limit: '20', skip: '0' })
      .then((data) => {
        if (!alive) return
        const next = (data || []).map(mapArticle)
        setItems(next)
        setHasMore(next.length === 20)
      })
      .catch((err) => {
        if (alive) setError(err.message)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [q])

  useEffect(() => {
    if (!q || !hasMore || loading) return undefined
    const el = moreRef.current
    if (!el) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || moreLock.current) return
        moreLock.current = true
        setLoadingMore(true)
        api
          .getArticles({ q, limit: '20', skip: String(items.length) })
          .then((data) => {
            const fetched = (data || []).map(mapArticle)
            setItems((prev) => {
              const seen = new Set(prev.map((item) => item.id || item.slug))
              return prev.concat(fetched.filter((item) => !seen.has(item.id || item.slug)))
            })
            setHasMore(fetched.length === 20)
          })
          .catch(() => {})
          .finally(() => {
            moreLock.current = false
            setLoadingMore(false)
          })
      },
      { rootMargin: '240px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [q, hasMore, loading, items.length])

  function onSubmit(e) {
    e.preventDefault()
    const next = input.trim()
    if (!next) return
    navigate(`/search?q=${encodeURIComponent(next)}`)
  }

  return (
    <section className="mt-4 mb-4">
      <SeoHead
        title={q ? `${t.searchPage}: ${q} | ${settings?.siteName || 'কৃষিকাগজ'}` : `${t.searchPage} | ${settings?.siteName || 'কৃষিকাগজ'}`}
        description={q ? `"${q}"` : t.searchPage}
        siteName={settings?.siteName || 'কৃষিকাগজ'}
        noIndex
      />
      <div className="container">
        <div className="common-border-box">
          <div className="section-title-flex">
            <h3>{t.searchPage}</h3>
          </div>
          <form onSubmit={onSubmit} className="p-3 d-flex gap-2">
            <input
              className="form-control"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.search}
            />
            <button type="submit" className="btn btn-primary">
              {t.searchBtn}
            </button>
          </form>
          {loading && <p className="p-3 text-muted">{t.searching}</p>}
          {error && <p className="p-3 text-danger">{error}</p>}
          {!loading && q && !items.length && <p className="p-3">{t.noResults}</p>}
          <div className="row px-2 pb-3">
            {items.map((item) => {
              const dateStr = item.publishedAt ? formatBnDate(item.publishedAt, lang) : item.date
              return (
                <div key={item.id} className="col-md-6">
                  <div className="news-list">
                    <Link to={item.path || `/news/${item.slug || item.id}`} className="row g-2">
                      <div className="col-4">
                        <div className="img-zoom-hover">
                          <SafeImage src={item.image} alt={text(item.title, item.titleEn)} width={320} />
                        </div>
                      </div>
                      <div className="col-8">
                        <h4 className="title">{text(item.title, item.titleEn)}</h4>
                        {dateStr && <span>{dateStr}</span>}
                      </div>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
          {q && items.length > 0 ? (
            <div ref={moreRef} className="px-3 pb-3">
              {loadingMore ? <p className="text-muted mb-0">{t.loading}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
