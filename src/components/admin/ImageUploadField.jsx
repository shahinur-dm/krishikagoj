import { useRef, useState } from 'react'
import { api } from '../../api/client'
import SafeImage from '../SafeImage'

/**
 * Upload-first image field. Optional URL fallback kept collapsed.
 */
export default function ImageUploadField({
  label = 'ছবি',
  value = '',
  onChange,
  required = false,
  hint = 'JPG, PNG, WEBP — সর্বোচ্চ ৪MB',
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [showUrl, setShowUrl] = useState(false)

  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const res = await api.uploadImage(file)
      onChange(res.url)
    } catch (err) {
      setError(err.message || 'আপলোড ব্যর্থ')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="admin-form-group image-upload-field">
      <label>
        {label}
        {required ? ' *' : ''}
      </label>

      {value ? (
        <div className="image-upload-preview">
          <div className="image-upload-preview-frame">
            <SafeImage src={value} alt="preview" />
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-secondary"
            onClick={() => onChange('')}
          >
            সরান
          </button>
        </div>
      ) : null}

      <div className="image-upload-actions">
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড করুন'}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-sm admin-btn-secondary"
          onClick={() => setShowUrl((v) => !v)}
        >
          {showUrl ? 'URL লুকান' : 'URL ব্যবহার'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        hidden
        onChange={onFile}
      />

      {showUrl ? (
        <input
          className="mt-2"
          type="url"
          placeholder="https://..."
          value={value?.startsWith('/api/media/') ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          required={required && !value}
        />
      ) : null}

      {required && !value ? (
        <input
          tabIndex={-1}
          aria-hidden="true"
          value=""
          required
          onChange={() => {}}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
        />
      ) : null}

      <p className="image-upload-hint">{hint}</p>
      {error ? <p className="image-upload-error">{error}</p> : null}
    </div>
  )
}
