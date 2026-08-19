import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api, mapArticle } from '../api/client'
import SafeImage from '../components/SafeImage'
import SeoHead from '../components/SeoHead'
import { useSiteData } from '../context/SiteDataContext'
import { useLang } from '../context/LanguageContext'

const LIMIT = 12

function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true">
      <path d="M128 0c17.7 0 32 14.3 32 32l0 32 128 0 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 48 0c26.5 0 48 21.5 48 48l0 48L0 160l0-48C0 85.5 21.5 64 48 64l48 0 0-32c0-17.7 14.3-32 32-32zM0 192l448 0 0 272c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 192z" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 576 512" fill="currentColor" aria-hidden="true">
      <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.2-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.3 3.3 13.1 3.3 20.2z" />
    </svg>
  )
}

function CardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true">
      <path d="M0 72C0 49.9 17.9 32 40 32l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40L0 72zM0 232c0-22.1 17.9-40 40-40l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48zM128 392l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40l48 0c22.1 0 40 17.9 40 40zM160 72c0-22.1 17.9-40 40-40l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48zM288 232l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40l48 0c22.1 0 40 17.9 40 40zM160 392c0-22.1 17.9-40 40-40l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48zM448 72l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40l48 0c22.1 0 40 17.9 40 40zM320 232c0-22.1 17.9-40 40-40l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48zM448 392l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40l48 0c22.1 0 40 17.9 40 40z" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
      <path d="M64 144a48 48 0 1 0 0-96 48 48 0 1 0 0 96zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L192 64zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zM64 464a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm48-208a48 48 0 1 0 -96 0 48 48 0 1 0 96 0z" />
    </svg>
  )
}

function ArticleMeta({ item, fallbackAuthor }) {
  return (
    <div className="eb-news-meta">
      <span>{item.author || fallbackAuthor}</span>
      {item.date && (
        <>
          <CalendarIcon />
          <span>{item.date}</span>
        </>
      )}
      <EyeIcon />
      <span>{item.views || 0}</span>
    </div>
  )
}

export default function CategoryPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const subSlug = searchParams.get('sub')
  const site = useSiteData()
  const { settings } = site
  const { t, text } = useLang()
  const [category, setCategory] = useState(null)
  const [subs, setSubs] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [view, setView] = useState('card')

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        setLoading(true)
        setError('')
        const params = { category: slug, limit: LIMIT, skip: 0 }
        if (subSlug) params.subcategory = subSlug
        const [cat, articles, catSubs] = await Promise.all([
          api.getCategory(slug),
          api.getArticles(params),
          api.getSubcategories({ category: slug }),
        ])
        if (!alive) return
        setCategory(cat)
        setSubs(catSubs || [])
        const fetchedItems = (articles || []).map(mapArticle)
        setItems(fetchedItems)
        setHasMore(fetchedItems.length === LIMIT)
        setPage(1)
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
  }, [slug, subSlug])

  const popular = useMemo(() => {
    const source = site.popular?.length
      ? site.popular
      : [...(site.latest || [])].sort((a, b) => (b.views || 0) - (a.views || 0))
    return source.slice(0, 6)
  }, [site.popular, site.latest])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const params = { category: slug, limit: LIMIT, skip: page * LIMIT }
      if (subSlug) params.subcategory = subSlug
      const articles = await api.getArticles(params)
      const fetchedItems = (articles || []).map(mapArticle)
      setItems((prev) => [...prev, ...fetchedItems])
      setHasMore(fetchedItems.length === LIMIT)
      setPage((p) => p + 1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) return <div className="container eb-loading">লোড হচ্ছে...</div>

  if (error || !category) {
    return (
      <div className="container py-5 text-center">
        <h1>ক্যাটাগরি পাওয়া যায়নি</h1>
        <p>{error || ''}</p>
        <Link to="/">প্রচ্ছদে ফিরে যান</Link>
      </div>
    )
  }

  const siteName = settings?.siteName || 'কৃষিকাগজ'
  const catName = text(category.name, category.nameEn)
  const pageTitle = `${category.name} | ${siteName}`
  const pageDesc =
    settings?.seo?.metaDescription ||
    `${category.name} বিভাগের সর্বশেষ কৃষি খবর — ${siteName}`

  return (
    <>
      <SeoHead
        title={pageTitle}
        description={pageDesc}
        keywords={`${category.name}, ${settings?.seo?.metaKeyword || ''}`}
        image={items[0]?.image || settings?.seo?.ogImage || settings?.logo}
        siteName={siteName}
        type="website"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: category.name,
          description: pageDesc,
        }}
      />

      <section className="container mt-2">
        <div className="eb-crumb-strip">
                  <Link to="/">{t.home}</Link>
          <svg width="12" height="14" viewBox="0 0 12 16" aria-hidden="true">
            <path d="M11 1L1 15" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="eb-crumb-current">{catName}</span>
        </div>
      </section>

      <section className="container eb-cat-layout">
        <div className="eb-cat-main">
          <div className="eb-sec-head">
            <h1>{catName}</h1>
            <div className="eb-view-toggle">
              <button
                type="button"
                className={view === 'card' ? 'active' : ''}
                onClick={() => setView('card')}
                aria-label="গ্রিড ভিউ"
              >
                <CardIcon />
              </button>
              <button
                type="button"
                className={view === 'list' ? 'active' : ''}
                onClick={() => setView('list')}
                aria-label="লিস্ট ভিউ"
              >
                <ListIcon />
              </button>
            </div>
          </div>

          {subs.length > 0 && (
            <ul className="eb-sub-tabs">
              <li>
                <Link to={`/category/${slug}`} className={!subSlug ? 'active' : ''}>
                  সব
                </Link>
              </li>
              {subs.map((s) => (
                <li key={s._id}>
                  <Link
                    to={`/category/${slug}?sub=${s.slug}`}
                    className={subSlug === s.slug ? 'active' : ''}
                  >
                    {s.nameBn}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {!items.length && <p className="eb-empty">এই বিভাগে এখনো খবর যোগ হয়নি।</p>}

          {view === 'card' ? (
            <div className="eb-card-grid">
              {items.map((item) => (
                <article className="eb-card" key={item.id}>
                  <Link to={item.path} className="eb-card-media">
                    <SafeImage src={item.image} alt={text(item.title, item.titleEn)} />
                  </Link>
                  <div className="eb-card-body">
                    <Link to={item.path} className="eb-card-title">
                      {text(item.title, item.titleEn)}
                    </Link>
                    {item.excerpt && (
                      <p className="eb-card-excerpt">{text(item.excerpt, item.excerptEn)}</p>
                    )}
                    <ArticleMeta item={item} fallbackAuthor={siteName} />
                          </div>
                </article>
              ))}
                        </div>
          ) : (
            <div className="eb-list-view">
              {items.map((item) => (
                <article className="eb-list-row" key={item.id}>
                  <Link to={item.path} className="eb-list-media">
                    <SafeImage src={item.image} alt={text(item.title, item.titleEn)} />
                  </Link>
                  <div className="eb-list-body">
                    <Link to={item.path} className="eb-card-title">
                      {text(item.title, item.titleEn)}
                      </Link>
                    <ArticleMeta item={item} fallbackAuthor={siteName} />
                    {item.excerpt && (
                      <p className="eb-card-excerpt">{text(item.excerpt, item.excerptEn)}</p>
                    )}
                  </div>
                </article>
                ))}
              </div>
          )}

          {items.length > 0 && (
            <div className="eb-load-more">
              {hasMore ? (
                <button type="button" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? 'লোড হচ্ছে...' : 'আরও দেখুন'}
                  </button>
              ) : (
                <p className="eb-no-more">আর কোনো খবর নেই</p>
              )}
            </div>
          )}
        </div>

        <aside className="eb-cat-side">
          <section className="eb-side-box">
            <div className="eb-side-head">সর্বাধিক পঠিত</div>
            <div className="eb-side-list">
              {popular.map((item) => (
                <div className="eb-side-item" key={item.id}>
                  <Link to={item.path || `/news/${item.slug || item.id}`}>{item.title}</Link>
                  {item.excerpt && <p>{item.excerpt}</p>}
                </div>
              ))}
      </div>
    </section>
        </aside>
      </section>
    </>
  )
}
