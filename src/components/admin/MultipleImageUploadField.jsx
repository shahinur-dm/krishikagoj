import { useRef, useState } from 'react'
import { api } from '../../api/client'
import SafeImage from '../SafeImage'

export default function MultipleImageUploadField({
  label = 'অতিরিক্ত ছবি (একাধিক)',
  value = [],
  onChange,
  hint = 'JPG, PNG, WEBP — একাধিক ছবি আপলোড করতে পারবেন'
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function onFile(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setError('')
    setUploading(true)
    
    try {
      const uploadedUrls = []
      for (const file of files) {
        const res = await api.uploadImage(file)
        uploadedUrls.push(res.url)
      }
      onChange([...value, ...uploadedUrls])
    } catch (err) {
      setError(err.message || 'আপলোড ব্যর্থ')
    } finally {
      setUploading(false)
    }
  }

  function removeImage(index) {
    const newArr = [...value]
    newArr.splice(index, 1)
    onChange(newArr)
  }

  return (
    <div className="admin-form-group image-upload-field">
      <label>{label}</label>

      {value.length > 0 ? (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {value.map((url, i) => (
            <div key={i} style={{ position: 'relative', border: '1px solid #ddd', padding: '4px', borderRadius: '4px' }}>
              <SafeImage src={url} alt={`preview ${i}`} style={{ height: '80px', width: 'auto', display: 'block' }} />
              <button
                type="button"
                className="admin-btn admin-btn-sm admin-btn-danger"
                style={{ position: 'absolute', top: '-8px', right: '-8px', padding: '2px 6px', borderRadius: '50%' }}
                onClick={() => removeImage(i)}
              >
                &times;
              </button>
            </div>
          ))}
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
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        hidden
        onChange={onFile}
      />

      <p className="image-upload-hint">{hint}</p>
      {error ? <p className="image-upload-error">{error}</p> : null}
    </div>
  )
}
