const API = 'http://127.0.0.1:5050/api'

async function req(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${res.status} ${data.message || JSON.stringify(data)}`)
  return data
}

async function main() {
  const health = await req('/health')
  console.log('health', health)

  const cats = await req('/categories')
  console.log('categories', cats.length)
  const foshol = cats.find((c) => c.slug === 'foshol')

  const articles = await req('/articles')
  console.log('articles', articles.length)

  const created = await req('/articles', {
    method: 'POST',
    body: JSON.stringify({
      title: 'CRUD Test News',
      excerpt: 'API create test',
      body: '<p>Created via node verify script</p>',
      image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800',
      author: 'Tester',
      category: foshol._id,
      featured: true,
      headline: true,
      latest: true,
    }),
  })
  console.log('CREATE article', created._id, created.title)

  const updated = await req(`/articles/${created._id}`, {
    method: 'PUT',
    body: JSON.stringify({ title: 'CRUD Test Updated', views: 77 }),
  })
  console.log('UPDATE article', updated.title, 'views', updated.views)

  const one = await req(`/articles/${created._id}`)
  console.log('READ article', one.title)

  const del = await req(`/articles/${created._id}`, { method: 'DELETE' })
  console.log('DELETE article', del)

  const cat = await req('/categories', {
    method: 'POST',
    body: JSON.stringify({ name: 'Temp Cat', slug: `temp-cat-${Date.now()}`, order: 99 }),
  })
  console.log('CREATE category', cat._id)

  const catUp = await req(`/categories/${cat._id}`, {
    method: 'PUT',
    body: JSON.stringify({ name: 'Temp Cat Updated' }),
  })
  console.log('UPDATE category', catUp.name)

  const catDel = await req(`/categories/${cat._id}`, { method: 'DELETE' })
  console.log('DELETE category', catDel)

  const settings = await req('/settings')
  console.log('settings', settings.siteName)

  const settingsUp = await req('/settings', {
    method: 'PUT',
    body: JSON.stringify({ notice: 'CRUD settings ok' }),
  })
  console.log('UPDATE settings notice', settingsUp.notice)

  console.log('\nALL CRUD OPERATIONS PASSED')
}

main().catch((err) => {
  console.error('CRUD FAILED', err)
  process.exit(1)
})
