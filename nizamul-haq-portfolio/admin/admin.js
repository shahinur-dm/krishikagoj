const TOKEN_KEY = 'nh_admin_token'

const loginScreen = document.getElementById('login-screen')
const app = document.getElementById('app')
const toast = document.getElementById('toast')
let content = null

function token() {
  return sessionStorage.getItem(TOKEN_KEY) || ''
}

function headers(json = true) {
  const h = { Authorization: `Bearer ${token()}` }
  if (json) h['Content-Type'] = 'application/json'
  return h
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function showToast(msg, isError = false) {
  toast.hidden = false
  toast.textContent = msg
  toast.classList.toggle('error-toast', isError)
  setTimeout(() => {
    toast.hidden = true
    toast.classList.remove('error-toast')
  }, 3200)
}

function showLoginView() {
  loginScreen.hidden = false
  app.hidden = true
}

function showAppView() {
  loginScreen.hidden = true
  app.hidden = false
}

function field(label, name, value = '', multiline = false, placeholder = '') {
  const v = value ?? ''
  const ph = placeholder ? ` placeholder="${esc(placeholder)}"` : ''
  if (multiline) {
    return `<label>${label}<textarea name="${name}" rows="4"${ph}>${esc(v)}</textarea></label>`
  }
  return `<label>${label}<input name="${name}" value="${esc(v)}"${ph} /></label>`
}

function linkField(label, name, value = '', placeholder = 'https://') {
  return field(label, name, value, false, placeholder)
}

function imageField(label, name, value = '') {
  const v = value ?? ''
  const preview = v
    ? `<img src="${esc(v)}" alt="" />`
    : '<span class="media-empty">No image selected</span>'
  return `<div class="media-field" data-media-field="${name}">
    <span class="field-label">${label}</span>
    <div class="media-preview">${preview}</div>
    <div class="media-actions">
      <label class="btn-upload"><i class="fa-solid fa-cloud-arrow-up"></i> Upload image
        <input type="file" accept="image/*" data-upload-for="${name}" hidden />
      </label>
      <span class="media-or">or</span>
      <input class="media-url" name="${name}" value="${esc(v)}" placeholder="Paste image URL" />
    </div>
  </div>`
}

function repeatBlock(title, items, keys, prefix) {
  return items
    .map((item, i) => {
      const fields = keys
        .map((k) => {
          if (k.type === 'image') return imageField(k.label, `${prefix}-${k.name}-${i}`, item[k.name])
          if (k.type === 'link') return linkField(k.label, `${prefix}-${k.name}-${i}`, item[k.name], k.placeholder)
          return field(k.label, `${prefix}-${k.name}-${i}`, item[k.name], k.multiline, k.placeholder)
        })
        .join('')
      return `<div class="card"><strong>${title} ${i + 1}</strong>${fields}</div>`
    })
    .join('')
}

function renderPanels() {
  const p = content.profile
  document.querySelector('[data-panel="profile"]').innerHTML = `<div class="card grid two">
    ${field('Full Name', 'name', p.name)}
    ${field('Professional Title', 'title', p.title)}
    ${imageField('Profile Photo', 'photo', p.photo)}
    ${field('Email', 'email', p.email, false, 'name@email.com')}
    ${field('Phone', 'phone', p.phone)}
    ${field('Address', 'address', p.address)}
    ${linkField('Facebook', 'facebook', p.facebook)}
    ${linkField('Twitter / X', 'twitter', p.twitter)}
    ${linkField('YouTube', 'youtube', p.youtube)}
    ${linkField('LinkedIn', 'linkedin', p.linkedin)}
    ${linkField('Instagram', 'instagram', p.instagram)}
    <div style="grid-column:1/-1">${field('Short Bio', 'bio', p.bio, true)}</div>
  </div>`

  document.querySelector('[data-panel="news"]').innerHTML = `<div class="grid">${repeatBlock('Report', content.news, [
    { name: 'image', label: 'Cover Image', type: 'image' },
    { name: 'date', label: 'Publish Date' },
    { name: 'title', label: 'Headline' },
    { name: 'excerpt', label: 'Summary', multiline: true },
  ], 'news')}</div>`

  document.querySelector('[data-panel="media"]').innerHTML = `<div class="grid">${repeatBlock('Media Item', content.media, [
    { name: 'image', label: 'Thumbnail', type: 'image' },
    { name: 'title', label: 'Title' },
    { name: 'meta', label: 'Source & Year' },
  ], 'media')}</div>`

  document.querySelector('[data-panel="videos"]').innerHTML = `<div class="grid">${repeatBlock('Video', content.videos, [
    { name: 'image', label: 'Thumbnail', type: 'image' },
    { name: 'title', label: 'Title' },
    { name: 'date', label: 'Date' },
    { name: 'url', label: 'Video Link', type: 'link', placeholder: 'YouTube or video URL' },
  ], 'video')}</div>`

  document.querySelector('[data-panel="about"]').innerHTML = `<div class="grid two">
    ${repeatBlock('Fact', content.facts, [
      { name: 'icon', label: 'Icon class (e.g. fa-briefcase)' },
      { name: 'label', label: 'Label' },
      { name: 'value', label: 'Value' },
    ], 'fact')}
    ${repeatBlock('Statistic', content.stats, [
      { name: 'value', label: 'Number' },
      { name: 'label', label: 'Description' },
    ], 'stat')}
    ${repeatBlock('Milestone', content.journey, [
      { name: 'icon', label: 'Icon class' },
      { name: 'year', label: 'Year' },
      { name: 'text', label: 'Description', multiline: true },
    ], 'journey')}
  </div>`

  const g = content.gallery
  document.querySelector('[data-panel="gallery"]').innerHTML = `<div class="grid two">
    <div class="card"><strong>Photography</strong>
      ${imageField('Photo 1', 'ph0', g.photography[0])}
      ${imageField('Photo 2', 'ph1', g.photography[1])}
      ${imageField('Photo 3', 'ph2', g.photography[2])}
      ${imageField('Photo 4', 'ph3', g.photography[3])}
    </div>
    <div class="card"><strong>Travel</strong>
      ${imageField('Photo 1', 'tr0', g.travel[0])}
      ${imageField('Photo 2', 'tr1', g.travel[1])}
      ${imageField('Photo 3', 'tr2', g.travel[2])}
      ${imageField('Photo 4', 'tr3', g.travel[3])}
    </div>
    <div class="card"><strong>Organization</strong>
      ${imageField('Photo 1', 'og0', g.org[0])}
      ${imageField('Photo 2', 'og1', g.org[1])}
      ${imageField('Photo 3', 'og2', g.org[2])}
      ${imageField('Photo 4', 'og3', g.org[3])}
    </div>
    <div class="card"><strong>Writing</strong>
      ${imageField('Cover Image', 'writingCover', g.writingCover)}
      ${field('Topic 1', 'tp0', g.topics[0])}
      ${field('Topic 2', 'tp1', g.topics[1])}
      ${field('Topic 3', 'tp2', g.topics[2])}
      ${field('Topic 4', 'tp3', g.topics[3])}
    </div>
  </div>`

  bindMediaFields()
}

function updatePreview(name, url) {
  const wrap = document.querySelector(`[data-media-field="${name}"] .media-preview`)
  if (!wrap) return
  wrap.innerHTML = url
    ? `<img src="${esc(url)}" alt="" />`
    : '<span class="media-empty">No image selected</span>'
}

function bindMediaFields() {
  document.querySelectorAll('[data-upload-for]').forEach((input) => {
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const name = input.dataset.uploadFor
      const btn = input.closest('.btn-upload')
      btn?.classList.add('is-loading')
      try {
        const data = await readFileAsDataUrl(file)
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ data, filename: file.name }),
        })
        const payload = await res.json()
        if (!res.ok) throw new Error(payload.error || 'Upload failed')
        const urlInput = document.querySelector(`[name="${name}"]`)
        if (urlInput) urlInput.value = payload.url
        updatePreview(name, payload.url)
        showToast('Image uploaded successfully')
      } catch (err) {
        showToast(err.message || 'Upload failed', true)
      } finally {
        btn?.classList.remove('is-loading')
        input.value = ''
      }
    }
  })

  document.querySelectorAll('.media-url').forEach((input) => {
    input.addEventListener('input', () => {
      updatePreview(input.name, input.value.trim())
    })
  })
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function collect() {
  const val = (sel) => document.querySelector(`[data-panel="${sel.panel}"] [name="${sel.name}"]`)?.value?.trim() ?? ''
  const p = content.profile
  ;['name', 'title', 'photo', 'email', 'phone', 'address', 'facebook', 'twitter', 'youtube', 'linkedin', 'instagram', 'bio'].forEach((k) => {
    p[k] = val({ panel: 'profile', name: k })
  })
  content.news.forEach((n, i) => {
    n.image = val({ panel: 'news', name: `news-image-${i}` })
    n.date = val({ panel: 'news', name: `news-date-${i}` })
    n.title = val({ panel: 'news', name: `news-title-${i}` })
    n.excerpt = val({ panel: 'news', name: `news-excerpt-${i}` })
  })
  content.media.forEach((n, i) => {
    n.image = val({ panel: 'media', name: `media-image-${i}` })
    n.title = val({ panel: 'media', name: `media-title-${i}` })
    n.meta = val({ panel: 'media', name: `media-meta-${i}` })
  })
  content.videos.forEach((n, i) => {
    n.image = val({ panel: 'videos', name: `video-image-${i}` })
    n.title = val({ panel: 'videos', name: `video-title-${i}` })
    n.date = val({ panel: 'videos', name: `video-date-${i}` })
    n.url = val({ panel: 'videos', name: `video-url-${i}` })
  })
  content.facts.forEach((n, i) => {
    n.icon = val({ panel: 'about', name: `fact-icon-${i}` })
    n.label = val({ panel: 'about', name: `fact-label-${i}` })
    n.value = val({ panel: 'about', name: `fact-value-${i}` })
  })
  content.stats.forEach((n, i) => {
    n.value = val({ panel: 'about', name: `stat-value-${i}` })
    n.label = val({ panel: 'about', name: `stat-label-${i}` })
  })
  content.journey.forEach((n, i) => {
    n.icon = val({ panel: 'about', name: `journey-icon-${i}` })
    n.year = val({ panel: 'about', name: `journey-year-${i}` })
    n.text = val({ panel: 'about', name: `journey-text-${i}` })
  })
  const g = content.gallery
  g.photography = [0, 1, 2, 3].map((i) => val({ panel: 'gallery', name: `ph${i}` }))
  g.travel = [0, 1, 2, 3].map((i) => val({ panel: 'gallery', name: `tr${i}` }))
  g.org = [0, 1, 2, 3].map((i) => val({ panel: 'gallery', name: `og${i}` }))
  g.writingCover = val({ panel: 'gallery', name: 'writingCover' })
  g.topics = [0, 1, 2, 3].map((i) => val({ panel: 'gallery', name: `tp${i}` }))
  return content
}

async function boot() {
  const res = await fetch('/api/content', { headers: headers(false) })
  if (!res.ok) throw new Error('content fetch failed')
  content = await res.json()
  if (!content?.profile || !Array.isArray(content.news)) throw new Error('invalid content')
  renderPanels()
  showAppView()
  loadInbox()
}

async function loadInbox() {
  const box = document.getElementById('inbox-list')
  const res = await fetch('/api/messages', { headers: headers(false) })
  if (!res.ok) {
    box.innerHTML = '<div class="empty-state">Unable to load messages right now.</div>'
    return
  }
  const items = await res.json()
  if (!items.length) {
    box.innerHTML = '<div class="empty-state">No messages received yet.</div>'
    return
  }
  box.innerHTML = items
    .map(
      (m) => `<article>
      <strong>${esc(m.name)}</strong> · ${esc(m.email)}<br />
      <time>${m.createdAt ? new Date(m.createdAt).toLocaleString('en-GB') : ''}</time>
      <p>${esc(m.message)}</p>
    </article>`,
    )
    .join('')
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const err = document.getElementById('login-error')
  err.hidden = true
  const body = {
    user: e.target.user.value.trim(),
    password: e.target.password.value,
  }
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let data = {}
  try {
    data = JSON.parse(text)
  } catch {
    err.hidden = false
    err.textContent = 'Could not connect to the server. Please try again.'
    return
  }
  if (!res.ok) {
    err.hidden = false
    err.textContent = data.error || 'Sign in failed'
    return
  }
  sessionStorage.setItem(TOKEN_KEY, data.token)
  try {
    await boot()
  } catch {
    sessionStorage.removeItem(TOKEN_KEY)
    showLoginView()
    err.hidden = false
    err.textContent = 'Content could not be loaded. Please try again.'
  }
})

document.getElementById('logout').addEventListener('click', () => {
  sessionStorage.removeItem(TOKEN_KEY)
  location.reload()
})

document.querySelectorAll('.side nav button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.side nav button').forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
    const tab = btn.dataset.tab
    const label = btn.textContent.trim()
    document.getElementById('panel-title').textContent = label
    document.querySelectorAll('.panel').forEach((p) => {
      p.hidden = p.dataset.panel !== tab
    })
    if (tab === 'inbox') loadInbox()
  })
})

document.getElementById('save-all').addEventListener('click', async () => {
  const payload = collect()
  const res = await fetch('/api/content', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    showToast('Save failed. Please sign in again.', true)
    return
  }
  content = await res.json()
  showToast('Changes saved successfully. Refresh the live site to preview.')
})

async function init() {
  if (!token()) {
    showLoginView()
    return
  }
  try {
    await boot()
  } catch {
    sessionStorage.removeItem(TOKEN_KEY)
    showLoginView()
  }
}

init()
