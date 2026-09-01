import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client'
import SafeImage from '../SafeImage'

const PAGE_SIZE = 18

export default function EditorImageDialog({
  open,
  initialUrl = '',
  initialAlt = '',
  isEdit = false,
  onClose,
  onInsert,
  onRemove,
}) {
  const [tab, setTab] = useState('library') // 'library' | 'upload'
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedUrl, setSelectedUrl] = useState('')
  const [altText, setAltText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    setSelectedUrl(initialUrl || '')
    setAltText(initialAlt || '')
    setTab(initialUrl ? 'library' : 'library')
    setPage(1)
    setSearch('')
    setQ('')
    setError('')

    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, initialUrl, initialAlt, onClose])

  useEffect(() => {
    if (!open || tab !== 'library') return undefined
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
  }, [open, tab, page, search])

  if (!open) return null

  async function handleFileUpload(file) {
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const res = await api.uploadImage(file)
      setSelectedUrl(res.url)
      // Switch back to preview/selected view
    } catch (err) {
      setError(err.message || 'ছবি আপলোড ব্যর্থ হয়েছে')
    } finally {
      setUploading(false)
    }
  }

  function onFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) handleFileUpload(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }

  function handleInsert() {
    if (!selectedUrl) {
      setError('অনুগ্রহ করে একটি ছবি নির্বাচন বা আপলোড করুন')
      return
    }
    onInsert({
      url: selectedUrl,
      alt: altText.trim(),
    })
    onClose()
  }

  return (
    <div className="media-picker-overlay" onClick={onClose} role="presentation">
      <div
        className="media-picker-dialog"
        style={{ maxWidth: '780px', width: '95%' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-image-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="media-picker-head">
          <h3 id="editor-image-title">
            <i className="fa-solid fa-image" style={{ marginRight: '8px', color: '#0284c7' }} />
            {isEdit ? 'ছবি পরিবর্তন / সম্পাদনা' : 'আর্টিকেলে ছবি যোগ করুন (Insert Image)'}
          </h3>
          <button type="button" className="media-picker-close" aria-label="বন্ধ করুন" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Option Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f8fafc', padding: '0 16px' }}>
          <button
            type="button"
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              color: tab === 'library' ? '#03228f' : '#64748b',
              borderBottom: tab === 'library' ? '3px solid #03228f' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={() => {
              setTab('library')
              setError('')
            }}
          >
            <i className="fa-solid fa-images" />
            Photo Collection (ছবির কালেকশন)
          </button>

          <button
            type="button"
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              color: tab === 'upload' ? '#03228f' : '#64748b',
              borderBottom: tab === 'upload' ? '3px solid #03228f' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={() => {
              setTab('upload')
              setError('')
            }}
          >
            <i className="fa-solid fa-arrow-up-from-bracket" />
            Upload from Device (ডিভাইস থেকে আপলোড)
          </button>
        </div>

        {error ? (
          <div style={{ margin: '10px 16px 0' }} className="admin-alert admin-alert-error">
            {error}
          </div>
        ) : null}

        {/* Tab 1: Photo Collection */}
        {tab === 'library' ? (
          <>
            <form
              className="media-picker-search"
              onSubmit={(e) => {
                e.preventDefault()
                setPage(1)
                setSearch(q.trim())
              }}
            >
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="কালেকশন থেকে ছবি খুঁজুন..."
              />
              <button type="submit" className="admin-btn admin-btn-sm admin-btn-primary">
                খুঁজুন
              </button>
            </form>

            <div className="media-picker-grid-wrap" style={{ minHeight: '260px', maxHeight: '340px' }}>
              {loading ? <p className="media-picker-status">ছবি লোড হচ্ছে...</p> : null}
              {!loading && !items.length ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                  <i className="fa-regular fa-image" style={{ fontSize: '32px', marginBottom: '8px', display: 'block' }} />
                  কোনো ছবি পাওয়া যায়নি। &ldquo;Upload from Device&rdquo; ট্যাব থেকে নতুন ছবি আপলোড করুন।
                </div>
              ) : null}
              <div className="media-picker-grid">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`media-picker-cell${selectedUrl === item.url ? ' is-selected' : ''}`}
                    onClick={() => {
                      setSelectedUrl(item.url)
                      setError('')
                    }}
                    title={item.filename}
                  >
                    <SafeImage src={item.url} alt={item.filename || 'media'} />
                    {selectedUrl === item.url ? <span className="media-picker-check">✓</span> : null}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', background: '#fafafa', borderTop: '1px solid #f1f5f9' }}>
              <span className="media-picker-meta" style={{ margin: 0 }}>
                {total ? `মোট ${total}টি ছবি` : ''}
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
              </div>
            </div>
          </>
        ) : null}

        {/* Tab 2: Upload from Device */}
        {tab === 'upload' ? (
          <div style={{ padding: '20px 16px' }}>
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: dragOver ? '2px dashed #03228f' : '2px dashed #cbd5e1',
                background: dragOver ? '#eff6ff' : '#f8fafc',
                borderRadius: '12px',
                padding: '36px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '42px', color: '#03228f', marginBottom: '12px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600 }}>
                {uploading ? 'ছবি আপলোড হচ্ছে...' : 'ছবি আপলোড করতে ক্লিক করুন অথবা টেনে আনুন (Drag & Drop)'}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                JPG, PNG, WEBP, GIF — সর্বোচ্চ ৫MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={onFileChange}
              />
            </div>
          </div>
        ) : null}

        {/* Selected Image Preview & Alt / Caption Details */}
        {selectedUrl ? (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', background: '#f8fafc', display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', flexShrink: 0, background: '#fff' }}>
              <SafeImage src={selectedUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Image Caption / Alt Text (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="ছবির বিবরণ বা ক্যাপশন লিখুন..."
                style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
              />
            </div>
          </div>
        ) : null}

        {/* Footer Actions */}
        <div className="media-picker-foot" style={{ marginTop: 0 }}>
          <div>
            {isEdit && onRemove ? (
              <button
                type="button"
                className="admin-btn admin-btn-sm admin-btn-danger"
                onClick={() => {
                  onRemove()
                  onClose()
                }}
              >
                <i className="fa-solid fa-trash" style={{ marginRight: '4px' }} />
                আর্টিকেল থেকে মুছুন
              </button>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
              বাতিল
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={!selectedUrl || uploading}
              onClick={handleInsert}
            >
              <i className="fa-solid fa-check" style={{ marginRight: '6px' }} />
              {isEdit ? 'ছবি আপডেট করুন' : 'আর্টিকেলে যোগ করুন (Insert)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
