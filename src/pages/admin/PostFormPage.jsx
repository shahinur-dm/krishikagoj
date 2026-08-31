import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { refreshSiteData } from '../../context/SiteDataContext'
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
  const [originalData, setOriginalData] = useState(null)
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [writers, setWriters] = useState([])

  useEffect(() => {
    api.getAllCategories().then(setCategories).catch((err) => setError(err.message))
    api.getWriters().then(setWriters).catch(() => setWriters([]))
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
        let homePos = ''
        if (a.headline) homePos = 'headline'
        else if (a.featured) homePos = 'featured'
        else if (a.bigthumbnail) homePos = 'bigthumbnail'
        else if (a.latest) homePos = 'latest'

        let catPos = ''
        if (a.firstSection) catPos = 'firstSection'
        else if (a.firstSectionThumbnail) catPos = 'firstSectionThumbnail'
        else if (a.categoryHomepage) catPos = 'categoryHomepage'

        let relDate = ''
        if (a.publishedAt) {
          try {
            relDate = new Date(a.publishedAt).toISOString().slice(0, 10)
          } catch {}
        } else if (a.createdAt) {
          try {
            relDate = new Date(a.createdAt).toISOString().slice(0, 10)
          } catch {}
        }
        if (!relDate) {
          relDate = new Date().toISOString().slice(0, 10)
        }

        const data = {
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
          language: a.titleEn && !a.title ? 'en' : 'bn',
          categoryPosition: catPos,
          homePosition: homePos,
          releaseDate: relDate,
          imageAlt: '',
          imageTitle: '',
          customUrl: a.slug || '',
          seoTitle: a.title || '',
          reporterMessage: '',
          videoUrl: '',
          reference: '',
          metaKeyword: a.tags || '',
          schemaSetup: false,
          autoSocial: false,
        }
        setForm(data)
        setOriginalData(data)
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

      if (isEdit) {
        await api.updateArticle(id, payload)
        setMessage(nextForm.isPublished ? 'পোস্ট প্রকাশ ও আপডেট হয়েছে' : 'পোস্ট আপডেট হয়েছে')
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
    if (form.customUrl && /[,.@$]/.test(form.customUrl)) {
      setError('Special character (e.g. ,.@$) not allowed in this field')
      return
    }
    if (bodyIsEmpty(form.body)) {
      setError('Details is required')
      return
    }
    await savePost(form, { goToList: !isEdit })
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
      </div>
    )
  }

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
      isEdit={isEdit}
      originalData={originalData}
    />
  )
}
