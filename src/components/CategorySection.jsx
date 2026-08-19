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

export const HOME_LAYOUT_CYCLE = ['spotlight', 'heroGrid', 'featuredSplit', 'grid8', 'default']

/** Homepage sections that use the বিনোদন 3-column layout */
export const BINODON_LAYOUT_SLUGS = new Set([
  'proshason',
  'gobeshona',
  'prani',
  'pani',
  'motso',
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
