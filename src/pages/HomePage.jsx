import { useEffect, useState } from 'react'
import { useSiteData } from '../context/SiteDataContext'
import LeadSection from '../components/LeadSection'
import CategorySection, {
  HOME_LAYOUT_CYCLE,
  usesBinodonLayout,
  usesGobeshonaLayout,
  usesMotamotLayout,
  usesProjuktiLayout,
  usesProshasonLayout,
  usesUddoktaHeroLayout,
  usesKrishokerKothaLayout,
  usesShikkhaLayout,
} from '../components/CategorySection'
import VideoGallerySection, { PhotoGallerySection } from '../components/VideoGallerySection'
import SeoHead from '../components/SeoHead'
import MidPageAds from '../components/MidPageAds'
import { useLang } from '../context/LanguageContext'

/** Category shown in the College-style stack beside বদলি. Change slug to swap the block. */
const BODOLI_SIDE_CATEGORY_SLUG = 'projukti'

function isBodoliCategory(cat) {
  return cat?.slug === 'bodoli' || String(cat?.name || '').includes('বদলি')
}

export default function HomePage() {
  const {
    headlines,
    featured,
    latest,
    popular,
    recent,
    leadLayout,
    videos,
    photos,
    categoryBlocks,
    settings,
    loading,
    error,
    ready,
  } = useSiteData()
  const { t } = useLang()
  const [showRest, setShowRest] = useState(false)

  useEffect(() => {
    if (!ready) return undefined
    const id = window.requestAnimationFrame(() => setShowRest(true))
    return () => window.cancelAnimationFrame(id)
  }, [ready])

  if (loading && !ready) {
    return (
      <div className="container py-4">
        <div className="home-skeleton">
          <div className="sk-block sk-lead" />
          <div className="row g-2 mt-2">
            <div className="col-6">
              <div className="sk-block sk-card" />
            </div>
            <div className="col-6">
              <div className="sk-block sk-card" />
            </div>
          </div>
          <p className="text-center text-muted mt-3 mb-0">খবর লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  if (error && !ready) {
    return <div className="container eb-error">লোড ত্রুটি: {error}</div>
  }

  const discussedArticles = featured.length ? featured : latest
  const discussedSlug = categoryBlocks[0]?.cat?.slug
  const siteName = settings?.siteName || 'কৃষিকাগজ'
  const seo = settings?.seo || {}
  const pageTitle = seo.metaTitle || `${siteName}${settings?.tagline ? ` | ${settings.tagline}` : ''}`
  const pageDesc =
    seo.metaDescription ||
    settings?.aboutUs ||
    settings?.tagline ||
    'বাংলাদেশের কৃষি খবর, ফসল, প্রাণিসম্পদ ও কৃষকের কথা।'
  const ogImage = seo.ogImage || settings?.logo || '/logo.png'
  const motamotBlock = categoryBlocks.find(
    (block) => usesMotamotLayout(block.cat) && block.articles?.length,
  )
  const gobeshonaHasNews = categoryBlocks.some(
    (block) => usesGobeshonaLayout(block.cat) && block.articles?.length,
  )
  const fisheriesBlock = categoryBlocks.find(
    (block) =>
      block.articles?.length &&
      (block.cat.slug === 'motso' || String(block.cat.name || '').includes('মৎস্য')),
  )
  const bodoliSideBlock = categoryBlocks.find(
    (block) =>
      block.articles?.length &&
      (block.cat.slug === BODOLI_SIDE_CATEGORY_SLUG || usesProjuktiLayout(block.cat)),
  )

  return (
    <>
      <SeoHead
        title={pageTitle}
        description={pageDesc}
        keywords={seo.metaKeyword}
        author={seo.metaAuthor || siteName}
        image={ogImage}
        siteName={siteName}
        type="website"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'NewsMediaOrganization',
          name: siteName,
          url: typeof window !== 'undefined' ? window.location.origin : '',
          logo: ogImage,
          description: pageDesc,
        }}
      />

      <LeadSection
        featured={featured}
        headlines={headlines}
        latest={latest}
        popular={popular}
        recent={recent}
        leadLayout={leadLayout}
      />

      <MidPageAds />

      <VideoGallerySection videos={videos} />

      <CategorySection
        title={t.discussed}
        slug={discussedSlug}
        articles={discussedArticles}
        variant="grid4"
      />

      {showRest &&
        categoryBlocks.map(({ cat, articles }, index) => {
          if (!articles.length) return null
          if (cat.slug === 'motso' || String(cat.name || '').includes('মৎস্য')) {
            return null
          }
          if (usesMotamotLayout(cat) && gobeshonaHasNews) {
            return null
          }
          const variant =
            usesMotamotLayout(cat)
              ? 'motamot'
              : cat.slug === 'bishesh'
              ? 'specialReport'
              : cat.slug === 'prani'
              ? 'livestock'
              : usesGobeshonaLayout(cat)
              ? 'spotlight'
              : usesProshasonLayout(cat)
                ? 'proshason'
                : usesProjuktiLayout(cat)
                ? 'projukti'
                : usesUddoktaHeroLayout(cat) || usesKrishokerKothaLayout(cat)
                ? 'heroGridSidebar'
                : usesBinodonLayout(cat)
                ? 'binodon'
                : HOME_LAYOUT_CYCLE[index % HOME_LAYOUT_CYCLE.length]
          return (
            <CategorySection
              key={cat._id}
              title={cat.name}
              slug={cat.slug}
              articles={articles}
              variant={variant}
              sidebarLatest={latest}
              sidebarPopular={popular}
              adOffset={index + 2}
              companion={
                usesGobeshonaLayout(cat) && motamotBlock
                  ? {
                      title: motamotBlock.cat.name,
                      slug: motamotBlock.cat.slug,
                      articles: motamotBlock.articles,
                    }
                  : null
              }
              sideCategory={
                (isBodoliCategory(cat) ||
                  usesKrishokerKothaLayout(cat) ||
                  usesShikkhaLayout(cat)) &&
                bodoliSideBlock
                  ? {
                      title: bodoliSideBlock.cat.name,
                      slug: bodoliSideBlock.cat.slug,
                      articles: bodoliSideBlock.articles,
                    }
                  : null
              }
            />
          )
        })}

      {showRest && fisheriesBlock ? (
        <CategorySection
          title={fisheriesBlock.cat.name}
          slug={fisheriesBlock.cat.slug}
          articles={fisheriesBlock.articles}
          variant="fisheries"
        />
      ) : null}

      {showRest && <PhotoGallerySection photos={photos} />}
    </>
  )
}
