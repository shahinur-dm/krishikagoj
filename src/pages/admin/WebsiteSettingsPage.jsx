import { useState } from 'react'
import { SettingsShell, useSettings } from './settingsShared'
import ImageUploadField from '../../components/admin/ImageUploadField'

export default function WebsiteSettingsPage() {
  const { settings, loading, error, save, updateField } = useSettings()
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /></div>
  if (!settings) return <div className="admin-alert admin-alert-error">{error}</div>

  async function handleSave() {
    setSaving(true)
    setFormError('')
    try {
      await save({
        siteName: settings.siteName,
        tagline: settings.tagline,
        hotline: settings.hotline,
        logo: settings.logo,
        mobileLogo: settings.mobileLogo,
        favicon: settings.favicon,
        defaultNewsImage: settings.defaultNewsImage,
        email: settings.email,
        phoneBn: settings.phoneBn,
        phoneEn: settings.phoneEn,
        addressBn: settings.addressBn,
        addressEn: settings.addressEn,
        chiefAdvisor: settings.chiefAdvisor,
        publisher: settings.publisher,
        managingEditor: settings.managingEditor,
        messageEditor: settings.messageEditor,
        aboutUs: settings.aboutUs,
        terms: settings.terms,
        privacy: settings.privacy,
        facebookPage: settings.facebookPage,
        themeColor: settings.themeColor,
      })
      setMessage('সেটিংস সংরক্ষণ হয়েছে')
      setTimeout(() => setMessage(''), 2500)
    } catch (err) {
      setFormError(err.message || 'সংরক্ষণ ব্যর্থ')
    } finally {
      setSaving(false)
    }
  }

  const textFields = [
    ['siteName', 'সাইটের নাম'],
    ['tagline', 'ট্যাগলাইন'],
    ['hotline', 'হটলাইন'],
    ['email', 'ইমেইল'],
    ['phoneBn', 'ফোন (বাংলা)'],
    ['phoneEn', 'ফোন (ইংরেজি)'],
    ['addressBn', 'ঠিকানা (বাংলা)'],
    ['addressEn', 'ঠিকানা (ইংরেজি)'],
    ['chiefAdvisor', 'প্রধান উপদেষ্টা'],
    ['publisher', 'প্রকাশক'],
    ['managingEditor', 'ব্যবস্থাপনা সম্পাদক'],
    ['messageEditor', 'বার্তা সম্পাদক'],
    ['facebookPage', 'ফেসবুক পেজ'],
  ]

  return (
    <SettingsShell title="ওয়েবসাইট সেটিং" onSave={handleSave} message={message} error={formError} saving={saving}>
      <div className="admin-form-row">
        {textFields.map(([key, label]) => (
          <div key={key} className="admin-form-group">
            <label>{label}</label>
            <input value={settings[key] || ''} onChange={(e) => updateField(key, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="admin-form-group">
        <label>থিম কালার (Theme Color)</label>
        <input 
          type="color" 
          value={settings.themeColor || '#03228f'} 
          onChange={(e) => updateField('themeColor', e.target.value)} 
          style={{ width: '100px', height: '40px', padding: '0', cursor: 'pointer' }}
        />
      </div>
      <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>ব্র্যান্ড ছবি (আপলোড)</p>
      <div className="admin-form-row">
        <ImageUploadField
          label="লোগো"
          value={settings.logo || ''}
          onChange={(url) => updateField('logo', url)}
        />
        <ImageUploadField
          label="মোবাইল লোগো"
          value={settings.mobileLogo || ''}
          onChange={(url) => updateField('mobileLogo', url)}
        />
        <ImageUploadField
          label="ফেভিকন"
          value={settings.favicon || ''}
          onChange={(url) => updateField('favicon', url)}
        />
        <ImageUploadField
          label="Default News Image"
          value={settings.defaultNewsImage || '/placeholder-news.svg'}
          onChange={(url) => updateField('defaultNewsImage', url)}
          libraryPicker
          hint="খবরের ছবি না থাকলে আর্টিকেল ডিটেইলসে এই ছবি দেখাবে"
        />
      </div>

      <div className="admin-form-group">
        <label>আমাদের সম্পর্কে</label>
        <textarea
          value={settings.aboutUs || ''}
          onChange={(e) => updateField('aboutUs', e.target.value)}
          rows={4}
        />
      </div>
    </SettingsShell>
  )
}
