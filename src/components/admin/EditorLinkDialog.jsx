import { useEffect, useState } from 'react'

export default function EditorLinkDialog({
  open,
  initialUrl = '',
  initialText = '',
  initialNewTab = true,
  isEdit = false,
  onClose,
  onSave,
  onRemove,
}) {
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [openInNewTab, setOpenInNewTab] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return undefined
    setUrl(initialUrl || '')
    setText(initialText || '')
    setOpenInNewTab(initialNewTab !== false)
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
  }, [open, initialUrl, initialText, initialNewTab, onClose])

  if (!open) return null

  function handleSubmit(e) {
    e.preventDefault()
    const trimmedUrl = url.trim()
    if (!trimmedUrl) {
      setError('অনুগ্রহ করে একটি বৈধ URL লিখুন')
      return
    }

    // Auto prepend https:// if missing and not mailto/tel/relative
    let finalUrl = trimmedUrl
    if (!/^(https?:\/\/|\/\/|mailto:|tel:|\/|#)/i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`
    }

    onSave({
      url: finalUrl,
      text: text.trim() || finalUrl,
      openInNewTab,
    })
    onClose()
  }

  return (
    <div className="media-picker-overlay" onClick={onClose} role="presentation">
      <div
        className="media-picker-dialog"
        style={{ maxWidth: '520px' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-link-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="media-picker-head">
          <h3 id="editor-link-title">{isEdit ? 'লিংক সম্পাদনা করুন' : 'হাইপারলিংক যোগ করুন (Hyperlink)'}</h3>
          <button type="button" className="media-picker-close" aria-label="বন্ধ করুন" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error ? <div className="admin-alert admin-alert-error" style={{ margin: 0, padding: '8px 12px', fontSize: '13px' }}>{error}</div> : null}

          <div className="admin-form-group" style={{ margin: 0 }}>
            <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block', fontSize: '14px' }}>
              Link URL <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                if (error) setError('')
              }}
              placeholder="https://example.com বা /category/..."
              autoFocus
              required
              style={{ width: '100%' }}
            />
          </div>

          <div className="admin-form-group" style={{ margin: 0 }}>
            <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block', fontSize: '14px' }}>
              Link Text (প্রদর্শিত লেখা)
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="লিংকের জন্য প্রদর্শিত টেক্সট"
              style={{ width: '100%' }}
            />
            <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              খালি রাখলে URL নিজেই টেক্সট হিসেবে প্রদর্শিত হবে
            </small>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <input
              type="checkbox"
              id="editor-link-target"
              checked={openInNewTab}
              onChange={(e) => setOpenInNewTab(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="editor-link-target" style={{ cursor: 'pointer', fontSize: '14px', userSelect: 'none' }}>
              নতুন ট্যাবে ওপেন করুন (Open in new tab)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
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
                  <i className="fa-solid fa-link-slash" style={{ marginRight: '6px' }} />
                  লিংক মুছুন
                </button>
              ) : null}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
                বাতিল
              </button>
              <button type="submit" className="admin-btn admin-btn-primary">
                {isEdit ? 'আপডেট করুন' : 'লিংক যুক্ত করুন'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
