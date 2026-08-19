import { useState } from 'react'
import { SettingsShell, useSettings } from './settingsShared'

export default function LiveTvPage() {
  const { settings, loading, save, updateField } = useSettings()
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  if (loading || !settings) return <div className="admin-loading"><div className="admin-spinner" /></div>

  async function handleSave() {
    setSaving(true)
    await save({ liveTvLink: settings.liveTvLink, liveTvEmbed: settings.liveTvEmbed })
    setMessage('সংরক্ষণ হয়েছে')
    setSaving(false)
  }

  return (
    <SettingsShell title="লাইভ টিভি" onSave={handleSave} message={message} saving={saving}>
      <div className="admin-form-group">
        <label>লাইভ টিভি লিংক</label>
        <input value={settings.liveTvLink || ''} onChange={(e) => updateField('liveTvLink', e.target.value)} />
      </div>
      <div className="admin-form-group">
        <label>এমবেড কোড / URL</label>
        <textarea
          value={settings.liveTvEmbed || ''}
          onChange={(e) => updateField('liveTvEmbed', e.target.value)}
          rows={4}
        />
      </div>
    </SettingsShell>
  )
}
