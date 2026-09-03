import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useLang } from '../../context/LanguageContext'
import { refreshSiteData } from '../../context/SiteDataContext'

const COMMON_ICONS = [
  { value: 'fa-solid fa-leaf', label: 'Leaf / কৃষি' },
  { value: 'fa-solid fa-seedling', label: 'Seedling / ফসল' },
  { value: 'fa-solid fa-newspaper', label: 'Newspaper / খবর' },
  { value: 'fa-solid fa-users', label: 'Users / কৃষক' },
  { value: 'fa-solid fa-microchip', label: 'Microchip / প্রযুক্তি' },
  { value: 'fa-solid fa-award', label: 'Award / সাফল্য' },
  { value: 'fa-solid fa-flask', label: 'Flask / গবেষণা' },
  { value: 'fa-solid fa-building-columns', label: 'Gov / প্রশাসন' },
  { value: 'fa-solid fa-paw', label: 'Paw / প্রাণিসম্পদ' },
  { value: 'fa-solid fa-fish', label: 'Fish / মৎস্য' },
  { value: 'fa-solid fa-graduation-cap', label: 'Cap / শিক্ষা' },
  { value: 'fa-solid fa-lightbulb', label: 'Bulb / উদ্যোক্তা' },
  { value: 'fa-solid fa-comments', label: 'Comments / মতামত' },
]

export default function LayoutTopicPage() {
  const { isEn } = useLang()
  const [topics, setTopics] = useState([])
  const [savedTopics, setSavedTopics] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Drag state
  const [draggedIndex, setDraggedIndex] = useState(null)

  // Modal states
  const [modalMode, setModalMode] = useState(null) // 'add' | 'edit' | null
  const [editingTopic, setEditingTopic] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    slug: '',
    icon: 'fa-solid fa-leaf',
    image: '',
    url: '',
    category: '',
    subcategory: '',
    isActive: true,
  })

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [topicsRes, catsRes, subsRes] = await Promise.all([
        api.getLayoutTopics({ admin: 'true' }),
        api.getCategories().catch(() => []),
        api.getAllSubcategories().catch(() => []),
      ])
      const list = Array.isArray(topicsRes) ? topicsRes : []
      setTopics(list)
      setSavedTopics(JSON.parse(JSON.stringify(list)))
      setCategories(Array.isArray(catsRes) ? catsRes : [])
      setSubcategories(Array.isArray(subsRes) ? subsRes : [])
    } catch (err) {
      setError(err.message || 'ডাটা লোড করতে সমস্যা হয়েছে')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const hasUnsavedChanges = JSON.stringify(topics) !== JSON.stringify(savedTopics)

  // Drag and Drop handlers
  function handleDragStart(index) {
    setDraggedIndex(index)
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  function handleDrop(targetIndex) {
    if (draggedIndex === null || draggedIndex === targetIndex) return
    const updated = [...topics]
    const [moved] = updated.splice(draggedIndex, 1)
    updated.splice(targetIndex, 0, moved)
    // Update order property
    const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }))
    setTopics(reordered)
    setDraggedIndex(null)
  }

  function moveItem(fromIndex, direction) {
    const toIndex = fromIndex + direction
    if (toIndex < 0 || toIndex >= topics.length) return
    const updated = [...topics]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }))
    setTopics(reordered)
  }

  // Toggle active status
  async function toggleStatus(topicId) {
    setTopics((prev) =>
      prev.map((t) => (t._id === topicId ? { ...t, isActive: !t.isActive } : t)),
    )
  }

  // Save full layout order
  async function handleSaveLayout() {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = topics.map((t, idx) => ({
        _id: t._id,
        order: idx + 1,
        isActive: t.isActive !== false,
      }))
      const res = await api.reorderLayoutTopics(payload)
      if (res.topics) {
        setTopics(res.topics)
        setSavedTopics(JSON.parse(JSON.stringify(res.topics)))
      } else {
        setSavedTopics(JSON.parse(JSON.stringify(topics)))
      }
      await refreshSiteData().catch(() => {})
      setMessage(isEn ? 'Layout saved successfully' : 'লেআউট সফলভাবে সংরক্ষিত হয়েছে')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'সংরক্ষণ ব্যর্থ হয়েছে')
    } finally {
      setSaving(false)
    }
  }

  // Open Add Modal
  function openAddModal() {
    setFormData({
      title: '',
      titleEn: '',
      slug: '',
      icon: 'fa-solid fa-leaf',
      image: '',
      url: '',
      category: '',
      subcategory: '',
      isActive: true,
    })
    setModalMode('add')
    setEditingTopic(null)
  }

  // Open Edit Modal
  function openEditModal(topic) {
    setEditingTopic(topic)
    setFormData({
      title: topic.title || '',
      titleEn: topic.titleEn || '',
      slug: topic.slug || '',
      icon: topic.icon || 'fa-solid fa-leaf',
      image: topic.image || '',
      url: topic.url || '',
      category: topic.category?._id || topic.category || '',
      subcategory: topic.subcategory?._id || topic.subcategory || '',
      isActive: topic.isActive !== false,
    })
    setModalMode('edit')
  }

  // Form submit
  async function handleSubmitModal(e) {
    e.preventDefault()
    if (!formData.title.trim()) {
      setError('টপিক শিরোনাম প্রদান করুন')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (modalMode === 'add') {
        const created = await api.createLayoutTopic({
          ...formData,
          order: topics.length + 1,
        })
        setTopics((prev) => [...prev, created])
        setSavedTopics((prev) => [...prev, created])
        setMessage(isEn ? 'Topic added successfully' : 'টপিক সফলভাবে যুক্ত হয়েছে')
      } else if (modalMode === 'edit' && editingTopic) {
        const updated = await api.updateLayoutTopic(editingTopic._id, formData)
        setTopics((prev) => prev.map((t) => (t._id === updated._id ? updated : t)))
        setSavedTopics((prev) => prev.map((t) => (t._id === updated._id ? updated : t)))
        setMessage(isEn ? 'Topic updated successfully' : 'টপিক সফলভাবে আপডেট হয়েছে')
      }
      setModalMode(null)
      setEditingTopic(null)
      await refreshSiteData().catch(() => {})
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'অপারেশন ব্যর্থ হয়েছে')
    } finally {
      setSaving(false)
    }
  }

  // Confirm delete
  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    setError('')
    try {
      await api.deleteLayoutTopic(deleteTarget._id)
      setTopics((prev) => prev.filter((t) => t._id !== deleteTarget._id))
      setSavedTopics((prev) => prev.filter((t) => t._id !== deleteTarget._id))
      setMessage(isEn ? 'Topic deleted successfully' : 'টপিক মুছে ফেলা হয়েছে')
      setDeleteTarget(null)
      await refreshSiteData().catch(() => {})
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'মুছে ফেলতে সমস্যা হয়েছে')
    } finally {
      setDeleting(false)
    }
  }

  // Filter subcategories based on selected category in form
  const availableSubcategories = subcategories.filter((sub) => {
    if (!formData.category) return true
    const catId = sub.category?._id || sub.category
    return String(catId) === String(formData.category)
  })

  return (
    <div className="layout-topic-page">
      {message && <div className="admin-alert admin-alert-success">{message}</div>}
      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      <div className="admin-card">
        <div className="admin-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
              {isEn ? 'Layout Topic Manager' : 'লেআউট টপিক (Layout Topic)'}
            </h3>
            <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
              {isEn
                ? 'Manage topics and ordering on the Right Side of the website. Drag to reorder or toggle ON/OFF.'
                : 'ওয়েবসাইটের ডান সাইডবারের টপিকসমূহ পরিচালনা করুন। ড্র্যাগ করে ক্রম পরিবর্তন করুন এবং অন/অফ করুন।'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="button" className="admin-btn admin-btn-primary" onClick={openAddModal}>
              <i className="fa-solid fa-plus" /> {isEn ? 'Add Topic' : 'টপিক যুক্ত করুন'}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-success"
              onClick={handleSaveLayout}
              disabled={saving || !hasUnsavedChanges}
              style={{
                background: hasUnsavedChanges ? '#16a34a' : '#94a3b8',
                borderColor: hasUnsavedChanges ? '#15803d' : '#94a3b8',
                color: '#fff',
              }}
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> {isEn ? 'Saving…' : 'সেভ হচ্ছে...'}
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk" /> {isEn ? 'Save Layout' : 'লেআউট সেভ করুন'}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="admin-card-body" style={{ padding: '1rem 1.25rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '8px' }} />
              <p>{isEn ? 'Loading topics…' : 'টপিক লোড হচ্ছে...'}</p>
            </div>
          ) : topics.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
              <i className="fa-solid fa-layer-group" style={{ fontSize: '2.5rem', opacity: 0.4, marginBottom: '12px' }} />
              <p style={{ margin: 0 }}>{isEn ? 'No layout topics found.' : 'কোনো লেআউট টপিক পাওয়া যায়নি।'}</p>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={openAddModal}
                style={{ marginTop: '12px' }}
              >
                {isEn ? 'Create First Topic' : 'প্রথম টপিক যুক্ত করুন'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topics.map((topic, index) => {
                const isActive = topic.isActive !== false
                return (
                  <div
                    key={topic._id || index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isActive ? '#ffffff' : '#f8fafc',
                      border: isActive ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      opacity: isActive ? 1 : 0.68,
                      transition: 'all 0.15s ease',
                      cursor: 'grab',
                    }}
                  >
                    {/* Left: Drag Handle, Icon, Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          cursor: 'grab',
                          color: '#94a3b8',
                          fontSize: '18px',
                          userSelect: 'none',
                          padding: '0 4px',
                        }}
                        title="Drag to reorder"
                      >
                        ☰
                      </span>

                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '6px',
                          background: isActive ? '#f0fdf4' : '#f1f5f9',
                          color: isActive ? '#16a34a' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '15px',
                          flexShrink: 0,
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <i className={topic.icon || 'fa-solid fa-leaf'} />
                      </div>

                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '15px', color: '#0f172a' }}>
                            {topic.title}
                          </span>
                          {topic.titleEn && (
                            <span style={{ fontSize: '13px', color: '#64748b' }}>({topic.titleEn})</span>
                          )}
                          {topic.category?.name && (
                            <span
                              style={{
                                fontSize: '11px',
                                background: '#e0f2fe',
                                color: '#0369a1',
                                padding: '1px 8px',
                                borderRadius: '12px',
                                fontWeight: 500,
                              }}
                            >
                              {topic.category.name}
                            </span>
                          )}
                        </div>
                        {topic.slug && (
                          <small style={{ color: '#94a3b8', fontSize: '12px' }}>/{topic.slug}</small>
                        )}
                      </div>
                    </div>

                    {/* Right: Up/Down, Status Toggle, Edit, Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      {/* Up/Down buttons for mobile accessibility */}
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm"
                          style={{ padding: '2px 7px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569' }}
                          disabled={index === 0}
                          onClick={() => moveItem(index, -1)}
                          title="Move up"
                        >
                          <i className="fa-solid fa-chevron-up" style={{ fontSize: '10px' }} />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm"
                          style={{ padding: '2px 7px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569' }}
                          disabled={index === topics.length - 1}
                          onClick={() => moveItem(index, 1)}
                          title="Move down"
                        >
                          <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px' }} />
                        </button>
                      </div>

                      {/* Status Toggle ON / OFF */}
                      <button
                        type="button"
                        onClick={() => toggleStatus(topic._id)}
                        style={{
                          border: 'none',
                          borderRadius: '20px',
                          padding: '4px 12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: isActive ? '#dcfce7' : '#f1f5f9',
                          color: isActive ? '#15803d' : '#64748b',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: isActive ? '#16a34a' : '#94a3b8',
                          }}
                        />
                        {isActive ? 'ON' : 'OFF'}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm"
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          color: '#0f172a',
                          padding: '4px 10px',
                          borderRadius: '6px',
                        }}
                        onClick={() => openEditModal(topic)}
                      >
                        <i className="fa-solid fa-pen" style={{ marginRight: '4px', fontSize: '12px' }} />
                        {isEn ? 'Edit' : 'এডিট'}
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm"
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: '#dc2626',
                          padding: '4px 10px',
                          borderRadius: '6px',
                        }}
                        onClick={() => setDeleteTarget(topic)}
                      >
                        <i className="fa-solid fa-trash" style={{ marginRight: '4px', fontSize: '12px' }} />
                        {isEn ? 'Delete' : 'মুছুন'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {modalMode && (
        <div className="pl-modal-overlay" onClick={() => !saving && setModalMode(null)}>
          <div className="pl-modal-box" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="pl-modal-header">
              <h4>{modalMode === 'add' ? (isEn ? 'Add New Topic' : 'নতুন টপিক যুক্ত করুন') : isEn ? 'Edit Topic' : 'টপিক সম্পাদনা'}</h4>
              <button type="button" className="pl-modal-close" onClick={() => !saving && setModalMode(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmitModal}>
              <div className="pl-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="admin-form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    টপিক নাম / শিরোনাম (Title) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="admin-input"
                    placeholder="যেমন: কৃষি, কৃষি সংবাদ, কৃষকের কথা..."
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div className="admin-form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    ইংরেজি শিরোনাম (Title English)
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. Agriculture News, Farmer Stories..."
                    value={formData.titleEn}
                    onChange={(e) => setFormData((prev) => ({ ...prev, titleEn: e.target.value }))}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="admin-form-group">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      ক্যাটাগরি (Category)
                    </label>
                    <select
                      className="admin-input"
                      value={formData.category}
                      onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value, subcategory: '' }))}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">-- ক্যাটাগরি নির্বাচন করুন --</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      সাবক্যাটাগরি (Subcategory)
                    </label>
                    <select
                      className="admin-input"
                      value={formData.subcategory}
                      onChange={(e) => setFormData((prev) => ({ ...prev, subcategory: e.target.value }))}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">-- সাবক্যাটাগরি (ঐচ্ছিক) --</option>
                      {availableSubcategories.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.nameBn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="admin-form-group">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      আইকন (Icon)
                    </label>
                    <select
                      className="admin-input"
                      value={formData.icon}
                      onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      {COMMON_ICONS.map((ic) => (
                        <option key={ic.value} value={ic.value}>
                          {ic.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      স্লাগ / URL Slug
                    </label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="খালি রাখলে স্বয়ংক্রিয় হবে"
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    কাস্টম লিঙ্ক (URL/Link - ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="যেমন: /category/foshol বা https://..."
                    value={formData.url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                      style={{ width: '16px', height: '16px' }}
                    />
                    টপিক সক্রিয় রাখুন (Active on Frontend Right Side)
                  </label>
                </div>
              </div>

              <div className="pl-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setModalMode(null)}
                  disabled={saving}
                >
                  {isEn ? 'Cancel' : 'বাতিল'}
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" /> {isEn ? 'Saving…' : 'সংরক্ষণ হচ্ছে...'}
                    </>
                  ) : modalMode === 'add' ? (
                    isEn ? 'Add Topic' : 'টপিক যুক্ত করুন'
                  ) : (
                    isEn ? 'Update Topic' : 'আপডেট করুন'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="pl-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="pl-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="pl-modal-header">
              <h4>{isEn ? 'Confirm Delete' : 'মুছে ফেলার নিশ্চিতকরণ'}</h4>
              <button
                type="button"
                className="pl-modal-close"
                onClick={() => !deleting && setDeleteTarget(null)}
                disabled={deleting}
              >
                &times;
              </button>
            </div>
            <div className="pl-modal-body">
              <p style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>
                আপনি কি নিশ্চিত যে <strong>&quot;{deleteTarget.title}&quot;</strong> টপিকটি মুছে ফেলতে চান?
              </p>
            </div>
            <div className="pl-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                {isEn ? 'Cancel' : 'বাতিল'}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" /> {isEn ? 'Deleting…' : 'মুছে ফেলা হচ্ছে...'}
                  </>
                ) : (
                  isEn ? 'Delete' : 'মুছে ফেলুন'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
