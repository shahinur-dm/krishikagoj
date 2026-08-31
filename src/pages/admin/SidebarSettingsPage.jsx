import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { refreshSiteData } from '../../context/SiteDataContext'
import { SettingsShell, useSettings } from './settingsShared'

const DEFAULT_SECTIONS = [
  { slug: 'bodoli', name: 'বদলি', defaultCategory: 'projukti', defaultEnabled: true },
  { slug: 'krishoker-kotha', name: 'কৃষকের কথা', defaultCategory: 'projukti', defaultEnabled: true },
  { slug: 'shikkha', name: 'কৃষি শিক্ষা', defaultCategory: 'projukti', defaultEnabled: true },
  { slug: 'gobeshona', name: 'কৃষি গবেষণা', defaultCategory: '', defaultEnabled: false },
  { slug: 'proshason', name: 'কৃষি প্রশাসন', defaultCategory: '', defaultEnabled: false },
  { slug: 'foshol', name: 'ফসল', defaultCategory: '', defaultEnabled: false },
  { slug: 'prani', name: 'প্রাণিসম্পদ', defaultCategory: '', defaultEnabled: false },
  { slug: 'uddokta', name: 'কৃষি উদ্যোক্তা', defaultCategory: '', defaultEnabled: false },
  { slug: 'motamot', name: 'মতামত', defaultCategory: '', defaultEnabled: false },
  { slug: 'bishesh', name: 'বিশেষ প্রতিবেদন', defaultCategory: '', defaultEnabled: false },
]

export default function SidebarSettingsPage() {
  const { settings, loading, error, save } = useSettings()
  const [categories, setCategories] = useState([])
  const [sidebars, setSidebars] = useState({})
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .getCategories()
      .then((cats) => setCategories(cats || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (settings) {
      setSidebars(settings.sectionSidebars || {})
    }
  }, [settings])

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
      </div>
    )
  }

  if (!settings) {
    return <div className="admin-alert admin-alert-error">{error || 'সেটিংস লোড করা যায়নি'}</div>
  }

  // Combine default sections with all available categories so admin can configure any page
  const allSectionsMap = new Map()
  DEFAULT_SECTIONS.forEach((s) => allSectionsMap.set(s.slug, s))
  categories.forEach((c) => {
    if (!allSectionsMap.has(c.slug)) {
      allSectionsMap.set(c.slug, {
        slug: c.slug,
        name: c.name,
        defaultCategory: '',
        defaultEnabled: false,
      })
    }
  })
  const sectionList = Array.from(allSectionsMap.values())

  function handleFieldChange(slug, field, value) {
    setSidebars((prev) => {
      const current = prev[slug] || {}
      return {
        ...prev,
        [slug]: {
          ...current,
          [field]: value,
        },
      }
    })
  }

  async function handleSave() {
    setSaving(true)
    setFormError('')
    try {
      await save({ sectionSidebars: sidebars })
      await refreshSiteData()
      setMessage('সাইডবার সেটিং সফলভাবে সংরক্ষণ করা হয়েছে')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setFormError(err.message || 'সংরক্ষণ ব্যর্থ হয়েছে')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsShell
      title="ডান সাইডবার সেটিং (Right Sidebar Settings)"
      onSave={handleSave}
      message={message}
      error={formError}
      saving={saving}
    >
      <p style={{ color: '#4b5563', marginBottom: '1.25rem', fontSize: '14.5px', lineHeight: '1.6' }}>
        যেসব সেকশন বা পেজে ডানপাশে (Right Sidebar) খবরের ব্লক রয়েছে (যেমন: <strong>বদলি</strong>,{' '}
        <strong>কৃষকের কথা</strong>, <strong>কৃষি শিক্ষা</strong> ইত্যাদি), সেখানে কোন ক্যাটাগরির খবর ও শিরোনাম
        দেখাবে তা এখান থেকে নির্বাচন করুন।
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sectionList.map((sec) => {
          const config = sidebars[sec.slug] || {}
          const isEnabled =
            config.enabled !== undefined ? config.enabled : sec.defaultEnabled
          const selectedCatSlug =
            config.categorySlug !== undefined
              ? config.categorySlug
              : sec.defaultCategory
          const customTitle = config.title || ''
          const limit = config.limit || 5

          return (
            <div
              key={sec.slug}
              style={{
                background: isEnabled ? '#f8fafc' : '#f1f5f9',
                border: isEnabled ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem 1.25rem',
                opacity: isEnabled ? 1 : 0.75,
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  borderBottom: isEnabled ? '1px solid #e2e8f0' : 'none',
                  paddingBottom: isEnabled ? '0.75rem' : '0',
                  marginBottom: isEnabled ? '0.75rem' : '0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                    {sec.name} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>({sec.slug})</span>
                  </h4>
                  {isEnabled && (
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        background: '#dcfce7',
                        color: '#15803d',
                        padding: '2px 8px',
                        borderRadius: '12px',
                      }}
                    >
                      Active Sidebar
                    </span>
                  )}
                </div>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#334155',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => handleFieldChange(sec.slug, 'enabled', e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  ডান সাইডবার চালু রাখুন
                </label>
              </div>

              {isEnabled && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      সাইডবার ক্যাটাগরি (Target Category)
                    </label>
                    <select
                      value={selectedCatSlug}
                      onChange={(e) => handleFieldChange(sec.slug, 'categorySlug', e.target.value)}
                      className="admin-input"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">-- ক্যাটাগরি নির্বাচন করুন --</option>
                      {categories.map((cat) => (
                        <option key={cat._id || cat.slug} value={cat.slug}>
                          {cat.name} ({cat.slug})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      কাস্টম শিরোনাম (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      placeholder="খালি রাখলে ক্যাটাগরির নাম দেখাবে"
                      value={customTitle}
                      onChange={(e) => handleFieldChange(sec.slug, 'title', e.target.value)}
                      className="admin-input"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      খবরের সংখ্যা (Limit)
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={limit}
                      onChange={(e) => handleFieldChange(sec.slug, 'limit', parseInt(e.target.value, 10) || 5)}
                      className="admin-input"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </SettingsShell>
  )
}
