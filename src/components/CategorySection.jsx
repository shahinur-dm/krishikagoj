import { useState } from 'react'
import { Link } from 'react-router-dom'
import SafeImage from './SafeImage'
import Sidebar from './Sidebar'
import AdSlider from './AdSlider'
import { useSiteData } from '../context/SiteDataContext'
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

function SectionHead({ title, slug }) {
  return (
    <div className="section-title-flex">
      <div className="d-flex align-items-center">
        <i className="fa-solid fa-square" style={{ color: 'var(--bs-primary)', fontSize: 14 }} />
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
  return (
    <div className="news-list pg-details binodon-featured-card">
      <Link to={articlePath(item)}>
        <div className="img-zoom-hover mb-2">
          <SafeImage src={item.image} alt={text(item.title, item.titleEn)} className="img-fluid" />
        </div>
        <h4 className="title">{text(item.title, item.titleEn)}</h4>
        {item.excerpt ? <p className="description">{text(item.excerpt, item.excerptEn)}</p> : null}
        {item.date ? <span>{item.date}</span> : null}
      </Link>
    </div>
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
    <section className={`mt-3 home-layout-binodon${slug === 'bishesh' ? ' home-layout-bishesh' : ''}`}>
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

/** উচ্চ শিক্ষা — featured + thumb list + arrow list + sidebar */
function CategorySpotlight({ title, slug, articles, latest, popular, adOffset = 2 }) {
  const { text } = useLang()
  const featured = articles[0]
  const thumbList = articles.slice(1, 4)
  const arrowList = articles.slice(4, 7)
  if (!featured) return null

  return (
    <section className="mt-3 cat-section-with-ad home-layout-spotlight">
      <div className="container">
        <div className="row">
          <div className="col-lg-9">
            <div className="common-border-box">
              <SectionHead title={title} slug={slug} />
              <div className="row home-spotlight-inner">
                <div className="col-lg-4 home-spotlight-featured">
                  <div className="news-list pg-details">
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
              </div>
            </div>
          </div>
          <div className="col-lg-3">
            <CategorySideColumn latest={latest} popular={popular} adOffset={adOffset} />
          </div>
        </div>
      </div>
    </section>
  )
}

/** জাতীয় — tall featured + 3×2 small cards */
function CategoryHeroGrid({ title, slug, articles }) {
  const { text } = useLang()
  const featured = articles[0]
  const grid = completeRows(articles.slice(1), 3).slice(0, 6)
  if (!featured || !grid.length) return null

  return (
    <section className="mt-3 home-layout-hero-grid">
      <div className="container">
        <div className="common-border-box">
          <SectionHead title={title} slug={slug} />
          <div className="row">
            <div className="col-lg-4 home-hero-featured">
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
      </div>
    </section>
  )
}

/** 1 featured + 3 + 3 small cards — 7 items, no empty cells */
function CategoryFeaturedSplit({ title, slug, articles }) {
  const { text } = useLang()
  const featured = articles[0]
  const mid = completeRows(articles.slice(1, 4), 3)
  const right = completeRows(articles.slice(4, 7), 3)
  if (!featured || (!mid.length && !right.length)) return null
  const col = right.length ? 'col-lg-4' : 'col-lg-6'

  return (
    <section className="mt-3 home-layout-featured-split">
      <div className="container">
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
      </div>
    </section>
  )
}

/** মাধ্যমিক — full-width 4×2 grid */
function CategoryGrid8({ title, slug, articles }) {
  const { text } = useLang()
  const cards = completeRows(articles.slice(0, 8), 4)
  if (!cards.length) return null

  return (
    <section className="mt-3 home-layout-grid8">
      <div className="container">
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
      </div>
    </section>
  )
}

/** Education Bangla category: col-lg-9 (3×3 news-sm) + col-lg-3 (ads + সর্বশেষ) */
function CategoryRow({ title, slug, articles, latest, popular, adOffset = 2 }) {
  const { text } = useLang()
  const cards = completeRows(articles.slice(0, 9), 3)
  if (!cards.length) return null
  return (
    <section className="mt-3 cat-section-with-ad">
      <div className="container">
        <div className="row">
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
            <CategorySideColumn latest={latest} popular={popular} adOffset={adOffset} />
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
  const [choice, setChoice] = useState('')
  const [counts, setCounts] = useState(() => {
    if (typeof window === 'undefined') return LIVESTOCK_POLL.options.map(() => 0)
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || 'null')
      if (Array.isArray(raw) && raw.length === LIVESTOCK_POLL.options.length) return raw
    } catch {
      /* ignore */
    }
    return LIVESTOCK_POLL.options.map(() => 0)
  })
  const [showResult, setShowResult] = useState(() => counts.some((n) => n > 0))
  const total = counts.reduce((sum, n) => sum + n, 0)

  function saveCounts(next) {
    setCounts(next)
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  function vote() {
    if (!choice) return
    const index = LIVESTOCK_POLL.options.indexOf(choice)
    if (index < 0) return
    const next = counts.map((n, i) => (i === index ? n + 1 : n))
    saveCounts(next)
    setShowResult(true)
  }

  return (
    <div className="livestock-poll">
      <div className="livestock-poll-head">অনলাইন জরিপ</div>
      <div className="livestock-poll-body">
        <p className="livestock-poll-q">{LIVESTOCK_POLL.question}</p>
        {LIVESTOCK_POLL.options.map((opt) => {
          const n = counts[LIVESTOCK_POLL.options.indexOf(opt)] || 0
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
]

const FISHERIES_KEYWORDS = Object.fromEntries(FISHERIES_FALLBACK_TOPICS.map((t) => [t.slug, t.keywords]))

function fisheriesTopics(subs, categorySlug) {
  const fromDb = (subs || [])
    .filter((s) => s.category?.slug === categorySlug)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((s) => ({
      _id: s._id,
      nameBn: s.nameBn,
      nameEn: s.nameEn || '',
      slug: s.slug,
      hasSub: true,
      keywords: FISHERIES_KEYWORDS[s.slug] || null,
    }))

  const topics = [...fromDb]
  const used = new Set(topics.map((t) => t.slug))
  for (const fb of FISHERIES_FALLBACK_TOPICS) {
    if (topics.length >= 4) break
    if (used.has(fb.slug)) continue
    topics.push({ ...fb, hasSub: false })
    used.add(fb.slug)
  }
  return topics.slice(0, 4)
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
  const cols = topics.map((t) => ({ ...t, items: [] }))
  const leftover = []
  articles.forEach((article) => {
    const idx = cols.findIndex((c) => articleFitsFisheriesTopic(article, c))
    if (idx >= 0) cols[idx].items.push(article)
    else leftover.push(article)
  })
  leftover.forEach((article) => {
    let minI = 0
    for (let i = 1; i < cols.length; i += 1) {
      if (cols[i].items.length < cols[minI].items.length) minI = i
    }
    cols[minI].items.push(article)
  })

  for (let n = 0; n < 20; n += 1) {
    let rich = 0
    let poor = 0
    for (let i = 1; i < cols.length; i += 1) {
      if (cols[i].items.length > cols[rich].items.length) rich = i
      if (cols[i].items.length < cols[poor].items.length) poor = i
    }
    if (cols[rich].items.length <= cols[poor].items.length + 1) break
    if (cols[rich].items.length <= 2) break
    cols[poor].items.push(cols[rich].items.pop())
  }

  cols.forEach((col) => {
    col.items = col.items.slice(0, 4)
  })
  return cols.filter((col) => col.items.length)
}

function FisheriesColumn({ topic, items, parentSlug, text }) {
  const featured = items[0]
  const rest = items.slice(1)
  const moreHref = topic.hasSub && topic.slug ? `/category/${parentSlug}?sub=${topic.slug}` : `/category/${parentSlug}`
  if (!featured) return null

  return (
    <div className="col-12 col-md-6 col-lg-3 fisheries-col">
      <div className="fisheries-col-head">
        <h3>
          <Link to={moreHref}>{text(topic.nameBn, topic.nameEn)}</Link>
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
          <h4 className="title">{text(item.title, item.titleEn)}</h4>
        </Link>
      ))}
    </div>
  )
}

/** মৎস্য সম্পদ — 4 equal topic columns */
function CategoryFisheries({ slug, articles }) {
  const { text } = useLang()
  const { subs } = useSiteData()
  const columns = buildFisheriesColumns(articles, fisheriesTopics(subs, slug))
  if (!columns.length) return null

  return (
    <section className="mt-3 home-layout-fisheries">
      <div className="container">
        <div className="common-border-box">
          <div className="row fisheries-row">
            {columns.map((col) => (
              <FisheriesColumn
                key={col.slug || col.nameBn}
                topic={col}
                items={col.items}
                parentSlug={slug}
                text={text}
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
  'proshason',
  'pani',
  'bishesh',
  'projukti',
])

export function usesBinodonLayout(cat) {
  if (!cat) return false
  if (BINODON_LAYOUT_SLUGS.has(cat.slug)) return true
  const name = String(cat.name || '')
  return name.includes('পানি সম্পদ')
}

export default function CategorySection({
  title,
  slug,
  articles = [],
  variant = 'default',
  sidebarLatest = null,
  sidebarPopular = null,
  adOffset = 2,
}) {
  if (!articles.length) return null
  if (variant === 'grid4') {
    return <Grid4 title={title} slug={slug} articles={articles} />
  }
  if (variant === 'binodon') {
    return <CategoryBinodon title={title} slug={slug} articles={articles} />
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
  if (variant === 'spotlight') {
    return (
      <CategorySpotlight
        title={title}
        slug={slug}
        articles={articles}
        latest={sidebarLatest}
        popular={sidebarPopular}
        adOffset={adOffset}
      />
    )
  }
  if (variant === 'heroGrid') {
    return <CategoryHeroGrid title={title} slug={slug} articles={articles} />
  }
  if (variant === 'featuredSplit') {
    return <CategoryFeaturedSplit title={title} slug={slug} articles={articles} />
  }
  if (variant === 'grid8') {
    return <CategoryGrid8 title={title} slug={slug} articles={articles} />
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
    />
  )
}

export { BN_NUM, SectionHead }
