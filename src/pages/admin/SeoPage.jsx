import { useState } from 'react'
import { SettingsShell, useSettings } from './settingsShared'
import ImageUploadField from '../../components/admin/ImageUploadField'

const seoFields = [
  ['metaTitle', 'মেটা টাইটেল'],
  ['metaKeyword', 'মেটা কীওয়ার্ড'],
  ['metaDescription', 'মেটা বিবরণ'],
  ['metaAuthor', 'মেটা অথর'],
  ['googleAnalytics', 'গুগল অ্যানালিটিক্স (G-XXXX / স্ক্রিপ্ট)'],
  ['googleVerification', 'গুগল সাইট ভেরিফিকেশন কোড'],
]

const adFields = [
  ['horizontal1', 'নেভবারের পর (ব্যানার)'],
  ['bottomPopup', 'ওপেনে নিচের অ্যাড বক্স'],
  ['horizontal2', 'হরাইজন্টাল ২'],
  ['horizontal3', 'হরাইজন্টাল ৩'],
  ['horizontalBig1', 'বড় হরাইজন্টাল ১'],
  ['vertical', 'ভার্টিকাল'],
]

export default function SeoPage() {
  const { settings, loading, save, updateNested } = useSettings()
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  if (loading || !settings) return <div className="admin-loading"><div className="admin-spinner" /></div>

  async function handleSave() {
    setSaving(true)
    await save({ seo: settings.seo })
    setMessage('সংরক্ষণ হয়েছে — সাইটে SEO snippets সক্রিয়')
    setSaving(false)
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://krishi-kagos.vercel.app'

  return (
    <SettingsShell title="এসইও ও বিজ্ঞাপন" onSave={handleSave} message={message} saving={saving}>
      <div className="admin-alert admin-alert-success" style={{ marginBottom: '1rem' }}>
        <strong>On-page SEO snippets ইনস্টল করা আছে।</strong>
        <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem' }}>
          <li>প্রতি পেজে Title, Description, Canonical, Open Graph, Twitter Card</li>
          <li>খবরে NewsArticle JSON-LD · হোমে Organization schema</li>
          <li>নতুন পোস্টে slug + excerpt অটো SEO-friendly</li>
          <li>
            Sitemap: <a href={`${origin}/api/seo/sitemap.xml`} target="_blank" rel="noreferrer">{origin}/api/seo/sitemap.xml</a>
          </li>
          <li>
            Robots: <a href={`${origin}/robots.txt`} target="_blank" rel="noreferrer">{origin}/robots.txt</a>
          </li>
        </ul>
      </div>

      <p style={{ fontWeight: 600 }}>সাইট ডিফল্ট এসইও</p>
      <div className="admin-form-row">
        {seoFields.map(([key, label]) => (
          <div key={key} className="admin-form-group">
            <label>{label}</label>
            {key === 'metaDescription' ? (
              <textarea
                value={settings.seo?.[key] || ''}
                onChange={(e) => updateNested('seo', key, e.target.value)}
                rows={3}
              />
            ) : (
              <input
                value={settings.seo?.[key] || ''}
                onChange={(e) => updateNested('seo', key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <ImageUploadField
        label="ডিফল্ট OG / শেয়ার ছবি"
        value={settings.seo?.ogImage || ''}
        onChange={(url) => updateNested('seo', 'ogImage', url)}
        hint="সোশ্যাল শেয়ারে দেখাবে — আপলোড করুন"
      />

      <p style={{ fontWeight: 600, marginTop: '1rem' }}>বিজ্ঞাপন কোড</p>
      <div className="admin-form-row">
        {adFields.map(([key, label]) => (
          <div key={key} className="admin-form-group">
            <label>{label}</label>
            <textarea
              value={settings.seo?.[key] || ''}
              onChange={(e) => updateNested('seo', key, e.target.value)}
              rows={2}
            />
          </div>
        ))}
      </div>
    </SettingsShell>
  )
}
