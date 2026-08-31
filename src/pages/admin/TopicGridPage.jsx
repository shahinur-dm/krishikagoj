import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import { useLang } from '../../context/LanguageContext'
import { refreshSiteData } from '../../context/SiteDataContext'

const CARD_DEFS = [
  { slug: 'pukur', nameBn: 'পুকুর চাষ', nameEn: 'Pond', extra: 2 },
  { slug: 'chingri', nameBn: 'চিংড়ি', nameEn: 'Shrimp', extra: 2 },
  { slug: 'ilish', nameBn: 'ইলিশ', nameEn: 'Hilsa', extra: 2 },
  { slug: 'biofloc', nameBn: 'বায়োফ্লক', nameEn: 'Biofloc', extra: 3 },
  { slug: 'mach-chash', nameBn: 'মাছ চাষ', nameEn: 'Fish Farm', extra: 3 },
  { slug: 'haor', nameBn: 'হাওর', nameEn: 'Haor', extra: 3 },
  { slug: 'export', nameBn: 'মৎস্য রপ্তানি', nameEn: 'Export', extra: 3 },
  { slug: 'motso-training', nameBn: 'প্রশিক্ষণ', nameEn: 'Training', extra: 3 },
]

function emptySlots(extra) {
  return Array.from({ length: 1 + extra }, () => '')
}

function publishedPosts(list) {
  return (list || []).filter((p) => p.isPublished !== false)
}

function buildCards(subs, posts) {
  const bySlug = new Map((subs || []).map((s) => [s.slug, s]))
  return CARD_DEFS.map((def, index) => {
    const sub = bySlug.get(def.slug) || (subs || []).find((s) => s.nameBn === def.nameBn)
    const extra = def.extra
    const slots = emptySlots(extra)
    if (sub) {
      slots[0] = String(sub.homeFeatured || '')
      ;(sub.homeSecondary || []).forEach((id, i) => {
        if (i < extra) slots[i + 1] = String(id || '')
      })
    }
    return {
      key: def.slug,
      extra,
      index,
      sub,
      nameBn: sub?.nameBn || def.nameBn,
      nameEn: sub?.nameEn || def.nameEn,
      slots,
    }
  })
}

function titleOf(posts, id) {
  if (!id) return ''
  const hit = posts.find((p) => String(p._id) === String(id))
  return hit?.title || ''
}

export default function TopicGridPage() {
  const { isEn } = useLang()
  const [posts, setPosts] = useState([])
  const [cards, setCards] = useState([])
  const [saved, setSaved] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [drag, setDrag] = useState(null)

  async function load() {
    const [subs, allPosts] = await Promise.all([
      api.getAllSubcategories(),
      api.getAdminArticles().catch(() => api.getArticles({ limit: '80' })),
    ])
    const pub = publishedPosts(allPosts)
    setPosts(pub)
    const next = buildCards(subs, pub)
    setCards(next)
    setSaved(JSON.parse(JSON.stringify(next)))
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  const dirty = useMemo(() => JSON.stringify(cards) !== JSON.stringify(saved), [cards, saved])

  function setTitle(cardIndex, field, value) {
    setCards((prev) =>
      prev.map((card, i) => (i === cardIndex ? { ...card, [field]: value } : card)),
    )
  }

  function setSlot(cardIndex, slotIndex, value) {
    setCards((prev) =>
      prev.map((card, i) => {
        if (i !== cardIndex) return card
        const slots = [...card.slots]
        if (value && slots.some((id, idx) => idx !== slotIndex && String(id) === String(value))) {
          return card
        }
        slots[slotIndex] = value
        return { ...card, slots }
      }),
    )
  }

  function onDrop(cardIndex, toIndex) {
    if (!drag || drag.cardIndex !== cardIndex) return
    const from = drag.slotIndex
    if (from === toIndex) return
    setCards((prev) =>
      prev.map((card, i) => {
        if (i !== cardIndex) return card
        const slots = [...card.slots]
        const [moved] = slots.splice(from, 1)
        slots.splice(toIndex, 0, moved)
        return { ...card, slots }
      }),
    )
    setDrag(null)
  }

  function cancel() {
    setCards(JSON.parse(JSON.stringify(saved)))
    setMessage(isEn ? 'Changes discarded' : 'পরিবর্তন বাতিল হয়েছে')
    setTimeout(() => setMessage(''), 2000)
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      for (const card of cards) {
        if (!card.sub) continue
        await api.updateSubcategory(card.sub._id, {
          nameBn: String(card.nameBn || card.sub.nameBn || '').trim() || card.sub.nameBn,
          nameEn: String(card.nameEn || card.sub.nameEn || '').trim(),
          slug: card.sub.slug,
          category: card.sub.category?._id || card.sub.category,
          order: card.sub.order || 0,
          isActive: card.sub.isActive !== false,
          showOnHome: true,
          homeOrder: card.index + 1,
          homeFeatured: card.slots[0] || '',
          homeSecondary: card.slots.slice(1).map((id) => String(id || '').trim()).filter(Boolean),
        })
      }
      await refreshSiteData().catch(() => {})
      const next = JSON.parse(JSON.stringify(cards))
      setSaved(next)
      setMessage(isEn ? 'Homepage arrangement saved' : 'হোমপেজ সাজানো সংরক্ষণ হয়েছে')
      setTimeout(() => setMessage(''), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function optionsFor(card) {
    const subId = card.sub?._id
    const catId = card.sub?.category?._id || card.sub?.category
    const related = posts.filter((p) => {
      const pSub = p.subcategory?._id || p.subcategory
      const pCat = p.category?._id || p.category
      if (subId && String(pSub) === String(subId)) return true
      if (catId && String(pCat) === String(catId)) return true
      return false
    })
    return related.length ? related : posts
  }

  return (
    <div className="tg-page">
      {message && <div className="admin-alert admin-alert-success">{message}</div>}
      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>{isEn ? 'Category news layout' : 'ক্যাটাগরি নিউজ লেআউট'}</h3>
        </div>
        <div className="admin-card-body">
          <p className="text-muted" style={{ marginTop: 0 }}>
            {isEn
              ? 'Arrange the 8 homepage fisheries cards. Drag to reorder within a card. Save to update the live homepage. Original posts are not changed.'
              : 'হোমপেজের ৮টি কার্ডের খবর সাজান। একই কার্ডের ভেতর টেনে অর্ডার বদলান। সেভ করলে লাইভ হোমপেজ আপডেট হবে। মূল পোস্ট বদলাবে না।'}
          </p>
          <div className="tg-actions">
            <button type="button" className="admin-btn admin-btn-primary" onClick={save} disabled={saving || !dirty}>
              {saving ? (isEn ? 'Saving…' : 'সেভ হচ্ছে...') : isEn ? 'Save changes' : 'পরিবর্তন সেভ করুন'}
            </button>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={cancel} disabled={!dirty}>
              {isEn ? 'Cancel' : 'বাতিল'}
            </button>
          </div>
        </div>
      </div>

      <div className="tg-grid">
        {cards.map((card, cardIndex) => (
          <section key={card.key} className="admin-card tg-card">
            <div className="admin-card-header">
              <h3>
                {card.index + 1}. {isEn ? card.nameEn || card.nameBn : card.nameBn}
              </h3>
              <small>
                {card.extra === 2
                  ? isEn
                    ? 'Main + 2 extra'
                    : 'মূল + ২ অতিরিক্ত'
                  : isEn
                    ? 'Main + 3 extra'
                    : 'মূল + ৩ অতিরিক্ত'}
              </small>
            </div>
            <div className="admin-card-body">
              <div className="tg-title-row">
                <div className="admin-form-group">
                  <label>{isEn ? 'Display title (Bangla)' : 'প্রদর্শিত শিরোনাম (বাংলা)'}</label>
                  <input
                    value={card.nameBn}
                    onChange={(e) => setTitle(cardIndex, 'nameBn', e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label>{isEn ? 'Display title (English)' : 'প্রদর্শিত শিরোনাম (ইংরেজি)'}</label>
                  <input
                    value={card.nameEn}
                    onChange={(e) => setTitle(cardIndex, 'nameEn', e.target.value)}
                  />
                </div>
              </div>
              {card.slots.map((id, slotIndex) => (
                <div
                  key={`${card.key}-${slotIndex}`}
                  className="tg-slot"
                  draggable
                  onDragStart={() => setDrag({ cardIndex, slotIndex })}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(cardIndex, slotIndex)}
                >
                  <span className="tg-handle" aria-hidden="true">
                    ☰
                  </span>
                  <div className="tg-slot-body">
                    <label>
                      {slotIndex === 0
                        ? isEn
                          ? 'Main news'
                          : 'মূল খবর'
                        : isEn
                          ? `Additional news ${slotIndex}`
                          : `অতিরিক্ত খবর ${slotIndex}`}
                    </label>
                    <select value={id} onChange={(e) => setSlot(cardIndex, slotIndex, e.target.value)}>
                      <option value="">{isEn ? 'Select published news' : 'প্রকাশিত খবর বেছে নিন'}</option>
                      {optionsFor(card)
                        .filter((p) => {
                          const pid = String(p._id)
                          if (pid === String(id)) return true
                          return !card.slots.some((sid) => String(sid) === pid)
                        })
                        .map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                    {id ? <small className="tg-current">{titleOf(posts, id)}</small> : null}
                  </div>
                  <button type="button" className="admin-btn admin-btn-sm admin-btn-secondary" onClick={() => setSlot(cardIndex, slotIndex, '')}>
                    {isEn ? 'Remove' : 'সরান'}
                  </button>
                </div>
              ))}
              {!card.sub ? (
                <p className="text-muted">
                  {isEn
                    ? 'No matching subcategory yet. Create it under Subcategories and enable homepage grid.'
                    : 'মিল থাকা সাবক্যাটাগরি নেই। সাবক্যাটাগরি পেজে তৈরি করে হোম গ্রিড চালু করুন।'}
                </p>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
