import { useRef, useState } from 'react'
import { api } from '../../api/client'
import SafeImage from '../../components/SafeImage'
import ImageUploadField from '../../components/admin/ImageUploadField'
import AddPostCkeditor from './AddPostCkeditor'

const SLUG_BAD = /[,.@$]/

export default function AddNewPostForm({
  form,
  update,
  setForm,
  categories,
  subcategories,
  writers,
  setWriters,
  categoryName,
  subcategoryName,
  saving,
  message,
  error,
  setError,
  onSubmit,
  emptyForm,
}) {
  const [writerOpen, setWriterOpen] = useState(false)
  const [writerSaving, setWriterSaving] = useState(false)
  const [writerForm, setWriterForm] = useState({ name: '', email: '', password: '' })
  const slugInvalid = Boolean(form.customUrl && SLUG_BAD.test(form.customUrl))
  const fileRef = useRef(null)

  function setHomePosition(value) {
    setForm((f) => ({
      ...f,
      homePosition: value,
      headline: value === 'headline' ? true : f.headline,
      featured: value === 'featured' ? true : f.featured,
      latest: value === 'latest' ? true : f.latest,
      bigthumbnail: value === 'bigthumbnail' ? true : f.bigthumbnail,
    }))
  }

  function setCategoryPosition(value) {
    setForm((f) => ({
      ...f,
      categoryPosition: value,
      firstSection: value === 'firstSection' ? true : f.firstSection,
      firstSectionThumbnail: value === 'firstSectionThumbnail' ? true : f.firstSectionThumbnail,
      categoryHomepage: value === 'categoryHomepage' ? true : f.categoryHomepage,
    }))
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      releaseDate: new Date().toISOString().slice(0, 10),
    })
    setError('')
  }

  function runAiWriter() {
    if (!form.title.trim()) {
      setError('Enter Head Line first')
      return
    }
    setError('')
    const intro = form.excerpt.trim() || form.title.trim()
    const draft = `<p>${intro}</p><p></p>`
    update('body', form.body && form.body !== '<p><br></p>' ? `${form.body}${draft}` : draft)
  }

  async function saveWriter(e) {
    e.preventDefault()
    setWriterSaving(true)
    try {
      await api.createWriter({
        name: writerForm.name,
        email: writerForm.email,
        password: writerForm.password,
        role: 'writer',
        isActive: true,
      })
      const list = await api.getWriters().catch(() => writers)
      setWriters(list || writers)
      update('author', writerForm.name)
      setWriterForm({ name: '', email: '', password: '' })
      setWriterOpen(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setWriterSaving(false)
    }
  }

  async function onDashFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const res = await api.uploadImage(file)
      update('image', res.url)
    } catch (err) {
      setError(err.message || 'আপলোড ব্যর্থ')
    }
  }

  const reporterNames = [
    'কৃষি ডেস্ক',
    ...writers.map((w) => w.name).filter(Boolean),
  ].filter((n, i, arr) => arr.indexOf(n) === i)

  return (
    <div className="add-new-post post-composer">
      <div className="post-composer-form">
        {message && <div className="admin-alert admin-alert-success">{message}</div>}
        {error && <div className="admin-alert admin-alert-error">{error}</div>}

        <div className="admin-card add-new-post-card">
          <div className="admin-card-header">
            <h3>Add New Post</h3>
          </div>
          <div className="admin-card-body">
            <form onSubmit={onSubmit}>
              <div className="anp-row anp-row-4">
                <div className="admin-form-group">
                  <label>
                    Language <span className="anp-req">*</span>
                  </label>
                  <select value={form.language || 'bn'} onChange={(e) => update('language', e.target.value)} required>
                    <option value="">Select Language</option>
                    <option value="bn">বাংলা</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>
                    Category <span className="anp-req">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value, subcategory: '' }))
                    }
                    required
                  >
                    <option value="">Select Category</option>
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
                  <label>Sub Category</label>
                  <select value={form.subcategory} onChange={(e) => update('subcategory', e.target.value)}>
                    <option value="">Select Sub Category</option>
                    {subcategories.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Category Position</label>
                  <select
                    value={form.categoryPosition || ''}
                    onChange={(e) => setCategoryPosition(e.target.value)}
                  >
                    <option value="">Select Other Position</option>
                    <option value="firstSection">First Section</option>
                    <option value="firstSectionThumbnail">First Section Thumbnail</option>
                    <option value="categoryHomepage">Category Homepage</option>
                  </select>
                </div>
              </div>

              <div className="anp-row anp-row-home">
                <div className="admin-form-group">
                  <label>Home Position</label>
                  <select value={form.homePosition || ''} onChange={(e) => setHomePosition(e.target.value)}>
                    <option value="">Select Home Page</option>
                    <option value="headline">Headline</option>
                    <option value="featured">Featured</option>
                    <option value="latest">Latest</option>
                    <option value="bigthumbnail">Big Thumbnail</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>
                    Release Date <span className="anp-req">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.releaseDate || ''}
                    onChange={(e) => update('releaseDate', e.target.value)}
                    required
                  />
                </div>
                <div className="admin-form-group anp-short-head">
                  <label>Short Head</label>
                  <input
                    value={form.excerpt}
                    onChange={(e) => update('excerpt', e.target.value)}
                    placeholder="Enter Short Head"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>
                  Head Line <span className="anp-req">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="Enter Head Line"
                  required
                />
              </div>

              <div className="anp-details-head">
                <label>
                  Details <span className="anp-req">*</span>
                </label>
                <button type="button" className="anp-ai-btn" onClick={runAiWriter}>
                  ✨ AI Writer
                </button>
              </div>
              <div className="post-quill anp-quill anp-ckeditor">
                <AddPostCkeditor value={form.body} onChange={(html) => update('body', html)} />
              </div>

              <div className="anp-row anp-row-3">
                <div className="admin-form-group">
                  <label>Image</label>
                  <div className="anp-dash-upload" onClick={() => fileRef.current?.click()}>
                    {form.image ? (
                      <SafeImage src={form.image} alt={form.imageAlt || form.title || 'Image'} />
                    ) : (
                      <span>[Image]</span>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={onDashFile} />
                  </div>
                  <ImageUploadField
                    label=""
                    value={form.image}
                    onChange={(url) => update('image', url)}
                    libraryPicker
                    hint=""
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                    <input
                      type="checkbox"
                      checked={form.showImageInDetails !== false}
                      onChange={(e) => update('showImageInDetails', e.target.checked)}
                    />
                    Show image in news details
                  </label>
                </div>
                <div className="admin-form-group">
                  <label>Image Alt</label>
                  <input
                    value={form.imageAlt || ''}
                    onChange={(e) => update('imageAlt', e.target.value)}
                    placeholder="Enter Image Alt"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Image Title</label>
                  <input
                    value={form.imageTitle || ''}
                    onChange={(e) => update('imageTitle', e.target.value)}
                    placeholder="Enter Image Title"
                  />
                </div>
              </div>

              <div className="anp-row anp-row-3">
                <div className="admin-form-group">
                  <label>Custom Url</label>
                  <input
                    value={form.customUrl || ''}
                    onChange={(e) => update('customUrl', e.target.value.trim())}
                    placeholder="example-url"
                  />
                  {slugInvalid ? (
                    <p className="anp-field-error">
                      Special character (e.g. ,.@$) not allowed in this field
                    </p>
                  ) : null}
                </div>
                <div className="admin-form-group">
                  <label>Seo Title</label>
                  <input
                    value={form.seoTitle || ''}
                    onChange={(e) => update('seoTitle', e.target.value)}
                    placeholder="Enter Seo Title"
                  />
                </div>
                <div className="admin-form-group">
                  <label>
                    Reporter <span className="anp-req">*</span>
                  </label>
                  <div className="anp-reporter">
                    <select value={form.author} onChange={(e) => update('author', e.target.value)} required>
                      <option value="">Select Reporter</option>
                      {reporterNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                      {form.author && !reporterNames.includes(form.author) ? (
                        <option value={form.author}>{form.author}</option>
                      ) : null}
                    </select>
                    <button type="button" className="anp-plus" onClick={() => setWriterOpen(true)} title="Add reporter">
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Reporter Message</label>
                <textarea
                  value={form.reporterMessage || ''}
                  onChange={(e) => update('reporterMessage', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="anp-row anp-row-2">
                <div className="admin-form-group">
                  <label>Video Url</label>
                  <input
                    value={form.videoUrl || ''}
                    onChange={(e) => update('videoUrl', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=FZDImeiPgMk"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Reference</label>
                  <input
                    value={form.reference || ''}
                    onChange={(e) => update('reference', e.target.value)}
                    placeholder="Enter Reference"
                  />
                </div>
              </div>

              <div className="anp-row anp-row-2">
                <div className="admin-form-group">
                  <label>Post tag</label>
                  <input
                    value={form.tags}
                    onChange={(e) => update('tags', e.target.value)}
                    placeholder="Tag1,Tag2"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Meta keyword</label>
                  <input
                    value={form.metaKeyword || ''}
                    onChange={(e) => update('metaKeyword', e.target.value)}
                    placeholder="Keyword1,Keyword2"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Meta Description</label>
                <textarea
                  value={form.metaDescription || ''}
                  onChange={(e) => update('metaDescription', e.target.value)}
                  placeholder="Enter Meta Description"
                  rows={3}
                />
              </div>

              <div className="anp-checks">
                <label>
                  <input
                    type="checkbox"
                    checked={form.latest}
                    onChange={(e) => update('latest', e.target.checked)}
                  />
                  সর্বশেষ সংবাদ
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={form.headline}
                    onChange={(e) => update('headline', e.target.checked)}
                  />
                  Breaking post
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => update('featured', e.target.checked)}
                  />
                  Feature post
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={form.popular}
                    onChange={(e) => update('popular', e.target.checked)}
                  />
                  Recommended post
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => update('isPublished', e.target.checked)}
                  />
                  Publish
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={!!form.schemaSetup}
                    onChange={(e) => update('schemaSetup', e.target.checked)}
                  />
                  Schema setup
                  <span className="anp-schema-note">
                    {' '}
                    (After post publish, Schema will be editable from post update)
                  </span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={form.autoSocial !== false}
                    onChange={(e) => update('autoSocial', e.target.checked)}
                  />
                  Auto social post
                </label>
              </div>

              <div className="anp-actions">
                <button type="button" className="anp-reset" onClick={resetForm} title="Reset">
                  <i className="fa-solid fa-rotate-left" />
                </button>
                <button type="submit" className="anp-save" disabled={saving || slugInvalid}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <aside className="post-composer-preview anp-preview" aria-label="Live Preview">
        <div className="post-preview-card">
          <div className="post-preview-label">Live Preview</div>
          {form.image ? (
            <div className="post-preview-hero">
              <SafeImage src={form.image} alt={form.imageAlt || form.title || 'preview'} />
            </div>
          ) : (
            <div className="post-preview-hero post-preview-hero--empty">Image</div>
          )}
          {categoryName || subcategoryName ? (
            <p className="post-preview-cat">
              {categoryName || 'Category'}
              {subcategoryName ? ` · ${subcategoryName}` : ''}
            </p>
          ) : (
            <p className="post-preview-cat">Category</p>
          )}
          <h1 className="post-preview-title">{form.title || 'Headline'}</h1>
          {form.excerpt ? <p className="post-preview-excerpt">{form.excerpt}</p> : null}
          <p className="post-preview-meta">
            {form.releaseDate || new Date().toISOString().slice(0, 10)}
            {' • '}
            {form.author || 'Reporter'}
          </p>
          {form.videoUrl ? <p className="anp-preview-video">Video: {form.videoUrl}</p> : null}
          <div
            className="post-preview-body entry-content"
            dangerouslySetInnerHTML={{
              __html: form.body && form.body !== '<p><br></p>' ? form.body : '<p>Article content preview...</p>',
            }}
          />
        </div>
      </aside>

      {writerOpen ? (
        <div className="anp-modal" role="dialog">
          <form className="anp-modal-card" onSubmit={saveWriter}>
            <h4>Add Reporter</h4>
            <input
              required
              placeholder="Name"
              value={writerForm.name}
              onChange={(e) => setWriterForm((w) => ({ ...w, name: e.target.value }))}
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={writerForm.email}
              onChange={(e) => setWriterForm((w) => ({ ...w, email: e.target.value }))}
            />
            <input
              required
              type="password"
              placeholder="Password"
              value={writerForm.password}
              onChange={(e) => setWriterForm((w) => ({ ...w, password: e.target.value }))}
            />
            <div className="anp-modal-actions">
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setWriterOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={writerSaving}>
                {writerSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
