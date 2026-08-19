import { useEffect, useMemo, useState } from 'react'
import { api, mapArticle } from '../../api/client'
import SafeImage from '../../components/SafeImage'
import { useLang } from '../../context/LanguageContext'

const EMPTY = {
  lead: '',
  grid: Array(6).fill(''),
  mid: Array(6).fill(''),
  story: '',
  storyList: Array(6).fill(''),
}

function cloneSlots(s) {
  return {
    lead: s.lead || '',
    grid: Array.from({ length: 6 }, (_, i) => s.grid?.[i] || ''),
    mid: Array.from({ length: 6 }, (_, i) => s.mid?.[i] || ''),
    story: s.story || '',
    storyList: Array.from({ length: 6 }, (_, i) => s.storyList?.[i] || ''),
  }
}

function parseKey(key) {
  if (key.startsWith('pool:')) return { type: 'pool', id: key.slice(5) }
  if (key.includes(':')) {
    const [type, idx] = key.split(':')
    return { type, index: Number(idx) }
  }
  return { type: key }
}

function getAt(slots, ref) {
  if (ref.type === 'lead' || ref.type === 'story') return slots[ref.type] || ''
  if (ref.type === 'grid' || ref.type === 'mid' || ref.type === 'storyList') {
    return slots[ref.type][ref.index] || ''
  }
  return ''
}

function setAt(slots, ref, id) {
  const next = cloneSlots(slots)
  if (ref.type === 'lead' || ref.type === 'story') next[ref.type] = id || ''
  else if (ref.type === 'grid' || ref.type === 'mid' || ref.type === 'storyList') {
    next[ref.type][ref.index] = id || ''
  }
  return next
}

function SlotCard({ article, label, slotKey, variant = 'sm', onClear, onChoose, onDragStart, onDrop }) {
  const { t } = useLang()
  return (
    <div
      className={`hl-slot hl-slot--${variant}${article ? '' : ' is-empty'}`}
      draggable={Boolean(article)}
      onDragStart={(e) => {
        if (!article) return
        e.dataTransfer.setData('text/plain', slotKey)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart?.(slotKey)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(e.dataTransfer.getData('text/plain'), slotKey)
      }}
    >
      <span className="hl-slot-label">{label}</span>
      {article ? (
        <>
          <div className="hl-slot-media">
            <SafeImage src={article.image} alt={article.title} width={320} />
            {variant === 'story' ? <span className="hl-slot-overlay">{article.title}</span> : null}
          </div>
          {variant !== 'story' ? <p className="hl-slot-title">{article.title}</p> : null}
          <div className="hl-slot-actions">
            <button
              type="button"
              className="hl-slot-choose"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onChoose(slotKey)
              }}
            >
              বেছে নিন
            </button>
            <button
              type="button"
              className="hl-slot-delete"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onClear(slotKey)
              }}
            >
              {t.delete}
            </button>
          </div>
        </>
      ) : (
        <div className="hl-slot-empty">
          <p className="hl-slot-placeholder">এখানে খবর টেনে আনুন</p>
          <button
            type="button"
            className="hl-slot-choose hl-slot-choose--empty"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onChoose(slotKey)
            }}
          >
            বেছে নিন
          </button>
        </div>
      )}
    </div>
  )
}

export default function HomeLeadPage() {
  const { t } = useLang()
  const [articles, setArticles] = useState([])
  const [slots, setSlots] = useState(EMPTY)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState('')
  const [pickerSlot, setPickerSlot] = useState('')
  const [pickerQ, setPickerQ] = useState('')

  const byId = useMemo(() => {
    const m = new Map()
    articles.forEach((a) => m.set(a.id, a))
    return m
  }, [articles])

  const used = useMemo(() => {
    const s = new Set()
    ;[slots.lead, slots.story, ...slots.grid, ...slots.mid, ...slots.storyList]
      .filter(Boolean)
      .forEach((id) => s.add(id))
    return s
  }, [slots])

  const pool = useMemo(() => {
    const term = q.trim().toLowerCase()
    return articles.filter((a) => {
      if (used.has(a.id)) return false
      if (!term) return true
      return (
        a.title.toLowerCase().includes(term) ||
        (a.categoryName || '').toLowerCase().includes(term)
      )
    })
  }, [articles, used, q])

  const pickerList = useMemo(() => {
    const term = pickerQ.trim().toLowerCase()
    const currentId = pickerSlot ? getAt(slots, parseKey(pickerSlot)) : ''
    return articles.filter((a) => {
      if (used.has(a.id) && a.id !== currentId) return false
      if (!term) return true
      return (
        a.title.toLowerCase().includes(term) ||
        (a.categoryName || '').toLowerCase().includes(term)
      )
    })
  }, [articles, used, pickerQ, pickerSlot, slots])

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        setLoading(true)
        const [rows, settings] = await Promise.all([
          api.getArticles({ limit: '80' }),
          api.getSettings(),
        ])
        if (!alive) return
        const mapped = (rows || []).map(mapArticle).filter(Boolean)
        setArticles(mapped)

        const saved = settings?.homepageSlots
        if (saved && (saved.lead || saved.story || (saved.grid || []).some(Boolean))) {
          setSlots(cloneSlots(saved))
        } else {
          const next = cloneSlots(EMPTY)
          next.lead = mapped[0]?.id || ''
          next.grid = mapped.slice(1, 7).map((a) => a.id)
          while (next.grid.length < 6) next.grid.push('')
          next.mid = mapped.slice(7, 13).map((a) => a.id)
          while (next.mid.length < 6) next.mid.push('')
          next.story = mapped[13]?.id || mapped[1]?.id || ''
          next.storyList = mapped.slice(14, 20).map((a) => a.id)
          while (next.storyList.length < 6) next.storyList.push('')
          setSlots(next)
        }
      } catch (err) {
        if (alive) setError(err.message)
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  function art(id) {
    return id ? byId.get(id) || null : null
  }

  function handleDrop(fromKey, toKey) {
    setDragging('')
    if (!fromKey || !toKey || fromKey === toKey) return
    const from = parseKey(fromKey)
    const to = parseKey(toKey)
    setSlots((prev) => {
      if (from.type === 'pool') {
        const incoming = from.id
        if (!incoming) return prev
        let next = cloneSlots(prev)
        if (next.lead === incoming) next.lead = ''
        if (next.story === incoming) next.story = ''
        next.grid = next.grid.map((id) => (id === incoming ? '' : id))
        next.mid = next.mid.map((id) => (id === incoming ? '' : id))
        next.storyList = next.storyList.map((id) => (id === incoming ? '' : id))
        return setAt(next, to, incoming)
      }
      const a = getAt(prev, from)
      const b = getAt(prev, to)
      return setAt(setAt(prev, to, a), from, b)
    })
  }

  function clearSlot(slotKey) {
    const ref = parseKey(slotKey)
    setSlots((prev) => setAt(prev, ref, ''))
  }

  function openPicker(slotKey) {
    setPickerQ('')
    setPickerSlot(slotKey)
  }

  function pickArticle(id) {
    if (!pickerSlot || !id) return
    handleDrop(`pool:${id}`, pickerSlot)
    setPickerSlot('')
    setPickerQ('')
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await api.updateSettings({ homepageSlots: cloneSlots(slots) })
      setMessage('সেভ হয়েছে — হোমপেজে এই পজিশনেই খবর দেখাবে')
      setTimeout(() => setMessage(''), 3500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
      </div>
    )
  }

  return (
    <div className="hl-page">
      <div className="hl-toolbar">
        <div>
          <h2>{t.homeLeadTitle}</h2>
          <p>{t.homeLeadHelp}</p>
        </div>
        <div className="hl-toolbar-actions">
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            onClick={() => {
              if (confirm(t.deleteAll + '?')) setSlots(cloneSlots(EMPTY))
            }}
          >
            {t.deleteAll}
          </button>
          <button type="button" className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? t.saving : t.save}
          </button>
        </div>
      </div>

      {message ? <div className="admin-alert admin-alert-success">{message}</div> : null}
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}

      <div className={`hl-canvas${dragging ? ' is-dragging' : ''}`}>
        <div className="hl-col hl-col-main">
          <SlotCard
            article={art(slots.lead)}
            label="বড় খবর (বাম)"
            slotKey="lead"
            variant="lead"
            onClear={clearSlot}
            onChoose={openPicker}
            onDragStart={setDragging}
            onDrop={handleDrop}
          />
          <div className="hl-grid">
            {slots.grid.map((id, i) => (
              <SlotCard
                key={`g-${i}`}
                article={art(id)}
                label={`গ্রিড ${i + 1}`}
                slotKey={`grid:${i}`}
                variant="sm"
                onClear={clearSlot}
                onChoose={openPicker}
                onDragStart={setDragging}
                onDrop={handleDrop}
              />
            ))}
          </div>
        </div>

        <div className="hl-col hl-col-mid">
          {slots.mid.map((id, i) => (
            <SlotCard
              key={`m-${i}`}
              article={art(id)}
              label={`মধ্য তালিকা ${i + 1}`}
              slotKey={`mid:${i}`}
              variant="row"
              onClear={clearSlot}
              onChoose={openPicker}
              onDragStart={setDragging}
              onDrop={handleDrop}
            />
          ))}
        </div>

        <div className="hl-col hl-col-story">
          <div className="hl-story-head">নিউজ স্টোরিজ</div>
          <SlotCard
            article={art(slots.story)}
            label="ডান বড় খবর"
            slotKey="story"
            variant="story"
            onClear={clearSlot}
            onChoose={openPicker}
            onDragStart={setDragging}
            onDrop={handleDrop}
          />
          {slots.storyList.map((id, i) => (
            <SlotCard
              key={`s-${i}`}
              article={art(id)}
              label={`স্টোরি ${i + 1}`}
              slotKey={`storyList:${i}`}
              variant="row"
              onClear={clearSlot}
              onChoose={openPicker}
              onDragStart={setDragging}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>

      <div className="hl-pool">
        <div className="hl-pool-head">
          <h3>অন্য খবর থেকে টেনে আনুন</h3>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="খবর খুঁজুন..."
          />
        </div>
        <div className="hl-pool-list">
          {pool.map((a) => (
            <div
              key={a.id}
              className="hl-pool-item"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', `pool:${a.id}`)
                e.dataTransfer.effectAllowed = 'move'
                setDragging(`pool:${a.id}`)
              }}
              onDragEnd={() => setDragging('')}
            >
              <SafeImage src={a.image} alt={a.title} width={160} />
              <span>{a.title}</span>
            </div>
          ))}
          {!pool.length ? <p className="text-muted">আর খবর নেই / খুঁজে পাওয়া যায়নি</p> : null}
        </div>
      </div>

      {pickerSlot ? (
        <div
          className="hl-picker-backdrop"
          onClick={() => {
            setPickerSlot('')
            setPickerQ('')
          }}
        >
          <div className="hl-picker" onClick={(e) => e.stopPropagation()}>
            <div className="hl-picker-head">
              <h3>খবর বেছে নিন</h3>
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                onClick={() => {
                  setPickerSlot('')
                  setPickerQ('')
                }}
              >
                বন্ধ
              </button>
            </div>
            <input
              className="hl-picker-search"
              value={pickerQ}
              onChange={(e) => setPickerQ(e.target.value)}
              placeholder="খবর খুঁজুন..."
              autoFocus
            />
            <div className="hl-picker-list">
              {pickerList.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  className="hl-picker-item"
                  onClick={() => pickArticle(a.id)}
                >
                  <SafeImage src={a.image} alt={a.title} width={160} />
                  <span>
                    {a.title}
                    {a.categoryName ? <small>{a.categoryName}</small> : null}
                  </span>
                </button>
              ))}
              {!pickerList.length ? <p className="text-muted">খবর পাওয়া যায়নি</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
