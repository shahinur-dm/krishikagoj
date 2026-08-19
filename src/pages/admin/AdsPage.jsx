import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import ImageUploadField from '../../components/admin/ImageUploadField'
import SafeImage from '../../components/SafeImage'

const POSITIONS = [
  { value: 'navbar', label: 'নেভবারের পর (ব্যানার)' },
  { value: 'bottom', label: 'ওপেনে নিচের অ্যাড বক্স' },
  { value: 'mid_a', label: 'মেইন লেআউটের পর — বাম অ্যাড' },
  { value: 'mid_b', label: 'মেইন লেআউটের পর — ডান অ্যাড' },
  { value: 'sidebar', label: 'ক্যাটাগরি সেকশন — ডান সাইড অ্যাড (ফসল ইত্যাদি)' },
]

const MEDIA_TYPES = [
  { value: 'image', label: 'ইমেজ অ্যাড' },
  { value: 'video', label: 'ভিডিও অ্যাড' },
  { value: 'html', label: 'HTML / Embed কোড' },
]

const empty = {
  title: '',
  titleEn: '',
  description: '',
  descriptionEn: '',
  mediaType: 'image',
  image: '',
  videoUrl: '',
  videoEmbed: '',
  htmlCode: '',
  altText: '',
  linkUrl: 'https://',
  ctaText: 'বিস্তারিত',
  ctaTextEn: 'Learn more',
  badge: '',
  badgeEn: '',
  sponsorName: '',
  sponsorPhone: '',
  sponsorEmail: '',
  position: 'navbar',
  order: 0,
  isActive: true,
  openInNewTab: true,
  startAt: '',
  endAt: '',
  notes: '',
}

function toLocalInput(v) {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromForm(form) {
  return {
    ...form,
    startAt: form.startAt || null,
    endAt: form.endAt || null,
    order: Number(form.order) || 0,
  }
}

export default function AdsPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setItems(await api.getAdminAds())
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2800)
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function startEdit(item) {
    setEditingId(item._id)
    setForm({
      title: item.title || '',
      titleEn: item.titleEn || '',
      description: item.description || '',
      descriptionEn: item.descriptionEn || '',
      mediaType: item.mediaType || 'image',
      image: item.image || '',
      videoUrl: item.videoUrl || '',
      videoEmbed: item.videoEmbed || '',
      htmlCode: item.htmlCode || '',
      altText: item.altText || '',
      linkUrl: item.linkUrl || '',
      ctaText: item.ctaText || 'বিস্তারিত',
      ctaTextEn: item.ctaTextEn || 'Learn more',
      badge: item.badge || '',
      badgeEn: item.badgeEn || '',
      sponsorName: item.sponsorName || '',
      sponsorPhone: item.sponsorPhone || '',
      sponsorEmail: item.sponsorEmail || '',
      position: item.position || 'navbar',
      order: item.order || 0,
      isActive: item.isActive !== false,
      openInNewTab: item.openInNewTab !== false,
      startAt: toLocalInput(item.startAt),
      endAt: toLocalInput(item.endAt),
      notes: item.notes || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditingId(null)
    setForm(empty)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = fromForm(form)
      if (editingId) {
        await api.updateAd(editingId, payload)
        flash('অ্যাড আপডেট হয়েছে')
      } else {
        await api.createAd(payload)
        flash('নতুন অ্যাড পোস্ট হয়েছে')
      }
      resetForm()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('এই অ্যাড মুছে ফেলবেন?')) return
    await api.deleteAd(id)
    flash('মুছে ফেলা হয়েছে')
    if (editingId === id) resetForm()
    await load()
  }

  async function toggleActive(item) {
    await api.updateAd(item._id, {
      ...item,
      isActive: !item.isActive,
      startAt: item.startAt || null,
      endAt: item.endAt || null,
    })
    flash(item.isActive ? 'অ্যাড বন্ধ করা হয়েছে' : 'অ্যাড সক্রিয় করা হয়েছে')
    await load()
  }

  return (
    <div>
      {message ? <div className="admin-alert admin-alert-success">{message}</div> : null}
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>{editingId ? 'অ্যাড সম্পাদনা / আপডেট' : 'নতুন অ্যাড পোস্ট করুন'}</h3>
        </div>
        <div className="admin-card-body">
          <p style={{ marginTop: 0, color: '#64748b', fontSize: 14 }}>
            ইমেজ, ভিডিও, বিবরণ, স্পন্সর তথ্য, শিডিউল ও পজিশনসহ সম্পূর্ণ অ্যাড ফর্ম। সেভ করলে সাইটে দেখাবে।
          </p>

          <form onSubmit={handleSubmit} className="ads-admin-form">
            <h4 className="ads-form-section">১. মৌলিক তথ্য</h4>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>শিরোনাম (বাংলা) *</label>
                <input value={form.title} onChange={(e) => setField('title', e.target.value)} required />
              </div>
              <div className="admin-form-group">
                <label>Title (English)</label>
                <input value={form.titleEn} onChange={(e) => setField('titleEn', e.target.value)} />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>বিবরণ (বাংলা)</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="সংক্ষিপ্ত বিবরণ / অফার টেক্সট"
                />
              </div>
              <div className="admin-form-group">
                <label>Description (English)</label>
                <textarea
                  rows={3}
                  value={form.descriptionEn}
                  onChange={(e) => setField('descriptionEn', e.target.value)}
                />
              </div>
            </div>

            <h4 className="ads-form-section">২. মিডিয়া (ইমেজ / ভিডিও / HTML)</h4>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>মিডিয়া টাইপ *</label>
                <select value={form.mediaType} onChange={(e) => setField('mediaType', e.target.value)}>
                  {MEDIA_TYPES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-form-group">
                <label>Alt text (ছবির বিবরণ)</label>
                <input
                  value={form.altText}
                  onChange={(e) => setField('altText', e.target.value)}
                  placeholder="Accessibility / SEO"
                />
              </div>
            </div>

            {(form.mediaType === 'image' || form.mediaType === 'video') && (
              <ImageUploadField
                label={form.mediaType === 'video' ? 'থাম্বনেইল / কভার ইমেজ' : 'অ্যাড ইমেজ'}
                value={form.image}
                onChange={(url) => setField('image', url)}
                hint="JPG, PNG, WEBP — ব্যানারের জন্য চওড়া ছবি ভালো (যেমন 1200×400)"
              />
            )}

            {form.mediaType === 'video' ? (
              <>
                <div className="admin-form-group">
                  <label>ভিডিও URL (MP4 / YouTube / Vimeo)</label>
                  <input
                    value={form.videoUrl}
                    onChange={(e) => setField('videoUrl', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... বা .mp4 লিংক"
                  />
                </div>
                <div className="admin-form-group">
                  <label>ভিডিও Embed কোড (iframe)</label>
                  <textarea
                    rows={3}
                    value={form.videoEmbed}
                    onChange={(e) => setField('videoEmbed', e.target.value)}
                    placeholder='<iframe src="..." ...></iframe>'
                  />
                </div>
              </>
            ) : null}

            {form.mediaType === 'html' ? (
              <div className="admin-form-group">
                <label>HTML / Ad Embed কোড</label>
                <textarea
                  rows={5}
                  value={form.htmlCode}
                  onChange={(e) => setField('htmlCode', e.target.value)}
                  placeholder="Google AdSense / কাস্টম HTML পেস্ট করুন"
                />
              </div>
            ) : null}

            <h4 className="ads-form-section">৩. লিংক ও বাটন</h4>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>ক্লিক লিংক URL *</label>
                <input
                  value={form.linkUrl}
                  onChange={(e) => setField('linkUrl', e.target.value)}
                  required
                  placeholder="https://example.com"
                />
              </div>
              <div className="admin-form-group">
                <label>পজিশন *</label>
                <select value={form.position} onChange={(e) => setField('position', e.target.value)}>
                  {POSITIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>বাটন টেক্সট (বাংলা)</label>
                <input value={form.ctaText} onChange={(e) => setField('ctaText', e.target.value)} />
              </div>
              <div className="admin-form-group">
                <label>Button text (EN)</label>
                <input value={form.ctaTextEn} onChange={(e) => setField('ctaTextEn', e.target.value)} />
              </div>
              <div className="admin-form-group">
                <label>ব্যাজ (বাংলা)</label>
                <input
                  value={form.badge}
                  onChange={(e) => setField('badge', e.target.value)}
                  placeholder="ভর্তি ২০২৬"
                />
              </div>
              <div className="admin-form-group">
                <label>Badge (EN)</label>
                <input value={form.badgeEn} onChange={(e) => setField('badgeEn', e.target.value)} />
              </div>
            </div>

            <h4 className="ads-form-section">৪. স্পন্সর / বিজ্ঞাপনদাতা</h4>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>স্পন্সর নাম</label>
                <input
                  value={form.sponsorName}
                  onChange={(e) => setField('sponsorName', e.target.value)}
                  placeholder="প্রতিষ্ঠানের নাম"
                />
              </div>
              <div className="admin-form-group">
                <label>ফোন</label>
                <input
                  value={form.sponsorPhone}
                  onChange={(e) => setField('sponsorPhone', e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div className="admin-form-group">
                <label>ইমেইল</label>
                <input
                  type="email"
                  value={form.sponsorEmail}
                  onChange={(e) => setField('sponsorEmail', e.target.value)}
                />
              </div>
              <div className="admin-form-group">
                <label>অর্ডার (ছোট সংখ্যা আগে)</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setField('order', e.target.value)}
                />
              </div>
            </div>

            <h4 className="ads-form-section">৫. শিডিউল ও স্ট্যাটাস</h4>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>শুরু সময়</label>
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setField('startAt', e.target.value)}
                />
              </div>
              <div className="admin-form-group">
                <label>শেষ সময়</label>
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setField('endAt', e.target.value)}
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label>অভ্যন্তরীণ নোট (সাইটে দেখাবে না)</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="পেমেন্ট / ক্যাম্পেইন নোট"
              />
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginTop: 8 }}>
              <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField('isActive', e.target.checked)}
                />
                সক্রিয় (সাইটে দেখাবে)
              </label>
              <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={form.openInNewTab}
                  onChange={(e) => setField('openInNewTab', e.target.checked)}
                />
                নতুন ট্যাবে খুলবে
              </label>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                {saving ? 'সংরক্ষণ...' : editingId ? 'আপডেট করুন' : 'অ্যাড পোস্ট করুন'}
              </button>
              {editingId ? (
                <button type="button" className="admin-btn admin-btn-secondary" onClick={resetForm}>
                  বাতিল / নতুন ফর্ম
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: '1rem' }}>
        <div className="admin-card-header">
          <h3>সব অ্যাড ({items.length})</h3>
        </div>
        <div className="admin-card-body" style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>মিডিয়া</th>
                <th>শিরোনাম</th>
                <th>টাইপ</th>
                <th>পজিশন</th>
                <th>স্ট্যাটাস</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td style={{ width: 90 }}>
                    {item.image ? (
                      <SafeImage
                        src={item.image}
                        alt=""
                        style={{ width: 72, height: 44, objectFit: 'cover', borderRadius: 4 }}
                      />
                    ) : item.mediaType === 'video' ? (
                      '🎬'
                    ) : item.mediaType === 'html' ? (
                      '<>'
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <strong>{item.title}</strong>
                    {item.sponsorName ? (
                      <div style={{ fontSize: 12, color: '#64748b' }}>{item.sponsorName}</div>
                    ) : null}
                    {item.description ? (
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        {item.description.slice(0, 70)}
                        {item.description.length > 70 ? '…' : ''}
                      </div>
                    ) : null}
                  </td>
                  <td>{MEDIA_TYPES.find((m) => m.value === item.mediaType)?.label || 'ইমেজ'}</td>
                  <td>{POSITIONS.find((p) => p.value === item.position)?.label || item.position}</td>
                  <td>{item.isActive !== false ? 'সক্রিয়' : 'বন্ধ'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-secondary"
                      onClick={() => startEdit(item)}
                    >
                      এডিট
                    </button>{' '}
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-secondary"
                      onClick={() => toggleActive(item)}
                    >
                      {item.isActive !== false ? 'বন্ধ' : 'চালু'}
                    </button>{' '}
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-danger"
                      onClick={() => handleDelete(item._id)}
                    >
                      ডিলিট
                    </button>
                  </td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan={6}>কোনো অ্যাড নেই — উপরের ফর্ম থেকে পোস্ট করুন</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
