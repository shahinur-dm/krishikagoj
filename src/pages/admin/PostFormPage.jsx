import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactQuill from 'react-quill-new'
import 'react-quill/dist/quill.snow.css'
import { api, formatBnDate } from '../../api/client'
import ImageUploadField from '../../components/admin/ImageUploadField'
import SafeImage from '../../components/SafeImage'
import Sidebar from '../../components/Sidebar'
import { refreshSiteData, useSiteData } from '../../context/SiteDataContext'
import { useLang } from '../../context/LanguageContext'
import { cleanArticleHtml } from '../../utils/cleanArticleHtml'
import AddNewPostForm from './AddNewPostForm'

const UI_ONLY_KEYS = [
  'language',
  'categoryPosition',
  'homePosition',
  'releaseDate',
  'imageAlt',
  'imageTitle',
  'customUrl',
  'seoTitle',
  'reporterMessage',
  'videoUrl',
  'reference',
  'metaKeyword',
  'schemaSetup',
  'autoSocial',
]

function youtubeBlock(url) {
  const raw = String(url || '').trim()
  if (!raw) return ''
  const match = raw.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/)
  if (!match) return `<p><a href="${raw}" target="_blank" rel="noreferrer">${raw}</a></p>`
  return `<p><iframe src="https://www.youtube.com/embed/${match[1]}" width="100%" height="360" title="video" frameborder="0" allowfullscreen></iframe></p>`
}

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
  metaDescription: '',
  body: '',
  bodyEn: '',
  image: '',
  images: [],
  showImageInDetails: true,
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
  language: 'bn',
  categoryPosition: '',
  homePosition: '',
  releaseDate: new Date().toISOString().slice(0, 10),
  imageAlt: '',
  imageTitle: '',
  customUrl: '',
  seoTitle: '',
  reporterMessage: '',
  videoUrl: '',
  reference: '',
  metaKeyword: '',
  schemaSetup: false,
  autoSocial: true,
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
  const [mode, setMode] = useState('edit')
  const [saving, setSaving] = useState(false)
  const [writers, setWriters] = useState([])
  const { settings, latest } = useSiteData()
  const { isEn } = useLang()

  useEffect(() => {
    api.getAllCategories().then(setCategories).catch((err) => setError(err.message))
    if (!id) {
      api.getWriters().then(setWriters).catch(() => setWriters([]))
    }
  }, [id])

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
          metaDescription: a.metaDescription || a.meta_description || '',
          body: a.body || '',
          bodyEn: a.bodyEn || '',
          image: a.image || '',
          images: a.images || [],
          showImageInDetails: a.showImageInDetails !== false,
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

  const categoryName = useMemo(
    () => categories.find((c) => c._id === form.category)?.name || '',
    [categories, form.category],
  )
  const subcategoryName = useMemo(
    () => subcategories.find((s) => s._id === form.subcategory)?.nameBn || '',
    [subcategories, form.subcategory],
  )

  function bodyIsEmpty(html) {
    const text = String(html || '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim()
    return !text
  }

  async function savePost(nextForm, { goToList = false } = {}) {
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...nextForm,
        body: cleanArticleHtml(nextForm.body),
        bodyEn: nextForm.bodyEn ? cleanArticleHtml(nextForm.bodyEn) : nextForm.bodyEn,
        subcategory: nextForm.subcategory ? nextForm.subcategory : null,
      }
      if (!isEdit) {
        if (nextForm.customUrl && !/[,.@$]/.test(nextForm.customUrl)) {
          payload.slug = nextForm.customUrl
        }
        if (nextForm.releaseDate) {
          payload.publishedAt = new Date(`${nextForm.releaseDate}T00:00:00`).toISOString()
        }
        const videoHtml = youtubeBlock(nextForm.videoUrl)
        if (videoHtml && !String(payload.body || '').includes('youtube.com/embed')) {
          payload.body = `${payload.body || ''}${videoHtml}`
        }
        for (const key of UI_ONLY_KEYS) delete payload[key]
      }
      if (isEdit) {
        await api.updateArticle(id, payload)
        setMessage(nextForm.isPublished ? 'পোস্ট প্রকাশ হয়েছে' : 'পোস্ট আপডেট হয়েছে')
      } else {
        const createPayload = { ...payload }
        if (!createPayload.subcategory) delete createPayload.subcategory
        await api.createArticle(createPayload)
        setMessage(nextForm.isPublished ? 'পোস্ট প্রকাশ হয়েছে' : 'পোস্ট যোগ হয়েছে')
      }
      await refreshSiteData().catch(() => {})
      if (goToList) setTimeout(() => navigate('/admin/posts'), 800)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isEdit) {
      if (form.customUrl && /[,.@$]/.test(form.customUrl)) {
        setError('Special character (e.g. ,.@$) not allowed in this field')
        return
      }
      if (bodyIsEmpty(form.body)) {
        setError('Details is required')
        return
      }
    }
    await savePost(form, { goToList: !isEdit })
  }

  function openPreview() {
    if (!form.title.trim()) {
      setError('প্রিভিউয়ের আগে শিরোনাম লিখুন')
      return
    }
    if (!form.category) {
      setError('প্রিভিউয়ের আগে ক্যাটাগরি নির্বাচন করুন')
      return
    }
    if (bodyIsEmpty(form.body)) {
      setError('প্রিভিউয়ের আগে বিস্তারিত লিখুন')
      return
    }
    setError('')
    setMode('preview')
    window.scrollTo(0, 0)
  }

  async function publishFromPreview() {
    await savePost({ ...form, isPublished: true }, { goToList: true })
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
      </div>
    )
  }

  if (mode === 'preview') {
    const previewDate = formatBnDate(new Date())
    const publisher = settings?.publisher || form.author || settings?.siteName || 'কৃষি ডেস্ক'
    const gallery = form.images || []
    return (
      <div className="admin-article-preview">
        {message && <div className="admin-alert admin-alert-success">{message}</div>}
        {error && <div className="admin-alert admin-alert-error">{error}</div>}
        <div className="admin-preview-bar">
          <div>
            <strong>প্রিভিউ</strong>
            <span>এটি প্রকাশিত হয়নি। পর্যালোচনা করে সম্পাদনা বা প্রকাশ করুন।</span>
          </div>
          <div className="admin-preview-actions">
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setMode('edit')}>
              সম্পাদনায় ফিরুন
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={saving}
              onClick={publishFromPreview}
            >
              {saving ? 'প্রকাশ হচ্ছে...' : 'প্রকাশ করুন'}
            </button>
          </div>
        </div>
        <section className="kk-news-body">
          <div className="container">
            <div className="kk-post-grid">
              <aside className="kk-post-left">
                <div className="common-border-box">
                  <div className="section-title-flex">
                    <h3>সর্বশেষ</h3>
                  </div>
                  {(latest || []).slice(0, 6).map((item) => (
                    <div className="news-list kk-left-item" key={item.id}>
                      <div className="kk-left-item-row">
                        <div className="kk-left-thumb">
                          <div className="img-zoom-hover">
                            <SafeImage src={item.image} alt={item.title} width={160} />
                          </div>
                        </div>
                        <div className="kk-left-text">
                          <h4 className="title">{item.title}</h4>
                          {item.date ? <span>{item.date}</span> : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
              <div className="kk-post-mid">
                <article className="kk-post-content">
                  <ul className="news-details-breadcrumb">
                    <li>
                      <span>
                        <i className="fa-solid fa-house" />
                      </span>
                    </li>
                    {categoryName ? (
                      <>
                        <li>/</li>
                        <li>{categoryName}</li>
                      </>
                    ) : null}
                    {subcategoryName ? (
                      <>
                        <li>/</li>
                        <li>{subcategoryName}</li>
                      </>
                    ) : null}
                  </ul>
                  <h1 className="post-title">{form.title}</h1>
                  <div className="kk-article-byline">
                    <span className="kk-byline-line">প্রকাশক: {publisher}</span>
                    <span className="kk-byline-line">
                      <span className="kk-byline-sep" aria-hidden="true">|</span>
                      প্রকাশের তারিখ: {previewDate}
                    </span>
                    <span className="kk-byline-line">
                      <span className="kk-byline-sep" aria-hidden="true">|</span>
                      অনলাইন সংস্করণ
                    </span>
                  </div>
                  {form.image ? (
                    <figure className="news-heading-pic">
                      <SafeImage src={form.image} alt={form.title} width={900} />
                    </figure>
                  ) : null}
                  {form.excerpt ? (
                    <div className="post-subtitle">
                      <strong>{form.excerpt}</strong>
                    </div>
                  ) : null}
                  <div
                    className="entry-content"
                    dangerouslySetInnerHTML={{ __html: cleanArticleHtml(form.body || '') }}
                  />
                  {gallery.length ? (
                    <div className="kk-post-gallery">
                      <h4>ফটো গ্যালারি</h4>
                      <div className="kk-post-gallery-grid">
                        {gallery.map((img, i) => (
                          <SafeImage key={`${img}-${i}`} src={img} alt={`${form.title} ${i + 1}`} width={480} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="kk-post-tail">
                    {form.author ? <span>লেখক: {form.author}</span> : null}
                    {form.tags ? <span className="kk-post-tags">{form.tags}</span> : null}
                    {form.isPublished ? <span>স্ট্যাটাস: প্রকাশিত</span> : <span>স্ট্যাটাস: খসড়া</span>}
                  </div>
                </article>
              </div>
              <aside className="kk-post-right">
                <Sidebar compact />
              </aside>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (!isEdit) {
    return (
      <AddNewPostForm
        form={form}
        update={update}
        setForm={setForm}
        categories={categories}
        subcategories={subcategories}
        writers={writers}
        setWriters={setWriters}
        categoryName={categoryName}
        subcategoryName={subcategoryName}
        saving={saving}
        message={message}
        error={error}
        setError={setError}
        onSubmit={handleSubmit}
        emptyForm={emptyForm}
      />
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
              libraryPicker
              hint="নতুন ছবি আপলোড করুন অথবা মিডিয়া লাইব্রেরি থেকে নির্বাচন করুন"
            />
            <div className="admin-form-group">
              <label>
                <input
                  type="checkbox"
                  checked={form.showImageInDetails !== false}
                  onChange={(e) => update('showImageInDetails', e.target.checked)}
                />{' '}
                Show image in news details
              </label>
            </div>
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
            <div className="admin-form-group">
              <label>{isEn ? 'SEO Meta Description' : 'SEO মেটা বিবরণ'}</label>
              <textarea
                value={form.metaDescription || ''}
                onChange={(e) => update('metaDescription', e.target.value)}
                rows={3}
              />
              <p className="admin-form-hint">
                {isEn
                  ? 'Write a short description of this post for search engines.'
                  : 'সার্চ ইঞ্জিনের জন্য পোস্টের সংক্ষিপ্ত বিবরণ লিখুন।'}
              </p>
              <div
                className={`admin-seo-counter${(form.metaDescription || '').length > 160 ? ' is-over' : ''}`}
              >
                <span>{(form.metaDescription || '').length} / 160</span>
                {(form.metaDescription || '').length > 160 ? (
                  <span>
                    {isEn
                      ? 'Meta description is longer than 160 characters.'
                      : 'মেটা বিবরণ ১৬০ অক্ষরের বেশি হয়েছে।'}
                  </span>
                ) : null}
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

            <div className="admin-preview-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={openPreview}>
                প্রিভিউ
              </button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                {saving ? 'সংরক্ষণ হচ্ছে...' : isEdit ? 'আপডেট করুন' : 'পোস্ট সংরক্ষণ'}
              </button>
            </div>
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
              __html: cleanArticleHtml(form.body) || '<p>বিস্তারিত লিখলে এখানে দেখাবে...</p>',
            }}
          />
        </div>
      </aside>
    </div>
  )
}
