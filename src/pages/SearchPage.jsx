import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, mapArticle } from '../api/client'
import SafeImage from '../components/SafeImage'
import SeoHead from '../components/SeoHead'
import { useSiteData } from '../context/SiteDataContext'

export default function SearchPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const q = (params.get('q') || '').trim()
  const { settings } = useSiteData()
  const [input, setInput] = useState(q)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setInput(q)
    if (!q) {
      setItems([])
      return undefined
    }
    let alive = true
    setLoading(true)
    api
      .getArticles({ q, limit: '30' })
      .then((data) => {
        if (alive) setItems((data || []).map(mapArticle))
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

  function onSubmit(e) {
    e.preventDefault()
    const next = input.trim()
    if (!next) return
    navigate(`/search?q=${encodeURIComponent(next)}`)
  }

  return (
    <section className="mt-4 mb-4">
      <SeoHead
        title={q ? `খোঁজ: ${q} | ${settings?.siteName || 'কৃষিকাগজ'}` : `খোঁজ | ${settings?.siteName || 'কৃষিকাগজ'}`}
        description={q ? `"${q}" সম্পর্কিত খবরের ফলাফল` : 'কৃষিকাগজে খবর খুঁজুন'}
        siteName={settings?.siteName || 'কৃষিকাগজ'}
        noIndex
      />
      <div className="container">
        <div className="common-border-box">
          <div className="section-title-flex">
            <h3>খোঁজ</h3>
          </div>
          <form onSubmit={onSubmit} className="p-3 d-flex gap-2">
            <input
              className="form-control"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="খবর খুঁজুন..."
            />
            <button type="submit" className="btn btn-primary">
              খুঁজুন
            </button>
          </form>
          {loading && <p className="p-3 text-muted">খুঁজছি...</p>}
          {error && <p className="p-3 text-danger">{error}</p>}
          {!loading && q && !items.length && <p className="p-3">কোনো ফলাফল পাওয়া যায়নি।</p>}
          <div className="row px-2 pb-3">
            {items.map((item) => (
              <div key={item.id} className="col-md-6">
                <div className="news-list">
                  <Link to={item.path || `/news/${item.slug || item.id}`} className="row g-2">
                    <div className="col-4">
                      <div className="img-zoom-hover">
                        <SafeImage src={item.image} alt={item.title} width={320} />
                      </div>
                    </div>
                    <div className="col-8">
                      <h4 className="title">{item.title}</h4>
                      {item.date && <span>{item.date}</span>}
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
