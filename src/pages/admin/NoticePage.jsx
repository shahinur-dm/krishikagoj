import { useState } from 'react'
import { SettingsShell, useSettings } from './settingsShared'

export default function NoticePage() {
  const { settings, loading, save, updateField } = useSettings()
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  if (loading || !settings) return <div className="admin-loading"><div className="admin-spinner" /></div>

  async function handleSave() {
    setSaving(true)
    await save({ notice: settings.notice })
    setMessage('সংরক্ষণ হয়েছে')
    setSaving(false)
  }

  return (
    <SettingsShell title="নোটিশ" onSave={handleSave} message={message} saving={saving}>
      <div className="admin-form-group">
        <label>নোটিশ টেক্সট (টিকার)</label>
        <textarea
          value={settings.notice || ''}
          onChange={(e) => updateField('notice', e.target.value)}
          rows={4}
        />
      </div>
    </SettingsShell>
  )
}
