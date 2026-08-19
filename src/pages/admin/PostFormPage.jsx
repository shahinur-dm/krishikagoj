import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactQuill from 'react-quill-new'
import 'react-quill/dist/quill.snow.css'
import { api } from '../../api/client'
import ImageUploadField from '../../components/admin/ImageUploadField'
import MultipleImageUploadField from '../../components/admin/MultipleImageUploadField'
import SafeImage from '../../components/SafeImage'

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ size: [] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
    ['link', 'image', 'video'],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    ['clean'],
  ],
}

const emptyForm = {
  title: '',
  titleEn: '',
  excerpt: '',
  excerptEn: '',
  body: '',
  bodyEn: '',
  image: '',
  images: [],
  tags: '',
  author: 'কৃষি ডেস্ক',
  category: '',
  subcategory: '',
  printViewLink: '',
  headline: false,
  bigthumbnail: false,
  firstSection: false,
  firstSectionThumbnail: false,
  categoryHomepage: false,
  featured: false,
  latest: true,
  popular: false,
  isPublished: true,
}

export default function PostFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(emptyForm)
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    api.getAllCategories().then(setCategories).catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (!form.category) {
      setSubcategories([])
      return
    }
    api
      .getSubcategories({ category: form.category })
      .then(setSubcategories)
      .catch(() => setSubcategories([]))
  }, [form.category])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api
      .getAdminArticle(id)
      .then((a) => {
        setForm({
          title: a.title || '',
          titleEn: a.titleEn || '',
          excerpt: a.excerpt || '',
          excerptEn: a.excerptEn || '',
          body: a.body || '',
          bodyEn: a.bodyEn || '',
          image: a.image || '',
          tags: a.tags || '',
          author: a.author || 'কৃষি ডেস্ক',
          category: a.category?._id || a.category || '',
          subcategory: a.subcategory?._id || a.subcategory || '',
          printViewLink: a.printViewLink || '',
          headline: !!a.headline,
          bigthumbnail: !!a.bigthumbnail,
          firstSection: !!a.firstSection,
          firstSectionThumbnail: !!a.firstSectionThumbnail,
          categoryHomepage: !!a.categoryHomepage,
          featured: !!a.featured,
          latest: a.latest !== false,
          popular: !!a.popular,
          isPublished: a.isPublished !== false,
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        ...form,
        subcategory: form.subcategory ? form.subcategory : null,
      }
      if (isEdit) {
        await api.updateArticle(id, payload)
        setMessage('পোস্ট আপডেট হয়েছে')
      } else {
        const createPayload = { ...payload }
        if (!createPayload.subcategory) delete createPayload.subcategory
        await api.createArticle(createPayload)
        setMessage('পোস্ট যোগ হয়েছে')
        setTimeout(() => navigate('/admin/posts'), 1000)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const categoryName = useMemo(
    () => categories.find((c) => c._id === form.category)?.name || '',
    [categories, form.category],
  )

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
      </div>
    )
  }

  return (
    <div className="post-composer">
      <div className="post-composer-form">
      {message && <div className="admin-alert admin-alert-success">{message}</div>}
      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>{isEdit ? 'পোস্ট সম্পাদনা' : 'নতুন পোস্ট যোগ'}</h3>
          <Link to="/admin/posts" className="admin-btn admin-btn-sm admin-btn-secondary">
            ← তালিকায় ফিরুন
          </Link>
        </div>
        <div className="admin-card-body">
          <form onSubmit={handleSubmit}>
            <div className="admin-form-group">
              <label>শিরোনাম (বাংলা) *</label>
              <input value={form.title} onChange={(e) => update('title', e.target.value)} required />
            </div>
            <div className="admin-form-group">
              <label>শিরোনাম (ইংরেজি)</label>
              <input value={form.titleEn} onChange={(e) => update('titleEn', e.target.value)} />
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>ক্যাটাগরি *</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value, subcategory: '' }))
                  }
                  required
                >
                  <option value="">নির্বাচন করুন</option>
                  {categories
                    .filter((c) => c.slug !== 'home')
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="admin-form-group">
                <label>সাবক্যাটাগরি</label>
                <select
                  value={form.subcategory}
                  onChange={(e) => update('subcategory', e.target.value)}
                >
                  <option value="">—</option>
                  {subcategories.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.nameBn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-form-group">
                <label>লেখক</label>
                <input value={form.author} onChange={(e) => update('author', e.target.value)} />
              </div>
            </div>
            <ImageUploadField
              label="ফিচার ছবি"
              value={form.image}
              onChange={(url) => update('image', url)}
              hint="আপলোড করুন — ছবি স্বয়ংক্রিয়ভাবে SEO-friendly URL পাবে"
            />
            <MultipleImageUploadField
              label="অতিরিক্ত ছবি (Photo Grid)"
              value={form.images || []}
              onChange={(urls) => update('images', urls)}
            />
            <div className="admin-form-group">
              <label>সংক্ষিপ্ত বিবরণ বাংলা (খালি রাখলে অটো তৈরি হবে)</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => update('excerpt', e.target.value)}
                rows={2}
              />
            </div>
            <div className="admin-form-group">
              <label>সংক্ষিপ্ত বিবরণ (ইংরেজি)</label>
              <textarea
                value={form.excerptEn}
                onChange={(e) => update('excerptEn', e.target.value)}
                rows={2}
              />
            </div>
            <div className="admin-form-group">
              <label>বিস্তারিত (বাংলা) *</label>
              <div className="post-quill">
                <ReactQuill
                  theme="snow"
                  value={form.body}
                  onChange={(value) => update('body', value)}
                  modules={quillModules}
                />
              </div>
            </div>
            <div className="admin-form-group">
              <label>বিস্তারিত (ইংরেজি)</label>
              <div className="post-quill post-quill--en">
                <ReactQuill
                  theme="snow"
                  value={form.bodyEn}
                  onChange={(value) => update('bodyEn', value)}
                  modules={quillModules}
                />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>ট্যাগ</label>
                <input value={form.tags} onChange={(e) => update('tags', e.target.value)} />
              </div>
              <div className="admin-form-group">
                <label>প্রিন্ট ভিউ লিংক</label>
                <input
                  value={form.printViewLink}
                  onChange={(e) => update('printViewLink', e.target.value)}
                />
              </div>
            </div>

            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>প্লেসমেন্ট</p>
            <div className="admin-checkboxes">
              {[
                ['headline', 'হেডলাইন'],
                ['bigthumbnail', 'বড় থাম্বনেইল'],
                ['firstSection', 'প্রথম সেকশন'],
                ['firstSectionThumbnail', 'প্রথম সেকশন থাম্বনেইল'],
                ['categoryHomepage', 'ক্যাটাগরি হোমপেজ'],
                ['featured', 'ফিচার্ড'],
                ['latest', 'লেটেস্ট'],
                ['popular', 'জনপ্রিয়'],
                ['isPublished', 'প্রকাশিত'],
              ].map(([key, label]) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => update(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>

            <button type="submit" className="admin-btn admin-btn-primary">
              {isEdit ? 'আপডেট করুন' : 'পোস্ট সংরক্ষণ'}
            </button>
          </form>
        </div>
      </div>
      </div>

      <aside className="post-composer-preview" aria-label="লাইভ প্রিভিউ">
        <div className="post-preview-card">
          <div className="post-preview-label">লাইভ প্রিভিউ</div>
          {form.image ? (
            <div className="post-preview-hero">
              <SafeImage src={form.image} alt={form.title || 'preview'} />
            </div>
          ) : (
            <div className="post-preview-hero post-preview-hero--empty">ফিচার ছবি</div>
          )}
          {categoryName ? <p className="post-preview-cat">{categoryName}</p> : null}
          <h1 className="post-preview-title">{form.title || 'শিরোনাম এখানে দেখাবে'}</h1>
          <p className="post-preview-meta">
            {form.author || 'কৃষি ডেস্ক'}
            {form.isPublished ? ' · প্রকাশিত' : ' · খসড়া'}
          </p>
          {form.excerpt ? <p className="post-preview-excerpt">{form.excerpt}</p> : null}
          <div
            className="post-preview-body entry-content"
            dangerouslySetInnerHTML={{
              __html: form.body || '<p>বিস্তারিত লিখলে এখানে দেখাবে...</p>',
            }}
          />
        </div>
      </aside>
    </div>
  )
}
