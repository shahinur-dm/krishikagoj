import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import ImageUploadField from '../../components/admin/ImageUploadField'
import { LOGO_SRC } from '../../components/BrandLogo'
import { useLang } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'

export default function LoginLogoPage() {
  const { user } = useAuth()
  const { isEn } = useLang()
  const [current, setCurrent] = useState('')
  const [siteLogo, setSiteLogo] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const s = await api.getSettings()
    setCurrent(s?.loginLogo || '')
    setSiteLogo(s?.logo || '')
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  async function persist(nextUrl) {
    const previous = current
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const data = await api.updateLoginLogo(nextUrl || '')
      setCurrent(data.loginLogo || '')
      setMessage(isEn ? 'Login logo saved' : 'লগইন লোগো সংরক্ষণ হয়েছে')
      setTimeout(() => setMessage(''), 2500)
    } catch (err) {
      setCurrent(previous)
      setError(err.message || (isEn ? 'Upload failed — existing logo kept' : 'আপলোড ব্যর্থ — আগের লোগো আছে'))
    } finally {
      setSaving(false)
    }
  }

  const preview = current || siteLogo || LOGO_SRC

  if (user?.role !== 'superadmin') {
    return <Navigate to="/admin/home" replace />
  }

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3>{isEn ? 'Login logo' : 'লগইন লোগো'}</h3>
      </div>
      <div className="admin-card-body">
        <p className="text-muted">
          {isEn
            ? 'This logo appears only on the admin login box. The public website logo is unchanged.'
            : 'এই লোগো শুধু অ্যাডমিন লগইন বক্সে দেখাবে। পাবলিক সাইটের লোগো বদলাবে না।'}
        </p>
        {message && <div className="admin-alert admin-alert-success">{message}</div>}
        {error && <div className="admin-alert admin-alert-error">{error}</div>}

        <div className="login-logo-admin-preview">
          <span>{isEn ? 'Current preview' : 'বর্তমান প্রিভিউ'}</span>
          <div className="login-logo-admin-frame">
            <img src={preview} alt="Login logo" />
          </div>
        </div>

        <ImageUploadField
          label={isEn ? 'Upload / change login logo' : 'লগইন লোগো আপলোড / পরিবর্তন'}
          value={current}
          onChange={persist}
          libraryPicker
          hint={saving ? (isEn ? 'Saving…' : 'সংরক্ষণ হচ্ছে...') : isEn ? 'JPG, PNG, WEBP, GIF or SVG' : 'JPG, PNG, WEBP, GIF বা SVG'}
        />

        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          style={{ marginTop: 12 }}
          disabled={saving || !current}
          onClick={() => persist('')}
        >
          {isEn ? 'Remove / reset to default' : 'রিসেট / ডিফল্ট লোগো'}
        </button>
      </div>
    </div>
  )
}
