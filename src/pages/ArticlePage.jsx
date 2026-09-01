import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, mapArticle } from '../api/client'
import Sidebar from '../components/Sidebar'
import SafeImage from '../components/SafeImage'
import SeoHead from '../components/SeoHead'
import AdSlider from '../components/AdSlider'
import { useSiteData } from '../context/SiteDataContext'
import { useLang } from '../context/LanguageContext'
import { cleanArticleHtml } from '../utils/cleanArticleHtml'

const CANDIDATE_BATCH = 10
const MIN_FONT = 15
const MAX_FONT = 26
const DEFAULT_FONT = 18

const MEDIA_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
  : ''

function mediaUrl(img) {
  if (!img) return ''
  const src = String(img)
  if (/^https?:\/\//i.test(src) || src.startsWith('data:') || src.startsWith('/')) return src
  return `${MEDIA_BASE}${src.startsWith('/') ? src : `/${src}`}`
}

function formatBnTime(value) {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat('bn-BD', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value))
  } catch {
    return ''
  }
}

function PostMeta({ article, authorName }) {
  const time = formatBnTime(article.publishedAt)
  const published = [article.date, time].filter(Boolean).join(' ')

  return (
    <div className="kk-post-meta-inline">
      {authorName ? (
        <div className="kk-journalist">
          <i className="fa-solid fa-circle-user" aria-hidden="true" />
          <span>{authorName}</span>
        </div>
      ) : null}
      {published ? (
        <div className="kk-publish">
          <i className="fa-regular fa-clock" aria-hidden="true" />
          <span>প্রকাশ: {published}</span>
        </div>
      ) : null}
    </div>
  )
}

function ShareRow({ url, title, onFontChange }) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked */
    }
  }

  function popup(target) {
    window.open(target, 'Share This Post', 'width=640,height=450')
  }

  return (
    <div className="kk-share-row">
      <div className="kk-share-icons">
        <button
          type="button"
          className="kk-share-btn kk-share-fb"
          aria-label="Facebook"
          onClick={() =>
            popup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)
          }
        >
          <i className="fa-brands fa-facebook-f" />
        </button>
        <button
          type="button"
          className="kk-share-btn kk-share-x"
          aria-label="X"
          onClick={() =>
            popup(
              `https://twitter.com/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
            )
          }
        >
          <i className="fa-brands fa-x-twitter" />
        </button>
        <button
          type="button"
          className="kk-share-btn kk-share-li"
          aria-label="LinkedIn"
          onClick={() =>
            popup(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}`)
          }
        >
          <i className="fa-brands fa-linkedin-in" />
        </button>
        <a
          className="kk-share-btn kk-share-wa"
          aria-label="WhatsApp"
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`}
          target="_blank"
          rel="noreferrer"
        >
          <i className="fa-brands fa-whatsapp" />
        </a>
        <button
          type="button"
          className="kk-share-btn kk-share-copy"
          aria-label="লিংক কপি"
          onClick={copyLink}
        >
          <i className={copied ? 'fa-solid fa-check' : 'fa-regular fa-copy'} />
        </button>
        <button
          type="button"
          className="kk-share-btn kk-share-print"
          aria-label="প্রিন্ট"
          onClick={() => window.print()}
        >
          <i className="fa-solid fa-print" />
        </button>
        {copied && <span className="kk-copied">কপি হয়েছে</span>}
      </div>
      <div className="kk-font-btns">
        <button type="button" onClick={() => onFontChange(1)} aria-label="ফন্ট বড় করুন">
          A+
        </button>
        <button type="button" onClick={() => onFontChange(-1)} aria-label="ফন্ট ছোট করুন">
          A-
        </button>
      </div>
    </div>
  )
}

function ArticleLeftRail({ currentId }) {
  const { latest } = useSiteData()
  const items = (latest || []).filter((item) => item.id !== currentId).slice(0, 8)

  return (
    <aside className="kk-post-left">
      <div className="common-border-box">
        <div className="section-title-flex">
          <h3>সর্বশেষ</h3>
        </div>
        {items.map((item) => (
          <div className="news-list kk-left-item" key={item.id}>
            <Link to={item.path}>
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
            </Link>
          </div>
        ))}
      </div>
    </aside>
  )
}

function ArticleBlock({ article, isFirst, onFontChange, fontSize = DEFAULT_FONT, ads }) {
  const { t, text, isEn } = useLang()
  const { settings } = useSiteData()
  const url = typeof window !== 'undefined' ? `${window.location.origin}${article.path}` : ''
  const gallery = article.raw?.images || []
  const title = text(article.title, article.titleEn)
  const shortHeadline = text(article.excerpt, article.excerptEn)?.trim()
  const authorName = String(article.author || article.raw?.authorUser?.name || '').trim()
  const hasUploadedImage = Boolean(String(article.image || '').trim())
  const showImageInDetails = article.showImageInDetails !== false
  const defaultNewsImage = String(settings?.defaultNewsImage || '/placeholder-news.svg').trim()
  let detailsImage = ''
  if (hasUploadedImage && showImageInDetails) {
    detailsImage = article.image
  } else if (!hasUploadedImage) {
    detailsImage = defaultNewsImage
  }

  return (
    <section className={`kk-news-body${isFirst ? '' : ' kk-news-next'}`}>
      <div className="container">
        <div className="kk-post-grid">
          <ArticleLeftRail currentId={article.id} />
          <div className="kk-post-mid">
            <article className="kk-post-content">
              <ul className="news-details-breadcrumb">
                <li>
                  <Link to="/" aria-label={t.home}>
                    <i className="fa-solid fa-house" />
                  </Link>
                </li>
                {article.categoryName && (
                  <>
                    <li>/</li>
                    <li>
                      <Link to={`/category/${article.category}`}>
                        {text(article.categoryName, article.categoryNameEn)}
                      </Link>
                    </li>
                  </>
                )}
              </ul>
              {shortHeadline ? <h2 className="post-short-title">{shortHeadline}</h2> : null}
              <h1 className="post-title">{title}</h1>

              <PostMeta article={article} authorName={authorName} />

              <ShareRow url={url} title={title} onFontChange={onFontChange} />

              {detailsImage ? (
                <figure className="news-heading-pic">
                  <SafeImage src={detailsImage} alt={title} width={900} priority={isFirst} />
                </figure>
              ) : null}

              {isEn && !article.bodyEn && <p className="kk-lang-note">{t.noEnglish}</p>}

              <div
                className="entry-content"
                style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: cleanArticleHtml(text(article.body, article.bodyEn)) }}
              />

              {gallery.length > 0 && (
                <div className="kk-post-gallery">
                  <h4>ফটো গ্যালারি</h4>
                  <div className="kk-post-gallery-grid">
                    {gallery.map((img, i) => (
                      <a key={i} href={mediaUrl(img)} target="_blank" rel="noreferrer">
                        <SafeImage src={img} alt={`${title} ${i + 1}`} width={480} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="kk-post-tail">
                <span>
                  <i className="fa-regular fa-eye" /> {article.views} {t.views}
                </span>
                {article.tags && <span className="kk-post-tags">{article.tags}</span>}
              </div>
            </article>
          </div>

          <aside className="kk-post-right">
            <div className="kk-ad-area">
              <AdSlider ads={ads} position="sidebar" variant="card" />
            </div>
            <div className="kk-ad-area">
              <AdSlider ads={ads} position="mid_b" variant="card" startOffset={1} />
            </div>
            <Sidebar compact />
          </aside>
        </div>
      </div>
    </section>
  )
}

export default function ArticlePage() {
  const { id } = useParams()
  const { settings, ads } = useSiteData()
  const [article, setArticle] = useState(null)
  const [nextArticles, setNextArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [noMore, setNoMore] = useState(false)
  const [error, setError] = useState('')
  const [fontSize, setFontSize] = useState(DEFAULT_FONT)

  const shownIdsRef = useRef(new Set())
  const queueRef = useRef([])
  const phaseRef = useRef('same')
  const categoryRef = useRef('')
  const busyRef = useRef(false)
  const sentinelRef = useRef(null)

  const changeFont = useCallback((step) => {
    setFontSize((size) => Math.min(MAX_FONT, Math.max(MIN_FONT, size + step)))
  }, [])

  const fetchCandidates = useCallback(async () => {
    const params = {
      limit: CANDIDATE_BATCH,
      exclude: [...shownIdsRef.current].join(','),
    }
    if (categoryRef.current) {
      if (phaseRef.current === 'same') params.category = categoryRef.current
      else params.excludeCategory = categoryRef.current
    }
    const rows = await api.getArticles(params)
    return (rows || []).map(mapArticle).filter((a) => a.id && !shownIdsRef.current.has(a.id))
  }, [])

  const loadNextArticle = useCallback(async () => {
    if (busyRef.current || noMore) return
    busyRef.current = true
    setLoadingMore(true)

    try {
      for (let attempt = 0; attempt < 3 && !queueRef.current.length; attempt += 1) {
        const batch = await fetchCandidates()
        if (batch.length) {
          queueRef.current = batch
          break
        }
        if (phaseRef.current === 'same' && categoryRef.current) {
          phaseRef.current = 'other'
        } else {
          setNoMore(true)
          return
        }
      }

      const candidate = queueRef.current.shift()
      if (!candidate) {
        setNoMore(true)
        return
      }

      shownIdsRef.current.add(candidate.id)
      const detail = await api.getArticle(candidate.slug || candidate.id)
      setNextArticles((prev) => [...prev, mapArticle(detail)])
    } catch {
      /* the next scroll retries */
    } finally {
      busyRef.current = false
      setLoadingMore(false)
    }
  }, [fetchCandidates, noMore])

  useEffect(() => {
    let alive = true
    shownIdsRef.current = new Set()
    queueRef.current = []
    phaseRef.current = 'same'
    setNextArticles([])
    setNoMore(false)

    async function load() {
      try {
        setLoading(true)
        setError('')
        const data = await api.getArticle(id)
        if (!alive) return
        const mapped = mapArticle(data)
        setArticle(mapped)
        categoryRef.current = mapped.category || ''
        phaseRef.current = mapped.category ? 'same' : 'other'
        shownIdsRef.current.add(mapped.id)
      } catch (err) {
        if (alive) setError(err.message)
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    window.scrollTo(0, 0)
    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || loading || noMore) return undefined

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadNextArticle()
      },
      { rootMargin: '600px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [loading, noMore, loadNextArticle, nextArticles.length])

  if (loading) return <div className="container eb-loading">লোড হচ্ছে...</div>

  if (error || !article) {
    return (
      <div className="container py-5 text-center">
        <p>{error || 'খবরটি পাওয়া যায়নি'}</p>
        <Link to="/">প্রচ্ছদে ফিরে যান</Link>
      </div>
    )
  }

  const siteName = settings?.siteName || 'কৃষিকাগজ'
  const desc = (article.metaDescription || article.excerpt || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
  const keywords = [article.categoryName, article.tags, settings?.seo?.metaKeyword]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="kk-article-page" style={{ '--post-font': `${fontSize}px` }}>
      <SeoHead
        title={`${article.title} | ${siteName}`}
        description={desc || settings?.seo?.metaDescription || article.title}
        keywords={keywords}
        author={article.author || settings?.seo?.metaAuthor || siteName}
        image={article.image || settings?.seo?.ogImage || settings?.logo}
        type="article"
        siteName={siteName}
        canonical={
          typeof window !== 'undefined'
            ? `${window.location.origin}${article.path}`
            : undefined
        }
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: article.title,
          description: desc || article.title,
          image: article.image ? [article.image] : undefined,
          datePublished: article.publishedAt,
          author: { '@type': 'Person', name: article.author || siteName },
          publisher: {
            '@type': 'Organization',
            name: siteName,
            logo: { '@type': 'ImageObject', url: settings?.logo || '/logo.png' },
          },
          mainEntityOfPage: article.path,
          articleSection: article.categoryName || undefined,
          keywords: keywords || undefined,
        }}
      />

      <ArticleBlock
        article={article}
        isFirst
        onFontChange={changeFont}
        fontSize={fontSize}
        ads={ads}
      />

      {nextArticles.map((next) => (
        <ArticleBlock
          key={next.id}
          article={next}
          onFontChange={changeFont}
          fontSize={fontSize}
          ads={ads}
        />
      ))}

      <div ref={sentinelRef} className="kk-feed-sentinel" aria-hidden="true" />
      <p className="kk-feed-status">
        {noMore
          ? 'আর কোনো খবর নেই'
          : loadingMore
            ? 'পরের খবর লোড হচ্ছে...'
            : 'স্ক্রল করুন — পরের খবর আসতে থাকবে'}
      </p>
    </div>
  )
}
