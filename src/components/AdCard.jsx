import { useEffect, useRef } from 'react'
import SafeImage from './SafeImage'
import { useLang } from '../context/LanguageContext'

export const FALLBACK_ADS = [
  {
    id: 'demo-navbar',
    title: 'জাতীয় বিশ্ববিদ্যালয় · অনার্স ভর্তি ২০২৬',
    titleEn: 'National University · Honours Admission 2026',
    mediaType: 'image',
    image:
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=400&q=80',
    linkUrl: 'https://www.nu.ac.bd/',
    ctaText: 'আবেদন করুন',
    ctaTextEn: 'Apply now',
    badge: 'ভর্তি ২০২৬',
    badgeEn: 'Admission 2026',
    position: 'navbar',
    openInNewTab: true,
  },
  {
    id: 'demo-bottom',
    title: 'কৃষি বিশ্ববিদ্যালয় · BSc in Agriculture',
    titleEn: 'Agricultural University · BSc in Agriculture',
    mediaType: 'image',
    image:
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=400&q=80',
    linkUrl: 'https://www.bau.edu.bd/',
    ctaText: 'বিস্তারিত',
    ctaTextEn: 'Details',
    badge: 'কৃষি বিশ্ববিদ্যালয়',
    badgeEn: 'Agri University',
    position: 'bottom',
    openInNewTab: true,
  },
  {
    id: 'demo-mid-a',
    title: 'মেডিকেল কলেজ প্রস্তুতি কোর্স',
    titleEn: 'Medical College Admission Prep',
    mediaType: 'image',
    image:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80',
    linkUrl: '#',
    ctaText: 'এনরোল',
    ctaTextEn: 'Enroll',
    badge: 'মেডিকেল',
    badgeEn: 'Medical',
    position: 'mid_a',
    openInNewTab: false,
  },
  {
    id: 'demo-mid-b',
    title: 'কৃষি ডিপ্লোমা · পলিটেকনিক ভর্তি',
    titleEn: 'Agriculture Diploma · Polytechnic Admission',
    mediaType: 'image',
    image:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80',
    linkUrl: '#',
    ctaText: 'নিবন্ধন',
    ctaTextEn: 'Register',
    badge: 'ডিপ্লোমা',
    badgeEn: 'Diploma',
    position: 'mid_b',
    openInNewTab: false,
  },
  {
    id: 'demo-sidebar',
    title: 'অনলাইন কোর্স · কৃষি প্রযুক্তি',
    titleEn: 'Online Course · Agri Tech',
    description: 'নতুন ব্যাচ শুরু হচ্ছে — এখনই রেজিস্টার করুন।',
    descriptionEn: 'New batch starting — register now.',
    mediaType: 'image',
    image:
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80',
    linkUrl: '#',
    ctaText: 'রেজিস্টার',
    ctaTextEn: 'Register',
    badge: 'স্পন্সরড',
    badgeEn: 'Sponsored',
    position: 'sidebar',
    openInNewTab: false,
  },
]

function ytId(url = '') {
  const m = String(url).match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{6,})/)
  return m ? m[1] : ''
}

export function AdFrame({ children, className = '' }) {
  return <div className={`ad-frame${className ? ` ${className}` : ''}`}>{children}</div>
}

function HtmlAd({ html }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = html || ''
  }, [html])
  return <div className="site-ad-html" ref={ref} />
}

export default function AdCard({ ad, variant = 'banner' }) {
  const { text } = useLang()
  if (!ad) return null

  const title = text(ad.title, ad.titleEn)
  const description = text(ad.description, ad.descriptionEn)
  const badge = text(ad.badge, ad.badgeEn)
  const cta = text(ad.ctaText || 'বিস্তারিত', ad.ctaTextEn || 'Learn more')
  const mediaType = ad.mediaType || 'image'
  const href = ad.linkUrl || '#'
  const target = ad.openInNewTab === false ? undefined : '_blank'
  const rel = target ? 'noopener noreferrer sponsored' : undefined
  const alt = ad.altText || title

  if (mediaType === 'html' && ad.htmlCode) {
    return (
      <div className={`site-ad site-ad-html-wrap site-ad-${variant}`}>
        <HtmlAd html={ad.htmlCode} />
        <span className="site-ad-mark">Ad</span>
      </div>
    )
  }

  const videoId = mediaType === 'video' ? ytId(ad.videoUrl) : ''
  const isMp4 = mediaType === 'video' && /\.mp4($|\?)/i.test(ad.videoUrl || '')

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={`site-ad site-ad-${variant}`}
      aria-label={title}
    >
      <div className="site-ad-media">
        {mediaType === 'video' && ad.videoEmbed ? (
          <div className="site-ad-video" dangerouslySetInnerHTML={{ __html: ad.videoEmbed }} />
        ) : isMp4 ? (
          <video src={ad.videoUrl} muted autoPlay loop playsInline />
        ) : videoId ? (
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt={alt}
          />
        ) : ad.image ? (
          <SafeImage src={ad.image} alt={alt} width={200} />
        ) : (
          <div className="site-ad-media-empty" />
        )}
      </div>
      <div className="site-ad-content">
        {badge ? <span className="site-ad-badge">{badge}</span> : null}
        <strong className="site-ad-title">{title}</strong>
        {description ? <span className="site-ad-desc">{description}</span> : null}
        {ad.sponsorName ? <span className="site-ad-sponsor">{ad.sponsorName}</span> : null}
      </div>
      <span className="site-ad-cta">{cta}</span>
      <span className="site-ad-mark">Ad</span>
    </a>
  )
}

export function pickAd(ads = [], position) {
  const list = adsForSlider(ads, position)
  return list[0] || null
}

export function adsForSlider(ads = [], position) {
  const source = (ads || []).filter(Boolean)
  const pool = source.length ? source : FALLBACK_ADS
  const keyed = []
  const seen = new Set()
  const push = (a) => {
    const key = String(a.id || a._id || `${a.position}-${a.title}`)
    if (seen.has(key)) return
    seen.add(key)
    keyed.push(a)
  }
  pool.filter((a) => a.position === position).forEach(push)
  pool.forEach(push)
  return keyed
}
