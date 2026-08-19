import { useState } from 'react'
import { SettingsShell, useSettings } from './settingsShared'

const links = [
  ['facebook', 'ফেসবুক'],
  ['twitter', 'টুইটার'],
  ['instagram', 'ইনস্টাগ্রাম'],
  ['linkedin', 'লিংকডইন'],
  ['youtube', 'ইউটিউব'],
]

export default function SocialPage() {
  const { settings, loading, save, updateField, updateNested } = useSettings()
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  if (loading || !settings) return <div className="admin-loading"><div className="admin-spinner" /></div>

  async function handleSave() {
    setSaving(true)
    await save({ social: settings.social, facebookPage: settings.facebookPage })
    setMessage('সংরক্ষণ হয়েছে')
    setSaving(false)
  }

  return (
    <SettingsShell title="সোশ্যাল মিডিয়া" onSave={handleSave} message={message} saving={saving}>
      <div className="admin-form-group">
        <label>ফেসবুক পেজ</label>
        <input
          value={settings.facebookPage || ''}
          onChange={(e) => updateField('facebookPage', e.target.value)}
        />
      </div>
      <div className="admin-form-row">
        {links.map(([key, label]) => (
          <div key={key} className="admin-form-group">
            <label>{label}</label>
            <input
              value={settings.social?.[key] || ''}
              onChange={(e) => updateNested('social', key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </SettingsShell>
  )
}
