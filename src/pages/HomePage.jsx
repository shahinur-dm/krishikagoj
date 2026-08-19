import { useEffect, useState } from 'react'
import { useSiteData } from '../context/SiteDataContext'
import LeadSection from '../components/LeadSection'
import CategorySection, { HOME_LAYOUT_CYCLE, usesBinodonLayout } from '../components/CategorySection'
import VideoGallerySection, { PhotoGallerySection } from '../components/VideoGallerySection'
import SeoHead from '../components/SeoHead'
import MidPageAds from '../components/MidPageAds'
import { useLang } from '../context/LanguageContext'

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
          const variant = usesBinodonLayout(cat)
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
            />
          )
        })}

      {showRest && <PhotoGallerySection photos={photos} />}
    </>
  )
}
