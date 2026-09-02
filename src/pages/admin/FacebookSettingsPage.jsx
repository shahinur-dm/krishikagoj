import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useLang } from '../../context/LanguageContext'

export default function FacebookSettingsPage() {
  const { isEn } = useLang()
  const [pageId, setPageId] = useState('')
  const [pageAccessToken, setPageAccessToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [hasExistingToken, setHasExistingToken] = useState(false)
  const [isEnvFallback, setIsEnvFallback] = useState(false)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const [connectionStatus, setConnectionStatus] = useState('idle') // 'idle' | 'connected' | 'invalid' | 'missing'
  const [connectedPageName, setConnectedPageName] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const data = await api.getFacebookSettings()
      if (data) {
        setPageId(data.pageId || '')
        setHasExistingToken(Boolean(data.hasToken))
        setIsEnvFallback(Boolean(data.isEnvFallback))
        if (!data.pageId || !data.hasToken) {
          setConnectionStatus('missing')
        }
      }
    } catch (err) {
      setError(err.message || 'সেটিংস লোড করতে সমস্যা হয়েছে')
    }
  }

  async function onSave(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)
    try {
      const payload = {
        pageId: pageId.trim(),
        pageAccessToken: pageAccessToken.trim(),
      }
      const res = await api.saveFacebookSettings(payload)
      setPageId(res.pageId || '')
      setHasExistingToken(Boolean(res.hasToken))
      setPageAccessToken('')
      setMessage(res.message || (isEn ? 'Facebook settings saved successfully' : 'Facebook সেটিংস সফলভাবে সেভ হয়েছে'))
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'সেভ করতে সমস্যা হয়েছে')
    } finally {
      setSaving(false)
    }
  }

  async function onTestConnection() {
    setError('')
    setMessage('')

    if (!pageId.trim()) {
      setError('Facebook Page ID সেট করা হয়নি')
      setConnectionStatus('missing')
      return
    }
    if (!pageAccessToken.trim() && !hasExistingToken) {
      setError('Facebook Page Access Token সেট করা হয়নি')
      setConnectionStatus('missing')
      return
    }

    setTesting(true)
    try {
      const payload = {
        pageId: pageId.trim(),
        pageAccessToken: pageAccessToken.trim() || undefined,
      }
      const res = await api.testFacebookConnection(payload)
      if (res && res.connected) {
        setConnectionStatus('connected')
        setConnectedPageName(res.pageName || '')
        setMessage(res.message || 'Facebook Page connection সফল হয়েছে')
        setTimeout(() => setMessage(''), 4000)
      } else {
        setConnectionStatus('invalid')
        setError(res?.message || 'Facebook credentials সঠিক নয়')
      }
    } catch (err) {
      setConnectionStatus('invalid')
      setError(err.message || 'Facebook credentials সঠিক নয়')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div>
      {message ? <div className="admin-alert admin-alert-success">{message}</div> : null}
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}

      <div className="admin-card">
        <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>{isEn ? 'Facebook Page Settings' : 'Facebook Page সেটিংস'}</h3>
          {connectionStatus === 'connected' ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: '#dcfce7',
                color: '#15803d',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <i className="fa-solid fa-circle-check" />
              {connectedPageName ? `Connected: ${connectedPageName}` : 'Connected'}
            </span>
          ) : connectionStatus === 'invalid' ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: '#fee2e2',
                color: '#b91c1c',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <i className="fa-solid fa-circle-xmark" />
              Invalid Credentials
            </span>
          ) : hasExistingToken && pageId ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: '#f1f5f9',
                color: '#475569',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <i className="fa-brands fa-facebook" style={{ color: '#1877f2' }} />
              Configured {isEnvFallback ? '(.env)' : ''}
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: '#fef3c7',
                color: '#b45309',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <i className="fa-solid fa-triangle-exclamation" />
              Not Configured
            </span>
          )}
        </div>

        <div className="admin-card-body">
          <form onSubmit={onSave}>
            <div className="admin-form-group">
              <label>
                Facebook Page ID <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                placeholder="e.g. 100089283746152"
                required
              />
              <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.82rem' }}>
                আপনার ফেসবুক পেজের ইউনিক সংখ্যাসূচক Page ID দিন।
              </small>
            </div>

            <div className="admin-form-group">
              <label>
                Facebook Page Access Token <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showToken ? 'text' : 'password'}
                  value={pageAccessToken}
                  onChange={(e) => setPageAccessToken(e.target.value)}
                  placeholder={
                    hasExistingToken
                      ? '•••••••••••••••••••••••••••••••• (টোকেন সংরক্ষিত আছে, পরিবর্তন করতে নতুন টোকেন লিখুন)'
                      : 'Enter Permanent Page Access Token'
                  }
                  style={{ paddingRight: '45px', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowToken((prev) => !prev)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontSize: '1rem',
                  }}
                  title={showToken ? 'Hide token' : 'Show token'}
                >
                  <i className={`fa-solid fa-${showToken ? 'eye-slash' : 'eye'}`} />
                </button>
              </div>
              <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.82rem' }}>
                {hasExistingToken
                  ? 'একটি অ্যাক্সেস টোকেন নিরাপদে ডাটাবেজে সংরক্ষিত রয়েছে। নতুন টোকেন দিয়ে প্রতিস্থাপন করতে এখানে পেস্ট করুন।'
                  : 'Facebook Graph API / Meta Developers থেকে প্রাপ্ত Page Access Token এখানে দিন।'}
              </small>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={saving || testing}>
                {saving ? (isEn ? 'Saving...' : 'সেভ হচ্ছে...') : isEn ? 'Save Settings' : 'Save Settings'}
              </button>

              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={saving || testing}
                onClick={onTestConnection}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {testing ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" />
                    {isEn ? 'Testing...' : 'পরীক্ষা হচ্ছে...'}
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-plug-circle-check" />
                    {isEn ? 'Test Connection' : 'Test Connection'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
