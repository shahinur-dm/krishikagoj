import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useLang } from '../../context/LanguageContext'

export default function AiSettingsPage() {
  const { isEn } = useLang()
  const [form, setForm] = useState({
    apiKey: '',
    model: 'gpt-4o',
    temperature: '0.7',
    maxTokens: '500',
    promptTemplate: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.getAiSettings().then(setForm).catch((err) => setError(err.message))
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const saved = await api.saveAiSettings(form)
      setForm(saved)
      setMessage(isEn ? 'Settings saved' : 'সেটিংস সেভ হয়েছে')
      setTimeout(() => setMessage(''), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function field(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div>
      {message ? <div className="admin-alert admin-alert-success">{message}</div> : null}
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>{isEn ? 'AI Writer Settings' : 'AI Writer Settings'}</h3>
        </div>
        <div className="admin-card-body">
          <form onSubmit={onSubmit}>
            <div className="admin-form-group">
              <label>API key</label>
              <input value={form.apiKey} onChange={(e) => field('apiKey', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Model</label>
              <input value={form.model} onChange={(e) => field('model', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Temperature</label>
              <input value={form.temperature} onChange={(e) => field('temperature', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Max Tokens</label>
              <input value={form.maxTokens} onChange={(e) => field('maxTokens', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Prompt Template</label>
              <textarea
                rows={6}
                value={form.promptTemplate}
                onChange={(e) => field('promptTemplate', e.target.value)}
              />
            </div>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              {saving ? (isEn ? 'Saving...' : 'সেভ হচ্ছে...') : isEn ? 'Save Settings' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
