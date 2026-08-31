import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SafeImage from './SafeImage'
import Sidebar from './Sidebar'
import AdSlider from './AdSlider'
import { useSiteData } from '../context/SiteDataContext'
import { api } from '../api/client'
import { useLang } from '../context/LanguageContext'

const BN_NUM = ['১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯', '১০', '১১', '১২']

function articlePath(item) {
  return item.path || `/news/${item.slug || item.id}`
}

/** Keep only full rows so leftover cards never leave empty cells. */
function completeRows(items, cols) {
  const count = Math.floor((items?.length || 0) / cols) * cols
  return (items || []).slice(0, count)
}

function CategorySideColumn({ latest, popular, adOffset = 2 }) {
  const { ads } = useSiteData()
  return (
    <>
      <div className="cat-side-ad mb-3">
        <AdSlider ads={ads} position="sidebar" variant="side" startOffset={adOffset} />
      </div>
      <Sidebar latest={latest} popular={popular} compact />
    </>
  )
}

/** Education Bangla “কলেজ” stack: featured image + title, then thumb+title rows */
function CollegeCategoryStack({ title, slug, articles }) {
  const { text } = useLang()
  const featured = articles?.[0]
  const rest = (articles || []).slice(1, 5)
  if (!featured) return null
  return (
    <div className="common-border-box kk-college-stack">
      <SectionHead title={title} slug={slug} />
      <article className="kk-college-feature">
        <Link to={articlePath(featured)}>
          <div className="img-zoom-hover">
            <SafeImage src={featured.image} alt={text(featured.title, featured.titleEn)} className="img-fluid" />
          </div>
          <h4 className="title">{text(featured.title, featured.titleEn)}</h4>
        </Link>
      </article>
      {rest.map((item) => (
        <article key={item.id} className="kk-college-row">
          <Link to={articlePath(item)}>
            <div className="kk-college-thumb img-zoom-hover">
              <SafeImage src={item.image} alt={text(item.title, item.titleEn)} className="img-fluid" />
            </div>
            <h4 className="title">{text(item.title, item.titleEn)}</h4>
          </Link>
        </article>
      ))}
    </div>
  )
}

function sectionTopicIcon(slug, title) {
  const key = String(slug || '')
  const name = String(title || '')
  if (key === 'foshol' || name.includes('ফসল')) return 'fa-seedling'
  if (key === 'proshason' || name.includes('প্রশাসন')) return 'fa-building-columns'
  if (key === 'gobeshona' || name.includes('গবেষণা')) return 'fa-flask'
  if (key === 'prani' || name.includes('প্রাণি')) return 'fa-paw'
  if (key === 'motso' || name.includes('মৎস্য')) return 'fa-fish'
  if (key === 'bodoli' || name.includes('বদলি')) return 'fa-arrow-right-arrow-left'
  if (key === 'projukti' || name.includes('প্রযুক্তি')) return 'fa-microchip'
  if (key === 'bishesh' || name.includes('বিশেষ')) return 'fa-newspaper'
  if (key === 'shikkha' || name.includes('শিক্ষা')) return 'fa-graduation-cap'
  if (key === 'uddokta' || name.includes('উদ্যোক্তা') || name.includes('উদ্যোগ')) return 'fa-lightbulb'
  if (key === 'motamot' || name.includes('মতামত')) return 'fa-comments'
  if (key === 'krishoker-kotha' || name.includes('কৃষক')) return 'fa-users'
  if (key === 'safollo' || name.includes('সাফল্য')) return 'fa-award'
  if (key === 'pani' || name.includes('পানি')) return 'fa-droplet'
  return 'fa-leaf'
}

function SectionHead({ title, slug }) {
  return (
    <div className="section-title-flex">
      <div className="d-flex align-items-center">
        <i
          className={`fa-solid ${sectionTopicIcon(slug, title)} kk-topic-icon`}
          aria-hidden="true"
        />
        <h3>
          {slug ? <Link to={`/category/${slug}`}>{title}</Link> : title}
        </h3>
      </div>
      {slug && (
        <Link to={`/category/${slug}`}>
          আরো দেখুন <i className="fa-solid fa-circle-chevron-right ms-1" />
        </Link>
      )}
    </div>
  )
}

/** Education Bangla "আলোচিত" — 4 equal cards, first bg-blue */
function Grid4({ title, slug, articles }) {
  const { text } = useLang()
  const items = completeRows(articles.slice(0, 4), 4)
  if (!items.length) return null
  return (
    <section className="grid-category-1 mt-4">
      <div className="container">
        <div className="common-border-box">
          <SectionHead title={title} slug={slug} />
          <div className="row equal-news-grid">
            {items.map((item, i) => (
              <div key={item.id} className={`col-6 col-lg-3${i < 3 ? ' border-right' : ''}`}>
                <div className={`news-sm${i === 0 ? ' bg-blue' : ''}`}>
                  <Link to={item.path || `/news/${item.slug || item.id}`}>
                    <div className="img-zoom-hover">
                      <SafeImage src={item.image} alt={text(item.title, item.titleEn)} className="img-fluid" />
                    </div>
                    <div className={i === 0 ? 'p-2' : 'px-1 pb-1'}>
                      <h4 className="title">{text(item.title, item.titleEn)}</h4>
                      {item.excerpt ? (
                        <p className="description">{text(item.excerpt, item.excerptEn)}</p>
                      ) : null}
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function SpotlightSelectList({ items, text, selectedId, onSelect }) {
  return items.map((item) => (
    <div key={item.id} className="news-list binodon-item">
      <Link
        to={articlePath(item)}
        className={item.id === selectedId ? 'is-proshason-selected' : undefined}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
          event.preventDefault()
          onSelect(item.id)
        }}
      >
        <div className="binodon-item-row">
          <div className="binodon-item-text">
            <h4 className="title">{text(item.title, item.titleEn)}</h4>
            {item.date ? <span>{item.date}</span> : null}
          </div>
          <div className="binodon-item-thumb">
            <div className="img-zoom-hover">
              <SafeImage src={item.image} alt={text(item.title, item.titleEn)} className="img-fluid" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  ))
}

function SpotlightThumbList({ items, text }) {
  return items.map((item) => (
    <div key={item.id} className="news-list binodon-item">
      <Link to={articlePath(item)}>
        <div className="binodon-item-row">
          <div className="binodon-item-text">
            <h4 className="title">{text(item.title, item.titleEn)}</h4>
            {item.date ? <span>{item.date}</span> : null}
          </div>
          <div className="binodon-item-thumb">
            <div className="img-zoom-hover">
              <SafeImage src={item.image} alt={text(item.title, item.titleEn)} className="img-fluid" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  ))
}

function SpotlightFeatured({ item, text }) {
  if (!item) return null
  const title = text(item.title, item.titleEn)
  const excerpt = text(item.excerpt, item.excerptEn)
  return (
    <div className="news-list pg-details binodon-featured-card">
      <Link to={articlePath(item)}>
        <div className="img-zoom-hover mb-2">
          <SafeImage src={item.image} alt={title} className="img-fluid" />
        </div>
        <h4 className="title featured-main-title">{title}</h4>
        {excerpt ? <p className="description featured-subtitle">{excerpt}</p> : null}
        {item.date ? (
          <span className="featured-date">
            <i className="fa-regular fa-clock me-1" />
            {item.date}
          </span>
        ) : null}
      </Link>
    </div>
  )
}

function SpecialReportCard({ item, text }) {
  return (
    <Link to={articlePath(item)} className="bishesh-card">
      <div className="bishesh-thumb">
        <div className="img-zoom-hover">
          <SafeImage src={item.image} alt={text(item.title, item.titleEn)} className="img-fluid" />
        </div>
      </div>
      <div className="bishesh-copy">
        <h4 className="title">{text(item.title, item.titleEn)}</h4>
        {item.date ? <span>{item.date}</span> : null}
        {item.excerpt ? <p className="description">{text(item.excerpt, item.excerptEn)}</p> : null}
      </div>
    </Link>
  )
}

/** বিশেষ প্রতিবেদন — 2×2 horizontal cards on a light pink band */
function CategorySpecialReport({ title, slug, articles }) {
  const { text } = useLang()
  const items = articles.slice(0, 4)
  if (!items.length) return null

  return (
    <section className="mt-3 home-layout-bishesh">
      <div className="container">
        <div className="common-border-box">
          <SectionHead title={title} slug={slug} />
          <div className="row bishesh-grid">
            {items.map((item) => (
              <div key={item.id} className="col-12 col-md-6 bishesh-col">
                <SpecialReportCard item={item} text={text} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/** বিনোদন-style: left thumbs | center featured | right thumbs (full width) */
function CategoryBinodon({ title, slug, articles }) {
  const { text } = useLang()
  const featured = articles[0]
  const leftList = articles.slice(1, 4)
  const rightList = articles.slice(4, 7)
  if (!featured) return null

  return (
    <section className="mt-3 home-layout-binodon">
      <div className="container">
        <div className="common-border-box">
          <SectionHead title={title} slug={slug} />
          <div className="row binodon-inner">
            <div className="col-lg-4 binodon-side">
              <SpotlightThumbList items={leftList} text={text} />
            </div>
            <div className="col-lg-4 binodon-featured">
              <SpotlightFeatured item={featured} text={text} />
            </div>
            <div className="col-lg-4 binodon-side">
              <SpotlightThumbList items={rightList} text={text} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function opinionMeta(item, staff = []) {
  const name = String(item?.author || item?.raw?.author || 'কৃষি ডেস্ক').trim() || 'কৃষি ডেস্ক'
  const photo =
    item?.authorImage ||
    item?.raw?.authorImage ||
    item?.raw?.authorUser?.image ||
    staff.find((person) => person?.name === name)?.image ||
    ''
  return { name, photo, initial: name.charAt(0) || 'ম' }
}

function OpinionAvatar({ meta, alt }) {
  if (meta.photo) {
    return <SafeImage src={meta.photo} alt={alt} className="motamot-opinion-avatar-img" />
  }
  return <span className="motamot-opinion-avatar-fallback">{meta.initial}</span>
}

function opinionLabel(item, fallback) {
  return (
    item?.subcategoryName ||
    item?.raw?.subcategory?.nameBn ||
    item?.categoryName ||
    fallback ||
    'মতামত'
  )
}

/** মতামত — compact right-side opinion list; existing news only */
function CategoryMotamot({ title, slug, articles, embedded = false }) {
  const { text } = useLang()
  const { staff } = useSiteData()
  const seen = new Set()
  const items = articles.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  }).slice(0, 4)
  if (!items.length) return null

  const list = (
    <div className="motamot-side-list">
      <div className="motamot-side-head">
        <h3>{slug ? <Link to={`/category/${slug}`}>{title}</Link> : title}</h3>
        {slug ? (
          <Link to={`/category/${slug}`} className="motamot-side-more">
            আরও দেখুন <i className="fa-solid fa-arrow-right" />
          </Link>
        ) : null}
      </div>
      {items.map((item) => {
        const meta = opinionMeta(item, staff)
        return (
          <Link key={item.id} to={articlePath(item)} className="motamot-side-item">
            <span className="motamot-side-avatar">
              <OpinionAvatar meta={meta} alt={meta.name} />
            </span>
            <span className="motamot-side-copy">
              <em>{opinionLabel(item, title)}</em>
              <h4 className="title">{text(item.title, item.titleEn)}</h4>
              <span className="motamot-side-meta">
                লেখক: {meta.name}
                {item.date ? ` · ${item.date}` : ''}
              </span>
            </span>
          </Link>
        )
      })}
    </div>
  )

  if (embedded) return list

  return (
    <section className="mt-3 home-layout-motamot-side">
      <div className="container">{list}</div>
    </section>
  )
}

/** কৃষি প্রশাসন — same 3-col layout; featured auto-rotates, side cards select it */
function CategoryProshason({ title, slug, articles }) {
  const { text } = useLang()
  const pool = articles.slice(0, 7).filter((item) => item?.id)
  const [selectedId, setSelectedId] = useState(pool[0]?.id)
  const [paused, setPaused] = useState(false)
  const featured = pool.find((item) => item.id === selectedId) || pool[0]
  const leftList = articles.slice(1, 4)
  const rightList = articles.slice(4, 7)

  useEffect(() => {
    const firstId = articles[0]?.id
    if (!firstId) return
    setSelectedId((current) => {
      const visible = articles.slice(0, 7).some((item) => item?.id === current)
      return visible ? current : firstId
    })
  }, [articles])

  useEffect(() => {
    const ids = articles.slice(0, 7).map((item) => item?.id).filter(Boolean)
    if (ids.length < 2 || paused) return undefined
    const timer = window.setInterval(() => {
      if (document.hidden) return
      setSelectedId((current) => {
        const idx = ids.indexOf(current)
        return ids[(idx + 1 + ids.length) % ids.length]
      })
    }, 5000)
    return () => window.clearInterval(timer)
  }, [articles, paused])

  if (!featured) return null

  return (
    <section
      className="mt-3 home-layout-binodon home-layout-proshason"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container">
        <div className="common-border-box">
          <SectionHead title={title} slug={slug} />
          <div className="row binodon-inner">
            <div className="col-lg-4 binodon-side">
              <SpotlightSelectList
                items={leftList}
                text={text}
                selectedId={featured.id}
                onSelect={setSelectedId}
              />
            </div>
            <div className="col-lg-4 binodon-featured">
              <div key={featured.id} className="proshason-featured-fade">
                <SpotlightFeatured item={featured} text={text} />
              </div>
              {pool.length > 1 ? (
                <div className="proshason-thumbs">
                  {pool.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={item.id === featured.id ? 'proshason-thumb is-active' : 'proshason-thumb'}
                      title={text(item.title, item.titleEn)}
                      aria-label={text(item.title, item.titleEn)}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <SafeImage src={item.image} alt={text(item.title, item.titleEn)} />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="col-lg-4 binodon-side">
              <SpotlightSelectList
                items={rightList}
                text={text}
                selectedId={featured.id}
                onSelect={setSelectedId}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** কৃষি প্রযুক্তি — same 3-column listing as বিনোদন; own wrapper so other sections stay untouched */
function CategoryProjukti({ title, slug, articles }) {
  const { text } = useLang()
  const featured = articles[0]
  const leftList = articles.slice(1, 4)
  const rightList = articles.slice(4, 7)
  if (!featured) return null

  return (
    <section className="mt-3 home-layout-projukti">
      <div className="container">
        <div className="common-border-box">
          <SectionHead title={title} slug={slug} />
          <div className="row binodon-inner">
            <div className="col-lg-4 binodon-side">
              <SpotlightThumbList items={leftList} text={text} />
            </div>
            <div className="col-lg-4 binodon-featured">
              <SpotlightFeatured item={featured} text={text} />
            </div>
            <div className="col-lg-4 binodon-side">
              <SpotlightThumbList items={rightList} text={text} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** শিক্ষা প্রশাসন-style: 2 rows of [large image | main text] + [secondary text + thumb] */
function CategoryAdminRows({ title, slug, articles }) {
  const { text } = useLang()
  const rows = [
    { main: articles[0], side: articles[1] },
    { main: articles[2], side: articles[3] },
  ].filter((row) => row.main)
  if (!rows.length) return null

  return (
    <section className="mt-3 home-layout-admin-rows">
      <div className="container">
        <div className="common-border-box">
          <SectionHead title={title} slug={slug} />
          {rows.map((row, i) => (
            <div
              key={row.main.id}
              className={`row home-admin-row${i < rows.length - 1 ? ' home-admin-row-divider' : ''}`}
            >
              <div className="col-lg-8 home-admin-main-col">
                <div className="row g-3 align-items-start home-admin-main">
                  <div className="col-lg-6">
                    <Link to={articlePath(row.main)} className="home-admin-main-media">
                      <div className="img-zoom-hover home-admin-main-img">
                        <SafeImage
                          src={row.main.image}
                          alt={text(row.main.title, row.main.titleEn)}
                          className="img-fluid"
                          width={720}
                        />
                      </div>
                    </Link>
                  </div>
                  <div className="col-lg-6">
                    <Link to={articlePath(row.main)} className="home-admin-main-copy news-list pg-details">
                      <h4 className="title">{text(row.main.title, row.main.titleEn)}</h4>
                      {row.main.excerpt ? (
                        <p className="description">{text(row.main.excerpt, row.main.excerptEn)}</p>
                      ) : null}
                      {row.main.date ? <span>{row.main.date}</span> : null}
                    </Link>
                  </div>
                </div>
              </div>
              {row.side ? (
                <div className="col-lg-4 home-admin-side-col">
                  <Link to={articlePath(row.side)} className="home-admin-side">
                    <div className="home-admin-side-text">
                      <h4 className="title">{text(row.side.title, row.side.titleEn)}</h4>
                      {row.side.excerpt ? (
                        <p className="description">{text(row.side.excerpt, row.side.excerptEn)}</p>
                      ) : null}
                      {row.side.date ? <span>{row.side.date}</span> : null}
                    </div>
                    <div className="home-admin-side-thumb">
                      <div className="img-zoom-hover">
                        <SafeImage
                          src={row.side.image}
                          alt={text(row.side.title, row.side.titleEn)}
                          className="img-fluid"
                          width={240}
                        />
                      </div>
                    </div>
                  </Link>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** উচ্চ শিক্ষা / ফসল — featured + thumb list + arrow list + sidebar */
function CategorySpotlight({
  title,
  slug,
  articles,
  latest,
  popular,
  adOffset = 2,
  companion = null,
  sideCategory = null,
}) {
  const { text } = useLang()
  const { ads } = useSiteData()
  const featured = articles[0]
  const thumbList = articles.slice(1, 4)
  const arrowList = articles.slice(4, 7)
  if (!featured) return null
  const featuredTitle = text(featured.title, featured.titleEn)
  const featuredExcerpt = text(featured.excerpt, featured.excerptEn)
  const companionAside =
    companion?.articles?.length ? (
      <CategoryMotamot
        title={companion.title}
        slug={companion.slug}
        articles={companion.articles}
        embedded
      />
    ) : null

  return (
    <section className={`mt-3 cat-section-with-ad home-layout-spotlight${slug === 'motamot' ? ' home-layout-motamot' : ''}${companionAside ? ' home-gobeshona-motamot' : ''}`}>
      <div className="container">
        <div className="row align-items-start">
          <div className="col-lg-9">
            <div className="common-border-box">
              <SectionHead title={title} slug={slug} />
              <div className="row home-spotlight-inner align-items-start">
                <div className={`home-spotlight-featured ${thumbList.length || arrowList.length ? 'col-lg-4' : 'col-12'}`}>
                  <div className="news-list pg-details">
                    <Link to={articlePath(featured)}>
                      <div className="img-zoom-hover mb-2">
                        <SafeImage src={featured.image} alt={featuredTitle} className="img-fluid" />
                      </div>
                      <h4 className="title featured-main-title">{featuredTitle}</h4>
                      {featuredExcerpt ? (
                        <p className="description featured-subtitle">{featuredExcerpt}</p>
                      ) : null}
                      {featured.date ? (
                        <span className="featured-date">
                          <i className="fa-regular fa-clock me-1" />
                          {featured.date}
                        </span>
                      ) : null}
                    </Link>
                  </div>
                </div>
                {thumbList.length ? (
                <div className="col-lg-4 home-spotlight-thumbs">
                  {thumbList.map((item) => (
                    <div key={item.id} className="news-list">
                      <Link to={articlePath(item)}>
                        <div className="row g-2 align-items-start">
                          <div className="col-5">
                            <div className="img-zoom-hover">
                              <SafeImage src={item.image} alt={text(item.title, item.titleEn)} className="img-fluid" />
                            </div>
                          </div>
                          <div className="col-7">
                            <h4 className="title">{text(item.title, item.titleEn)}</h4>
                            {item.date ? <span>{item.date}</span> : null}
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
                ) : null}
                {arrowList.length ? (
                <div className="col-lg-4 home-spotlight-arrows">
                  {arrowList.map((item) => (
                    <div key={item.id} className="news-list-arrow">
                      <Link to={articlePath(item)}>
                        <h4 className="title">{text(item.title, item.titleEn)}</h4>
                        {item.date ? <span>{item.date}</span> : null}
                      </Link>
                    </div>
                  ))}
                </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="col-lg-3">
            {companionAside ||
              (sideCategory?.articles?.length ? (
                <>
                  <div className="cat-side-ad mb-3">
                    <AdSlider ads={ads} position="sidebar" variant="side" startOffset={adOffset} />
                  </div>
                  <CollegeCategoryStack
                    title={sideCategory.title}
                    slug={sideCategory.slug}
                    articles={sideCategory.articles}
                  />
                </>
              ) : (
                <CategorySideColumn latest={latest} popular={popular} adOffset={adOffset} />
              ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/** জাতীয় / আন্তর্জাতিক / কৃষি উদ্যোক্তা — tall featured + 3×2 small cards */
function CategoryHeroGridInner({ title, slug, articles, pairedHead = false }) {
  const { text } = useLang()
  const featured = articles[0]
  const grid = completeRows(articles.slice(1), 3).slice(0, 6)
  if (!featured || !grid.length) return null
  const featuredTitle = text(featured.title, featured.titleEn)
  const featuredExcerpt = text(featured.excerpt, featured.excerptEn)

  return (
    <div className="common-border-box">
      <SectionHead title={title} slug={slug} />
      <div className="row">
        <div className="col-lg-4 home-hero-featured">
          <div className="news-list pg-details h-100">
            <Link to={articlePath(featured)}>
              <div className="img-zoom-hover mb-2">
                <SafeImage src={featured.image} alt={featuredTitle} className="img-fluid" />
              </div>
              <h4 className="title featured-main-title">{featuredTitle}</h4>
              {featuredExcerpt ? (
                <p className="description featured-subtitle">{featuredExcerpt}</p>
              ) : null}
              {featured.date ? (
                <span className="featured-date">
                  <i className="fa-regular fa-clock me-1" />
                  {featured.date}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
        <div className="col-lg-8">
          <div className="row equal-news-grid home-hero-mini-grid">
            {grid.map((item, i) => (
              <div
                key={item.id}
                className={`col-12 col-lg-4${i % 3 !== 2 ? ' border-right' : ''}${i >= 3 ? ' border-sm-top' : ''}`}
              >
                <div className="news-sm">
                  <Link to={articlePath(item)}>
                    <div className="img-zoom-hover">
                      <SafeImage src={item.image} alt={text(item.title, item.titleEn)} className="img-fluid" />
                    </div>
                    <h4 className="title">{text(item.title, item.titleEn)}</h4>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryHeroGrid({ title, slug, articles, sideCategory = null, adOffset = 2 }) {
  const { ads } = useSiteData()
  const featured = articles[0]
  const grid = completeRows(articles.slice(1), 3).slice(0, 6)
  if (!featured || !grid.length) return null
  const inner = <CategoryHeroGridInner title={title} slug={slug} articles={articles} />
  if (!sideCategory?.articles?.length) {
    return (
      <section className="mt-3 home-layout-hero-grid">
        <div className="container">{inner}</div>
      </section>
    )
  }
  return (
    <section className="mt-3 cat-section-with-ad home-layout-hero-grid">
      <div className="container">
        <div className="row align-items-start">
          <div className="col-lg-9">{inner}</div>
          <div className="col-lg-3">
            <div className="cat-side-ad mb-3">
              <AdSlider ads={ads} position="sidebar" variant="side" startOffset={adOffset} />
            </div>
            <CollegeCategoryStack
              title={sideCategory.title}
              slug={sideCategory.slug}
              articles={sideCategory.articles}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function CategoryHeroGridWithSidebar({
  title,
  slug,
  articles,
  latest,
  popular,
  adOffset = 2,
  sideCategory = null,
}) {
  const { ads } = useSiteData()
  const featured = articles[0]
  const grid = completeRows(articles.slice(1), 3).slice(0, 6)
  if (!featured || !grid.length) return null
  const kothaBound = slug === 'krishoker-kotha' || String(title || '').includes('কৃষকের কথা')
  const showCollegeSide = Boolean(sideCategory?.articles?.length)
  return (
    <section className={`mt-3 cat-section-with-ad home-layout-hero-grid${kothaBound ? ' home-kotha-bound' : ''}`}>
      <div className="container">
        <div className="row align-items-start">
          <div className="col-lg-9">
            <CategoryHeroGridInner
              title={title}
              slug={slug}
              articles={articles}
              pairedHead={kothaBound}
            />
          </div>
          <div className="col-lg-3">
            {showCollegeSide ? (
              <>
                <div className="cat-side-ad mb-3">
                  <AdSlider ads={ads} position="sidebar" variant="side" startOffset={adOffset} />
                </div>
                <CollegeCategoryStack
                  title={sideCategory.title}
                  slug={sideCategory.slug}
                  articles={sideCategory.articles}
                />
              </>
            ) : (
              <CategorySideColumn latest={latest} popular={popular} adOffset={adOffset} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/** 1 featured + 3 + 3 small cards — 7 items, no empty cells */
function CategoryFeaturedSplit({ title, slug, articles, sideCategory = null, adOffset = 2 }) {
  const { ads } = useSiteData()
  const { text } = useLang()
  const featured = articles[0]
  const mid = completeRows(articles.slice(1, 4), 3)
  const right = completeRows(articles.slice(4, 7), 3)
  if (!featured || (!mid.length && !right.length)) return null
  const col = right.length ? 'col-lg-4' : 'col-lg-6'
  const box = (
    <div className="common-border-box">
      <SectionHead title={title} slug={slug} />
      <div className="row home-split-row">
        <div className={`${col} home-split-featured`}>
          <div className="news-list pg-details h-100">
            <Link to={articlePath(featured)}>
              <div className="img-zoom-hover mb-2">
                <SafeImage src={featured.image} alt={text(featured.title, featured.titleEn)} className="img-fluid" />
              </div>
              <h4 className="title">{text(featured.title, featured.titleEn)}</h4>
              {featured.excerpt ? (
                <p className="description">{text(featured.excerpt, featured.excerptEn)}</p>
              ) : null}
              {featured.date ? <span>{featured.date}</span> : null}
            </Link>
          </div>
        </div>
        {mid.length ? (
          <div className={col}>
            {mid.map((item) => (
              <div key={item.id} className="news-sm mb-3">
                <Link to={articlePath(item)}>
                  <div className="img-zoom-hover">
                    <SafeImage src={item.image} alt={text(item.title, item.titleEn)} className="img-fluid" />
                  </div>
                  <h4 className="title">{text(item.title, item.titleEn)}</h4>
                </Link>
              </div>
            ))}
          </div>
        ) : null}
        {right.length ? (
          <div className="col-lg-4">
            {right.map((item) => (
              <div key={item.id} className="news-sm mb-3">
                <Link to={articlePath(item)}>
                  <div className="img-zoom-hover">
                    <SafeImage src={item.image} alt={text(item.title, item.titleEn)} className="img-fluid" />
                  </div>
                  <h4 className="title">{text(item.title, item.titleEn)}</h4>
                </Link>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )

  if (!sideCategory?.articles?.length) {
    return (
      <section className="mt-3 home-layout-featured-split">
        <div className="container">{box}</div>
      </section>
    )
  }

  return (
    <section className="mt-3 cat-section-with-ad home-layout-featured-split">
      <div className="container">
        <div className="row align-items-start">
          <div className="col-lg-9">{box}</div>
          <div className="col-lg-3">
            <div className="cat-side-ad mb-3">
              <AdSlider ads={ads} position="sidebar" variant="side" startOffset={adOffset} />
            </div>
            <CollegeCategoryStack
              title={sideCategory.title}
              slug={sideCategory.slug}
              articles={sideCategory.articles}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

/** মাধ্যমিক — full-width 4×2 grid */
function CategoryGrid8({ title, slug, articles, sideCategory = null, adOffset = 2 }) {
  const { ads } = useSiteData()
  const { text } = useLang()
  const cards = completeRows(articles.slice(0, 8), 4)
  if (!cards.length) return null
  const showCollegeSide = sideCategory?.articles?.length
  const box = (
    <div className="common-border-box">
      <SectionHead title={title} slug={slug} />
      <div className="row equal-news-grid home-grid-8">
        {cards.map((item, i) => (
          <div
            key={item.id}
            className={`col-6 col-lg-3${i % 4 !== 3 ? ' border-right' : ''}${i >= 4 ? ' border-sm-top home-grid-8-row2' : ''}`}
          >
            <div className="news-sm">
              <Link to={articlePath(item)}>
                <div className="img-zoom-hover">
                  <SafeImage src={item.image} alt={text(item.title, item.titleEn)} className="img-fluid" />
                </div>
                <h4 className="title">{text(item.title, item.titleEn)}</h4>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (!showCollegeSide) {
    return (
      <section className="mt-3 home-layout-grid8">
        <div className="container">{box}</div>
      </section>
    )
  }

  return (
    <section className="mt-3 cat-section-with-ad home-layout-grid8">
      <div className="container">
        <div className="row align-items-start">
          <div className="col-lg-9">{box}</div>
          <div className="col-lg-3">
            <div className="cat-side-ad mb-3">
              <AdSlider ads={ads} position="sidebar" variant="side" startOffset={adOffset} />
            </div>
            <CollegeCategoryStack
              title={sideCategory.title}
              slug={sideCategory.slug}
              articles={sideCategory.articles}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Education Bangla category: col-lg-9 (3×3 news-sm) + col-lg-3 (ads + সর্বশেষ) */
function CategoryRow({ title, slug, articles, latest, popular, adOffset = 2, sideCategory = null }) {
  const { ads } = useSiteData()
  const { text } = useLang()
  const cards = completeRows(articles.slice(0, 9), 3)
  if (!cards.length) return null
  const showCollegeSide = sideCategory?.articles?.length
  return (
    <section className="mt-3 cat-section-with-ad">
      <div className="container">
        <div className="row align-items-start">
          <div className="col-lg-9">
            <div className="common-border-box" style={{ height: 'auto' }}>
              <SectionHead title={title} slug={slug} />
              <div className="row equal-news-grid cat-news-grid-9">
                {cards.map((item, i) => (
                  <div
                    key={item.id}
                    className={`col-12 col-lg-4${i % 3 !== 2 ? ' border-right' : ''}${
                      i >= 3 ? ' border-sm-top' : ''
                    }`}
                  >
                    <div className="news-sm">
                      <Link to={articlePath(item)}>
                        <div className="img-zoom-hover">
                          <SafeImage src={item.image} alt={text(item.title, item.titleEn)} className="img-fluid" />
                        </div>
                        <h4 className="title">{text(item.title, item.titleEn)}</h4>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-lg-3">
            {showCollegeSide ? (
              <>
                <div className="cat-side-ad mb-3">
                  <AdSlider ads={ads} position="sidebar" variant="side" startOffset={adOffset} />
                </div>
                <CollegeCategoryStack
                  title={sideCategory.title}
                  slug={sideCategory.slug}
                  articles={sideCategory.articles}
                />
              </>
            ) : (
              <CategorySideColumn latest={latest} popular={popular} adOffset={adOffset} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Variant: Sidebar on the Left (Right to Left flow) */
function CategorySidebarLeft({ title, slug, articles, latest, popular }) {
  const cards = articles.slice(0, 6)
  return (
    <section className="mt-3">
      <div className="container">
        <div className="row flex-row-reverse">
          <div className="col-lg-9">
            <div className="common-border-box">
              <SectionHead title={title} slug={slug} />
              <div className="row">
                {cards.map((item, i) => (
                  <div key={item.id} className="col-lg-4 col-md-6 mb-3">
                    <div className="news-sm" style={{ background: '#f8f9fa', borderRadius: '8px', padding: '10px' }}>
                      <Link to={item.path || `/news/${item.slug || item.id}`}>
                        <div className="img-zoom-hover rounded">
                          <SafeImage src={item.image} alt={item.title} className="img-fluid" />
                        </div>
                        <h4 className="title mt-2" style={{ fontSize: '18px' }}>{item.title}</h4>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-lg-3">
            <Sidebar latest={latest} popular={popular} compact />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Variant: Masonry / Featured Grid */
function CategoryMasonry({ title, slug, articles }) {
  const first = articles[0]
  const rest = articles.slice(1, 5)
  if (!first) return null

  return (
    <section className="mt-3">
      <div className="container">
        <div className="common-border-box">
          <SectionHead title={title} slug={slug} />
          <div className="row g-3">
            <div className="col-lg-6">
              <div className="news-sm position-relative">
                <Link to={first.path || `/news/${first.slug || first.id}`}>
                  <div className="img-zoom-hover rounded">
                    <SafeImage src={first.image} alt={first.title} className="img-fluid" />
                  </div>
                  <div className="position-absolute bottom-0 w-100 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
                    <h4 className="title text-white" style={{ fontSize: '24px', fontWeight: 700 }}>{first.title}</h4>
                    {first.excerpt && <p className="description text-white-50 m-0">{first.excerpt.substring(0, 100)}...</p>}
                  </div>
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="row g-3">
                {rest.map((item) => (
                  <div key={item.id} className="col-sm-6">
                    <div className="news-sm">
                      <Link to={item.path || `/news/${item.slug || item.id}`}>
                        <div className="img-zoom-hover rounded">
                          <SafeImage src={item.image} alt={item.title} className="img-fluid" />
                        </div>
                        <h4 className="title mt-2" style={{ fontSize: '16px', lineHeight: '22px' }}>{item.title}</h4>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Variant: 3 Columns Grid */
function CategoryGrid3({ title, slug, articles }) {
  const items = articles.slice(0, 6)
  return (
    <section className="mt-3">
      <div className="container">
        <div className="common-border-box">
          <SectionHead title={title} slug={slug} />
          <div className="row g-3">
            {items.map((item) => (
              <div key={item.id} className="col-lg-4 col-md-6">
                <div className="news-sm" style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                  <Link to={item.path || `/news/${item.slug || item.id}`}>
                    <div className="img-zoom-hover">
                      <SafeImage src={item.image} alt={item.title} className="img-fluid" />
                    </div>
                    <div className="p-3">
                      <h4 className="title" style={{ fontSize: '18px' }}>{item.title}</h4>
                      {item.excerpt && <p className="description mt-1 mb-0">{item.excerpt.substring(0, 80)}...</p>}
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Variant: List Layout (Horizontal Cards) */
function CategoryList({ title, slug, articles, latest, popular }) {
  const cards = articles.slice(0, 5)
  return (
    <section className="mt-3">
      <div className="container">
        <div className="row">
          <div className="col-lg-8">
            <div className="common-border-box">
              <SectionHead title={title} slug={slug} />
              <div className="d-flex flex-column gap-3">
                {cards.map((item) => (
                  <div key={item.id} className="news-list-item" style={{ paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                    <div className="row g-3 align-items-start">
                      <div className="col-4">
                        <Link to={item.path || `/news/${item.slug || item.id}`}>
                          <div className="img-zoom-hover rounded">
                            <SafeImage src={item.image} alt={item.title} className="img-fluid" />
                          </div>
                        </Link>
                      </div>
                      <div className="col-8">
                        <Link to={item.path || `/news/${item.slug || item.id}`}>
                          <h4 className="title mb-2" style={{ fontSize: '20px', fontWeight: 600 }}>{item.title}</h4>
                          {item.excerpt && <p className="description m-0 text-muted">{item.excerpt.substring(0, 120)}...</p>}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <Sidebar latest={latest} popular={popular} compact />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Variant: Overlay Grid */
function CategoryOverlay({ title, slug, articles }) {
  const items = articles.slice(0, 4)
  return (
    <section className="mt-4">
      <div className="container">
        <div className="common-border-box">
          <SectionHead title={title} slug={slug} />
          <div className="row g-3">
            {items.map((item) => (
              <div key={item.id} className="col-lg-3 col-md-6">
                <div className="position-relative overflow-hidden rounded">
                  <Link to={item.path || `/news/${item.slug || item.id}`}>
                    <div className="img-zoom-hover">
                      <SafeImage src={item.image} alt={item.title} className="img-fluid" />
                    </div>
                    <div className="position-absolute bottom-0 w-100 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)' }}>
                      <h4 className="title text-white m-0" style={{ fontSize: '16px', lineHeight: '1.4' }}>{item.title}</h4>
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const LIVESTOCK_POLL = {
  question: 'গবাদি পশু ও হাঁস-মুরগি খাতে কোন উদ্যোগ এখন সবচেয়ে জরুরি?',
  options: [
    'কৃত্রিম প্রজনন সম্প্রসারণ',
    'পশুখাদ্যের দাম কমানো',
    'ভেটেরিনারি সেবা বাড়ানো',
    'খামারিদের প্রশিক্ষণ',
  ],
}

function LivestockPoll() {
  const storageKey = 'kk_poll_prani'
  const fallback = LIVESTOCK_POLL
  const [poll, setPoll] = useState(null)
  const [choice, setChoice] = useState('')
  const [counts, setCounts] = useState(() => fallback.options.map(() => 0))
  const [showResult, setShowResult] = useState(false)
  const active = poll || fallback
  const total = counts.reduce((sum, n) => sum + n, 0)

  useEffect(() => {
    let alive = true
    api
      .getPublicPoll()
      .then((item) => {
        if (!alive || !item?.question || !item.options?.length) return
        setPoll(item)
        setCounts(item.options.map((_, i) => Number(item.votes?.[i]) || 0))
        try {
          if (localStorage.getItem(`kk_poll_voted_${item._id}`)) setShowResult(true)
        } catch {
          /* ignore */
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  function saveLocal(next) {
    setCounts(next)
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  async function vote() {
    if (!choice) return
    const index = active.options.indexOf(choice)
    if (index < 0) return
    if (poll?._id) {
      try {
        const updated = await api.votePoll(poll._id, index)
        setCounts((updated.options || []).map((_, i) => Number(updated.votes?.[i]) || 0))
        try {
          localStorage.setItem(`kk_poll_voted_${poll._id}`, '1')
        } catch {
          /* ignore */
        }
        setShowResult(true)
        return
      } catch {
        /* fall through to local */
      }
    }
    const next = counts.map((n, i) => (i === index ? n + 1 : n))
    saveLocal(next)
    setShowResult(true)
  }

  return (
    <div className="livestock-poll">
      <div className="livestock-poll-head">অনলাইন জরিপ</div>
      <div className="livestock-poll-body">
        <p className="livestock-poll-q">{active.question}</p>
        {active.options.map((opt) => {
          const n = counts[active.options.indexOf(opt)] || 0
          const pct = total ? Math.round((n / total) * 100) : 0
          return (
            <label key={opt} className="livestock-poll-opt">
              <input
                type="radio"
                name="livestock-poll"
                value={opt}
                checked={choice === opt}
                onChange={() => setChoice(opt)}
              />
              <span>
                {opt}
                {showResult ? ` — ${pct}%` : ''}
              </span>
            </label>
          )
        })}
        <div className="livestock-poll-actions">
          <button type="button" className="livestock-poll-vote" onClick={vote}>
            ভোট
          </button>
          <button type="button" className="livestock-poll-result" onClick={() => setShowResult(true)}>
            ফলাফল
          </button>
        </div>
      </div>
    </div>
  )
}

function LivestockSmallCard({ item, text }) {
  return (
    <div className="news-sm livestock-sm">
      <Link to={articlePath(item)}>
        <div className="img-zoom-hover">
          <SafeImage src={item.image} alt={text(item.title, item.titleEn)} className="img-fluid" />
        </div>
        <h4 className="title">{text(item.title, item.titleEn)}</h4>
      </Link>
    </div>
  )
}

/** প্রাণিসম্পদ — featured + 2 small, then 4-card row, plus অনলাইন জরিপ */
function CategoryLivestock({ title, slug, articles }) {
  const { text } = useLang()
  const featured = articles[0]
  const topSmall = articles.slice(1, 3)
  const bottomRow = completeRows(articles.slice(3, 7), 4)
  if (!featured) return null

  return (
    <section className="mt-3 home-layout-livestock">
      <div className="container">
        <div className="row">
          <div className="col-lg-9">
            <div className="common-border-box">
              <SectionHead title={title} slug={slug} />
              <div className="row equal-news-grid livestock-row-1">
                <div className="col-lg-6 livestock-feature-col border-right">
                  <Link to={articlePath(featured)} className="news-list bg-black livestock-feature">
                    <div className="livestock-feature-copy">
                      <h4 className="title text-white">{text(featured.title, featured.titleEn)}</h4>
                      {featured.excerpt ? (
                        <p className="description">{text(featured.excerpt, featured.excerptEn)}</p>
                      ) : null}
                    </div>
                    <div className="livestock-feature-media">
                      <div className="img-zoom-hover">
                        <SafeImage
                          src={featured.image}
                          alt={text(featured.title, featured.titleEn)}
                          className="img-fluid"
                          width={360}
                        />
                      </div>
                    </div>
                  </Link>
                </div>
                {topSmall.map((item, i) => (
                  <div
                    key={item.id}
                    className={`col-6 col-lg-3 livestock-sm-col${i === 0 ? ' border-right' : ''}`}
                  >
                    <LivestockSmallCard item={item} text={text} />
                  </div>
                ))}
              </div>
              {bottomRow.length ? (
                <div className="row equal-news-grid livestock-row-2">
                  {bottomRow.map((item, i) => (
                    <div
                      key={item.id}
                      className={`col-6 col-lg-3${i < bottomRow.length - 1 ? ' border-right' : ''}`}
                    >
                      <LivestockSmallCard item={item} text={text} />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className="col-lg-3 livestock-poll-col">
            <LivestockPoll />
          </div>
        </div>
      </div>
    </section>
  )
}

const FISHERIES_FALLBACK_TOPICS = [
  { nameBn: 'পুকুর চাষ', nameEn: 'Pond', slug: 'pukur', keywords: /পুকুর|পোনা|হ্যাচারি|খাবার|ভাসমান|মিশ্র চাষ/ },
  { nameBn: 'চিংড়ি', nameEn: 'Shrimp', slug: 'chingri', keywords: /চিংড়ি|কাঁকড়া|রপ্তানি/ },
  { nameBn: 'ইলিশ', nameEn: 'Hilsa', slug: 'ilish', keywords: /ইলিশ|হাওর|পদ্মা|অভয়াশ্রম|নিষেধাজ্ঞা|সংরক্ষণ/ },
  { nameBn: 'বায়োফ্লক', nameEn: 'Biofloc', slug: 'biofloc', keywords: /বায়োফ্লক|প্রযুক্তি|প্রশিক্ষণ|পদ্ধতি/ },
  { nameBn: 'মাছ চাষ', nameEn: 'Fish Farm', slug: 'mach-chash', keywords: /মাছ চাষ|মিশ্র মাছ|তেলাপিয়া|রুই|কাতলা/ },
  { nameBn: 'হাওর', nameEn: 'Haor', slug: 'haor', keywords: /হাওর|বিল|জলাশয়|খাল/ },
  { nameBn: 'মৎস্য রপ্তানি', nameEn: 'Export', slug: 'export', keywords: /রপ্তানি|বাজার|মৎস্যপণ্য/ },
  { nameBn: 'প্রশিক্ষণ', nameEn: 'Training', slug: 'motso-training', keywords: /প্রশিক্ষণ|কর্মশালা|সচেতনতা/ },
]

const FISHERIES_KEYWORDS = Object.fromEntries(FISHERIES_FALLBACK_TOPICS.map((t) => [t.slug, t.keywords]))

function fisheriesTopics(subs, categorySlug, limit = 8) {
  const active = (subs || []).filter((s) => s.isActive !== false)
  const homeTopics = active
    .filter((s) => s.showOnHome)
    .sort((a, b) => (a.homeOrder || 0) - (b.homeOrder || 0) || (a.order || 0) - (b.order || 0))
  const fromDb = (homeTopics.length ? homeTopics : active.filter((s) => s.category?.slug === categorySlug))
    .sort((a, b) =>
      homeTopics.length
        ? (a.homeOrder || 0) - (b.homeOrder || 0) || (a.order || 0) - (b.order || 0)
        : (a.order || 0) - (b.order || 0),
    )
    .map((s) => ({
      _id: s._id,
      nameBn: s.nameBn,
      nameEn: s.nameEn || '',
      slug: s.slug,
      hasSub: true,
      keywords: FISHERIES_KEYWORDS[s.slug] || null,
      featuredId: s.homeFeatured || '',
      secondaryIds: s.homeSecondary || [],
    }))

  if (homeTopics.length) return fromDb.slice(0, limit)

  const topics = [...fromDb]
  const used = new Set(topics.map((t) => t.slug))
  for (const fb of FISHERIES_FALLBACK_TOPICS) {
    if (topics.length >= limit) break
    if (used.has(fb.slug)) continue
    topics.push({ ...fb, hasSub: false, featuredId: '', secondaryIds: [] })
    used.add(fb.slug)
  }
  return topics.slice(0, limit)
}

function articleFitsFisheriesTopic(article, topic) {
  const subSlug = article.subcategorySlug || article.subcategory?.slug || article.raw?.subcategory?.slug || ''
  const subId = article.subcategoryId || article.subcategory?._id || article.raw?.subcategory?._id || article.subcategory
  if (topic._id && subId && String(subId) === String(topic._id)) return true
  if (subSlug && subSlug === topic.slug) return true
  const hay = `${article.title || ''} ${article.titleEn || ''} ${article.excerpt || ''}`
  if (topic.nameBn && hay.includes(topic.nameBn)) return true
  if (topic.keywords && topic.keywords.test(hay)) return true
  return false
}

function buildFisheriesColumns(articles, topics) {
  const byId = new Map((articles || []).map((item) => [String(item.id || item._id), item]))
  const cols = topics.map((t) => {
    const items = []
    const used = new Set()
    const pushId = (id) => {
      const art = byId.get(String(id || ''))
      if (!art || used.has(String(art.id))) return
      used.add(String(art.id))
      items.push(art)
    }
    pushId(t.featuredId)
    ;(t.secondaryIds || []).forEach(pushId)
    return { ...t, items, used }
  })
  const leftover = []
  articles.forEach((article) => {
    const already = cols.some((c) => c.used.has(String(article.id)))
    if (already) return
    const idx = cols.findIndex((c) => articleFitsFisheriesTopic(article, c))
    if (idx >= 0) {
      cols[idx].items.push(article)
      cols[idx].used.add(String(article.id))
    } else leftover.push(article)
  })
  leftover.forEach((article) => {
    const empty = cols.find((c) => !c.items.length)
    if (!empty) return
    empty.items.push(article)
    empty.used.add(String(article.id))
  })

  cols.forEach((col) => {
    col.items = col.items.slice(0, 8)
  })
  return cols.filter((col) => col.items.length)
}

function FisheriesColumn({ topic, items, parentSlug, text, extraCount = 2 }) {
  const featured = items[0]
  const rest = items.slice(1, 1 + extraCount)
  const moreHref =
    topic.hasSub && topic.slug
      ? `/category/${topic.parentSlug || parentSlug}?sub=${topic.slug}`
      : `/category/${parentSlug}`
  if (!featured) return null

  return (
    <div className="col-12 col-md-6 col-lg-3 fisheries-col">
      <div className="fisheries-col-head">
        <h3>
          <Link to={moreHref}>{text(topic.nameBn, topic.nameEn)}</Link>
          <i className="fa-solid fa-angle-right fisheries-head-caret" aria-hidden="true" />
        </h3>
        <Link to={moreHref} className="fisheries-more">
          আরও <i className="fa-solid fa-angle-right" />
        </Link>
      </div>
      <Link to={articlePath(featured)} className="fisheries-featured">
        <div className="img-zoom-hover">
          <SafeImage src={featured.image} alt={text(featured.title, featured.titleEn)} className="img-fluid" />
        </div>
        <h4 className="title">{text(featured.title, featured.titleEn)}</h4>
      </Link>
      {rest.map((item) => (
        <Link key={item.id} to={articlePath(item)} className="fisheries-line">
          <i className="fa-solid fa-angle-right fisheries-line-caret" aria-hidden="true" />
          <h4 className="title">{text(item.title, item.titleEn)}</h4>
        </Link>
      ))}
    </div>
  )
}

/** মৎস্য সম্পদ — 4 equal topic columns */
function CategoryFisheries({ slug, articles }) {
  const { text } = useLang()
  const { subs, recent, topicGrid, settings } = useSiteData()
  const limit = Number(settings?.topicGridLimit) > 0 ? Number(settings.topicGridLimit) : 8
  const adminColumns = (topicGrid || [])
    .filter((col) => col.items?.length)
    .slice(0, limit)
    .map((col) => ({
      ...col,
      hasSub: true,
    }))
  const seen = new Set()
  const pool = []
  ;[...(articles || []), ...((recent || []).filter((item) => item.category === slug))].forEach((item) => {
    if (!item?.id || seen.has(item.id)) return
    seen.add(item.id)
    pool.push(item)
  })
  const columns = adminColumns.length
    ? adminColumns
    : buildFisheriesColumns(pool, fisheriesTopics(subs, slug, limit))
  if (!columns.length) return null

  return (
    <section className="mt-3 home-layout-fisheries">
      <div className="container">
        <div className="common-border-box">
          <div className="row fisheries-row">
            {columns.map((col, index) => (
              <FisheriesColumn
                key={col.slug || col.nameBn}
                topic={col}
                items={col.items}
                parentSlug={slug}
                text={text}
                extraCount={
                  col.slug === 'biofloc' || String(col.nameBn || '').includes('বায়োফ্লক')
                    ? 3
                    : index < 4
                      ? 2
                      : 3
                }
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export const HOME_LAYOUT_CYCLE = ['spotlight', 'heroGrid', 'featuredSplit', 'grid8', 'default']

/** Homepage sections that use the বিনোদন 3-column layout */
export const BINODON_LAYOUT_SLUGS = new Set([
  'pani',
])

export function usesBinodonLayout(cat) {
  if (!cat) return false
  if (BINODON_LAYOUT_SLUGS.has(cat.slug)) return true
  const name = String(cat.name || '')
  return name.includes('পানি সম্পদ')
}

export function usesProshasonLayout(cat) {
  if (!cat) return false
  if (cat.slug === 'proshason') return true
  const name = String(cat.name || '')
  return name.includes('কৃষি প্রশাসন')
}

export function usesProjuktiLayout(cat) {
  if (!cat) return false
  if (cat.slug === 'projukti') return true
  const name = String(cat.name || '')
  return name.includes('কৃষি প্রযুক্তি')
}

export function usesUddoktaHeroLayout(cat) {
  if (!cat) return false
  if (cat.slug === 'uddokta') return true
  const name = String(cat.name || '')
  return name.includes('কৃষি উদ্যোক্তা') || name.includes('কৃষি উদ্যোগ')
}

export function usesMotamotLayout(cat) {
  if (!cat) return false
  if (cat.slug === 'motamot') return true
  const name = String(cat.name || '')
  return name.includes('মতামত')
}

export function usesGobeshonaLayout(cat) {
  if (!cat) return false
  if (cat.slug === 'gobeshona') return true
  const name = String(cat.name || '')
  return name.includes('কৃষি গবেষণা')
}

export function usesKrishokerKothaLayout(cat) {
  if (!cat) return false
  if (cat.slug === 'krishoker-kotha') return true
  return String(cat.name || '').includes('কৃষকের কথা')
}

export function usesShikkhaLayout(cat) {
  if (!cat) return false
  if (cat.slug === 'shikkha') return true
  return String(cat.name || '').includes('কৃষি শিক্ষা')
}

export default function CategorySection({
  title,
  slug,
  articles = [],
  variant = 'default',
  sidebarLatest = null,
  sidebarPopular = null,
  adOffset = 2,
  companion = null,
  sideCategory = null,
}) {
  if (!articles.length) return null
  if (variant === 'grid4') {
    return <Grid4 title={title} slug={slug} articles={articles} />
  }
  if (variant === 'motamot') {
    return <CategoryMotamot title={title} slug={slug} articles={articles} />
  }
  if (variant === 'binodon') {
    return <CategoryBinodon title={title} slug={slug} articles={articles} />
  }
  if (variant === 'proshason') {
    return <CategoryProshason title={title} slug={slug} articles={articles} />
  }
  if (variant === 'projukti') {
    return <CategoryProjukti title={title} slug={slug} articles={articles} />
  }
  if (variant === 'adminRows') {
    return <CategoryAdminRows title={title} slug={slug} articles={articles} />
  }
  if (variant === 'livestock') {
    return <CategoryLivestock title={title} slug={slug} articles={articles} />
  }
  if (variant === 'fisheries') {
    return <CategoryFisheries title={title} slug={slug} articles={articles} />
  }
  if (variant === 'specialReport') {
    return <CategorySpecialReport title={title} slug={slug} articles={articles} />
  }
  if (variant === 'spotlight') {
    return (
      <CategorySpotlight
        title={title}
        slug={slug}
        articles={articles}
        latest={sidebarLatest}
        popular={sidebarPopular}
        adOffset={adOffset}
        companion={companion}
        sideCategory={sideCategory}
      />
    )
  }
  if (variant === 'heroGrid') {
    return (
      <CategoryHeroGrid
        title={title}
        slug={slug}
        articles={articles}
        sideCategory={sideCategory}
        adOffset={adOffset}
      />
    )
  }
  if (variant === 'heroGridSidebar') {
    return (
      <CategoryHeroGridWithSidebar
        title={title}
        slug={slug}
        articles={articles}
        latest={sidebarLatest}
        popular={sidebarPopular}
        adOffset={adOffset}
        sideCategory={sideCategory}
      />
    )
  }
  if (variant === 'featuredSplit') {
    return (
      <CategoryFeaturedSplit
        title={title}
        slug={slug}
        articles={articles}
        sideCategory={sideCategory}
        adOffset={adOffset}
      />
    )
  }
  if (variant === 'grid8') {
    return (
      <CategoryGrid8
        title={title}
        slug={slug}
        articles={articles}
        sideCategory={sideCategory}
        adOffset={adOffset}
      />
    )
  }
  if (variant === 'sidebarLeft') {
    return <CategorySidebarLeft title={title} slug={slug} articles={articles} latest={sidebarLatest} popular={sidebarPopular} />
  }
  if (variant === 'masonry') {
    return <CategoryMasonry title={title} slug={slug} articles={articles} />
  }
  if (variant === 'grid3') {
    return <CategoryGrid3 title={title} slug={slug} articles={articles} />
  }
  if (variant === 'list') {
    return <CategoryList title={title} slug={slug} articles={articles} latest={sidebarLatest} popular={sidebarPopular} />
  }
  if (variant === 'overlay') {
    return <CategoryOverlay title={title} slug={slug} articles={articles} />
  }
  return (
    <CategoryRow
      title={title}
      slug={slug}
      articles={articles}
      latest={sidebarLatest}
      popular={sidebarPopular}
      adOffset={adOffset}
      sideCategory={sideCategory}
    />
  )
}

export { BN_NUM, SectionHead }
