import { useState } from 'react'
import { SettingsShell, useSettings } from './settingsShared'

const times = [
  ['fajr', 'ফজর'],
  ['johor', 'যোহর'],
  ['asor', 'আসর'],
  ['magrib', 'মাগরিব'],
  ['esha', 'এশা'],
  ['jummah', 'জুমা'],
]

export default function NamazPage() {
  const { settings, loading, save, updateNested } = useSettings()
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  if (loading || !settings) return <div className="admin-loading"><div className="admin-spinner" /></div>

  async function handleSave() {
    setSaving(true)
    await save({ namaz: settings.namaz })
    setMessage('সংরক্ষণ হয়েছে')
    setSaving(false)
  }

  return (
    <SettingsShell title="নামাজের সময়" onSave={handleSave} message={message} saving={saving}>
      <div className="admin-form-row">
        {times.map(([key, label]) => (
          <div key={key} className="admin-form-group">
            <label>{label}</label>
            <input
              value={settings.namaz?.[key] || ''}
              onChange={(e) => updateNested('namaz', key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </SettingsShell>
  )
}
