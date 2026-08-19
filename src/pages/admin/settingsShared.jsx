import { useEffect, useState } from 'react'
import { api } from '../../api/client'

export function useSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getSettings()
      .then(setSettings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function save(patch) {
    const updated = await api.updateSettings(patch)
    setSettings(updated)
    return updated
  }

  function updateField(key, value) {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  function updateNested(parent, key, value) {
    setSettings((s) => ({
      ...s,
      [parent]: { ...(s[parent] || {}), [key]: value },
    }))
  }

  return { settings, setSettings, loading, error, save, updateField, updateNested }
}

export function SettingsShell({ title, children, onSave, message, error, saving }) {
  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3>{title}</h3>
      </div>
      <div className="admin-card-body">
        {message && <div className="admin-alert admin-alert-success">{message}</div>}
        {error && <div className="admin-alert admin-alert-error">{error}</div>}
        {children}
        {onSave && (
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={onSave}
            disabled={saving}
            style={{ marginTop: '1rem' }}
          >
            {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </button>
        )}
      </div>
    </div>
  )
}
