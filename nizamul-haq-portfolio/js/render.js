function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function applyContent(data) {
  if (!data?.profile) return
  const p = data.profile
  document.querySelectorAll('[data-bind="name"]').forEach((el) => {
    el.textContent = p.name
  })
  document.querySelectorAll('[data-bind="title"]').forEach((el) => {
    el.textContent = p.title
  })
  const bio = document.querySelector('[data-bind="bio"]')
  if (bio) bio.textContent = p.bio
  const photo = document.querySelector('[data-bind="photo"]')
  if (photo && p.photo) photo.src = p.photo
  const setHref = (key, href) => {
    document.querySelectorAll(`[data-social="${key}"]`).forEach((a) => {
      a.href = href || '#'
    })
  }
  setHref('facebook', p.facebook)
  setHref('twitter', p.twitter)
  setHref('youtube', p.youtube)
  setHref('linkedin', p.linkedin)
  setHref('instagram', p.instagram)
  document.querySelectorAll('[data-bind="email"]').forEach((el) => {
    el.textContent = p.email
  })
  document.querySelectorAll('[data-bind="phone"]').forEach((el) => {
    el.textContent = p.phone
  })
  document.querySelectorAll('[data-bind="address"]').forEach((el) => {
    el.textContent = p.address
  })

  const news = document.getElementById('news-grid')
  if (news && data.news?.length) {
    news.innerHTML = data.news
      .slice(0, 4)
      .map(
        (n) => `<article class="news-card">
      <img src="${esc(n.image)}" alt="" />
      <div class="news-card-body">
        <time>${esc(n.date)}</time>
        <h3>${esc(n.title)}</h3>
        <p>${esc(n.excerpt)}</p>
      </div>
    </article>`,
      )
      .join('')
  }

  const media = document.getElementById('media-list')
  if (media && data.media?.length) {
    media.innerHTML = data.media
      .slice(0, 3)
      .map(
        (m) => `<li>
      <img src="${esc(m.image)}" alt="" />
      <div><h3>${esc(m.title)}</h3><p>${esc(m.meta)}</p></div>
    </li>`,
      )
      .join('')
  }

  const videos = document.getElementById('video-list')
  if (videos && data.videos?.length) {
    videos.innerHTML = data.videos
      .slice(0, 5)
      .map(
        (v, i) => `<li class="${i === 4 ? 'video-fifth' : ''}">
      <a href="${esc(v.url || '#')}" ${v.url && v.url !== '#' ? 'target="_blank" rel="noreferrer"' : ''}>
        <span class="thumb"><img src="${esc(v.image)}" alt="" /><i class="fa-solid fa-play"></i></span>
        <div><h3>${esc(v.title)}</h3><time>${esc(v.date)}</time></div>
      </a>
    </li>`,
      )
      .join('')
  }

  const facts = document.getElementById('facts-list')
  if (facts && data.facts?.length) {
    facts.innerHTML = data.facts
      .map(
        (f) => `<li><i class="fa-solid ${esc(f.icon)}"></i><span><strong>${esc(f.label)}</strong> ${esc(f.value)}</span></li>`,
      )
      .join('')
  }

  const stats = document.getElementById('stats-grid')
  if (stats && data.stats?.length) {
    stats.innerHTML = data.stats
      .map((s) => `<div><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`)
      .join('')
  }

  const journey = document.getElementById('journey-list')
  if (journey && data.journey?.length) {
    journey.innerHTML = data.journey
      .map(
        (j) => `<li>
      <i class="fa-solid ${esc(j.icon)}"></i>
      <h3>${esc(j.year)}</h3>
      <p>${esc(j.text)}</p>
    </li>`,
      )
      .join('')
  }

  const fillGrid = (id, urls, icon) => {
    const el = document.getElementById(id)
    if (!el || !urls?.length) return
    el.innerHTML =
      urls
        .slice(0, 4)
        .map((u) => `<img src="${esc(u)}" alt="" />`)
        .join('') + `<span class="float-icon"><i class="fa-solid ${icon}"></i></span>`
  }
  fillGrid('photo-photography', data.gallery?.photography, 'fa-camera')
  fillGrid('photo-travel', data.gallery?.travel, 'fa-plane')
  fillGrid('photo-org', data.gallery?.org, 'fa-people-group')
  const cover = document.getElementById('writing-cover')
  if (cover && data.gallery?.writingCover) cover.src = data.gallery.writingCover
  const topics = document.getElementById('topics-list')
  if (topics && data.gallery?.topics?.length) {
    topics.innerHTML = data.gallery.topics.map((t) => `<li>${esc(t)}</li>`).join('')
  }
}

export async function loadSiteContent() {
  try {
    const res = await fetch('/api/content')
    if (!res.ok) return
    const data = await res.json()
    applyContent(data)
  } catch {
    /* keep static HTML */
  }
}
