import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import SafeImage from '../SafeImage'

const PAGE_SIZE = 24

export default function MediaPickerDialog({ open, currentUrl = '', onClose, onSelect }) {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [picked, setPicked] = useState(null)

  useEffect(() => {
    if (!open) return undefined
    setPicked(null)
    setPage(1)
    setSearch('')
    setQ('')
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return undefined
    let alive = true
    setLoading(true)
    setError('')
    api
      .listMedia({ page, limit: PAGE_SIZE, q: search })
      .then((data) => {
        if (!alive) return
        setItems(data.items || [])
        setPages(data.pages || 1)
        setTotal(data.total || 0)
      })
      .catch((err) => {
        if (alive) setError(err.message || 'মিডিয়া লোড ব্যর্থ')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [open, page, search])

  if (!open) return null

  function confirm() {
    if (!picked?.url) return
    onSelect(picked.url)
    onClose()
  }

  return (
    <div className="media-picker-overlay" onClick={onClose} role="presentation">
      <div
        className="media-picker-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-picker-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="media-picker-head">
          <h3 id="media-picker-title">ছবি নির্বাচন করুন</h3>
          <button type="button" className="media-picker-close" aria-label="বন্ধ করুন" onClick={onClose}>
            ×
          </button>
        </div>

        <form
          className="media-picker-search"
          onSubmit={(event) => {
            event.preventDefault()
            setPage(1)
            setSearch(q.trim())
          }}
        >
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ছবি খুঁজুন..."
          />
          <button type="submit" className="admin-btn admin-btn-sm admin-btn-primary">
            খুঁজুন
          </button>
        </form>

        <div className="media-picker-grid-wrap">
          {loading ? <p className="media-picker-status">লোড হচ্ছে...</p> : null}
          {error ? <p className="media-picker-error">{error}</p> : null}
          {!loading && !items.length ? (
            <p className="media-picker-status">কোনো আপলোড করা ছবি পাওয়া যায়নি</p>
          ) : null}
          <div className="media-picker-grid">
            {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`media-picker-cell${picked?.id === item.id ? ' is-selected' : ''}`}
                  onClick={() => setPicked(item)}
                  title={item.filename}
                >
                  <SafeImage src={item.url} alt={item.filename || 'media'} />
                  {picked?.id === item.id ? <span className="media-picker-check">✓</span> : null}
                </button>
              ))}
          </div>
        </div>

        <div className="media-picker-foot">
          <span className="media-picker-meta">
            {total ? `${total}টি ছবি` : ''}
            {pages > 1 ? ` · পৃষ্ঠা ${page}/${pages}` : ''}
          </span>
          <div className="media-picker-pager">
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-secondary"
              disabled={page <= 1 || loading}
              onClick={() => setPage((n) => Math.max(1, n - 1))}
            >
              আগের
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-secondary"
              disabled={page >= pages || loading}
              onClick={() => setPage((n) => n + 1)}
            >
              পরের
            </button>
            <button type="button" className="admin-btn admin-btn-sm admin-btn-secondary" onClick={onClose}>
              বাতিল
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-primary"
              disabled={!picked?.url}
              onClick={confirm}
            >
              ছবি ব্যবহার করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
