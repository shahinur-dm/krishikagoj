import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_KEY = 'kk_lang'
const ADMIN_KEY = 'kk_admin_lang'
const LanguageContext = createContext(null)

function readStored(key) {
  try {
    const saved = localStorage.getItem(key)
    if (saved === 'en' || saved === 'bn') return saved
  } catch {
    /* ignore */
  }
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${key}=(bn|en)(?:;|$)`))
    if (match) return match[1]
  } catch {
    /* ignore */
  }
  return 'bn'
}

function persist(key, lang) {
  try {
    localStorage.setItem(key, lang)
  } catch {
    /* ignore */
  }
  try {
    document.cookie = `${key}=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`
  } catch {
    /* ignore */
  }
}

function isAdminPath(pathname = '') {
  return (
    pathname.startsWith('/admin') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/register')
  )
}

const COPY = {
  bn: {
    todayPaper: 'আজকের পত্রিকা',
    epaper: 'ই-পেপার',
    magazine: 'ম্যাগাজিন',
    social: 'সোশ্যাল মিডিয়া',
    login: 'লগইন',
    search: 'খুঁজুন...',
    home: 'প্রচ্ছদ',
    categories: 'ক্যাটাগরি',
    importantLinks: 'গুরুত্বপূর্ণ লিংক',
    contact: 'যোগাযোগ',
    newsStories: 'নিউজ স্টোরিজ',
    discussed: 'আলোচিত',
    related: 'সম্পর্কিত খবর',
    moreNews: 'আরও খবর',
    views: 'ভিউ',
    loading: 'লোড হচ্ছে...',
    all: 'সব',
    more: 'আরও',
    searchPage: 'খোঁজ',
    searchBtn: 'খুঁজুন',
    searching: 'খুঁজছি...',
    noResults: 'কোনো ফলাফল পাওয়া যায়নি।',
    noEnglish: 'ইংরেজি ভার্সন নেই — বাংলা দেখানো হচ্ছে',
    backTop: 'উপরে যান',
    adminPanel: 'অ্যাডমিন প্যানেল',
    adminLoading: 'অ্যাডমিন প্যানেল লোড হচ্ছে...',
    viewSite: 'সাইট দেখুন',
    logout: 'লগআউট',
    menu: 'মেনু',
    navMain: 'মূল',
    navContent: 'কন্টেন্ট',
    navGallery: 'গ্যালারি',
    navStaffSec: 'স্টাফ ও রাইটার',
    navSettings: 'সেটিংস',
    navDashboard: 'ড্যাশবোর্ড',
    navCategories: 'ক্যাটাগরি',
    navSubcategories: 'সাবক্যাটাগরি',
    navNewPost: 'পোস্ট যোগ',
    navAllPosts: 'সব পোস্ট',
    navHomeLead: 'নিউজ পজিশন',
    navTopicGrid: 'ক্যাটাগরি নিউজ লেআউট',
    navAiWriter: 'AI Writer',
    navAiSettings: 'AI Settings',
    navFacebookSettings: 'Facebook Settings',
    navOpinion: 'মতামত',
    navOpinionList: 'Opinion List',
    navOpinionAdd: 'Add New Opinion',
    navPolls: 'Polls',
    navPollList: 'Poll List',
    navPollAdd: 'Add New Poll',
    navSurvey: 'অনলাইন জরিপ',
    navSurveyList: 'Survey List',
    navSurveyAdd: 'Add New Survey',
    navPages: 'Page',
    navPageAdd: 'Add New Page',
    navPageList: 'Page List',
    homeLeadDesc: 'সব পেজের খবরের জায়গা বদলান',
    homeLeadTitle: 'নিউজ পজিশন ম্যানেজার',
    homeLeadHelp:
      'পেজ বেছে নিন, খবর টেনে বসান। ডিলিট শুধু পজিশন খালি করে — খবর মুছে যায় না। সেভ করলে শুধু ওই পেজেই দেখাবে।',
    resetPositions: 'সব রিসেট',
    navSidebars: 'সাইডবার সেটিং',
    navPhotos: 'ফটো গ্যালারি',
    navVideos: 'ভিডিও গ্যালারি',
    navStaff: 'স্টাফ',
    navWriters: 'রাইটার',
    navPassword: 'পাসওয়ার্ড',
    navWebsite: 'ওয়েবসাইট সেটিং',
    navLoginLogo: 'লগইন লোগো',
    navNamaz: 'নামাজের সময়',
    navNotice: 'নোটিশ',
    navSocial: 'সোশ্যাল মিডিয়া',
    navSeo: 'এসইও',
    navAds: 'বিজ্ঞাপন / অ্যাডস',
    navWebsites: 'গুরুত্বপূর্ণ ওয়েবসাইট',
    navBreaking: 'ব্রেকিং নিউজ',
    navUsersSec: 'ইউজার ম্যানেজমেন্ট',
    navUsers: 'ইউজার',
    navAddUser: 'নতুন ইউজার',
    navRoles: 'রোল',
    navPermissions: 'পারমিশন',
    loginAdmin: 'কৃষিকাগজ অ্যাডমিন',
    email: 'ইমেইল',
    emailOrUser: 'ইমেইল বা ইউজারনেম',
    password: 'পাসওয়ার্ড',
    loggingIn: 'লগইন হচ্ছে...',
    reporterReg: 'রিপোর্টার রেজিস্ট্রেশন',
    greetMorning: 'শুভ সকাল',
    greetAfternoon: 'শুভ বিকেল',
    greetEvening: 'শুভ সন্ধ্যা',
    totalPosts: 'মোট পোস্ট',
    published: 'প্রকাশিত',
    totalViews: 'মোট ভিউ',
    viewsSum: 'সব খবরের যোগফল',
    todayPosts: 'আজকের পোস্ট',
    in7days: '৭ দিনে',
    drafts: 'ড্রাফট',
    pendingWriters: 'অপেক্ষমাণ রাইটার',
    headlines: 'হেডলাইন',
    featured: 'ফিচার্ড',
    popular: 'জনপ্রিয়',
    photos: 'ফটো',
    videos: 'ভিডিও',
    staff: 'স্টাফ',
    writers: 'রাইটার',
    websites: 'ওয়েবসাইট',
    newPost: 'নতুন পোস্ট',
    newPostDesc: 'খবর লিখুন ও প্রকাশ করুন',
    allPostsDesc: 'তালিকা দেখুন ও সম্পাদনা',
    catDesc: 'বিভাগ ম্যানেজ করুন',
    photoDesc: 'ছবি আপলোড/সম্পাদনা',
    videoDesc: 'ভিডিও গ্যালারি',
    siteDesc: 'নাম, লোগো, যোগাযোগ',
    writerDesc: 'অ্যাকাউন্ট অনুমোদন',
    siteLiveDesc: 'লাইভ পোর্টাল খুলুন',
    save: 'সেভ করুন',
    saving: 'সেভ হচ্ছে...',
    deleteAll: 'সব ডিলিট',
    delete: 'ডিলিট',
    breakingNews: 'ব্রেকিং নিউজ',
    confirmDelete: 'মুছে ফেলবেন?',
  },
  en: {
    todayPaper: "Today's paper",
    epaper: 'E-paper',
    magazine: 'Magazine',
    social: 'Social media',
    login: 'Login',
    search: 'Search...',
    home: 'Home',
    categories: 'Categories',
    importantLinks: 'Important links',
    contact: 'Contact',
    newsStories: 'News stories',
    discussed: 'Trending',
    related: 'Related news',
    moreNews: 'More news',
    views: 'views',
    loading: 'Loading...',
    all: 'All',
    more: 'More',
    searchPage: 'Search',
    searchBtn: 'Search',
    searching: 'Searching...',
    noResults: 'No results found.',
    noEnglish: 'English version not available — showing Bangla',
    backTop: 'Back to top',
    adminPanel: 'Admin panel',
    adminLoading: 'Loading admin panel...',
    viewSite: 'View site',
    logout: 'Logout',
    menu: 'Menu',
    navMain: 'Main',
    navContent: 'Content',
    navGallery: 'Gallery',
    navStaffSec: 'Staff & writers',
    navSettings: 'Settings',
    navDashboard: 'Dashboard',
    navCategories: 'Categories',
    navSubcategories: 'Subcategories',
    navNewPost: 'Add post',
    navAllPosts: 'All posts',
    navHomeLead: 'News positions',
    navTopicGrid: 'Category news layout',
    navAiWriter: 'AI Writer',
    navAiSettings: 'AI Settings',
    navFacebookSettings: 'Facebook Settings',
    navOpinion: 'Opinion',
    navOpinionList: 'Opinion List',
    navOpinionAdd: 'Add New Opinion',
    navPolls: 'Polls',
    navPollList: 'Poll List',
    navPollAdd: 'Add New Poll',
    navSurvey: 'Online survey',
    navSurveyList: 'Survey List',
    navSurveyAdd: 'Add New Survey',
    navPages: 'Page',
    navPageAdd: 'Add New Page',
    navPageList: 'Page List',
    navPhotos: 'Photo gallery',
    navVideos: 'Video gallery',
    navStaff: 'Staff',
    navWriters: 'Writers',
    navPassword: 'Password',
    navWebsite: 'Website settings',
    navLoginLogo: 'Login logo',
    navNamaz: 'Prayer times',
    navNotice: 'Notice',
    navSocial: 'Social media',
    navSeo: 'SEO',
    navAds: 'Ads / promotions',
    navWebsites: 'Important websites',
    navBreaking: 'Breaking News',
    navUsersSec: 'User management',
    navUsers: 'Users',
    navAddUser: 'Add new user',
    navRoles: 'Roles',
    navPermissions: 'Permissions',
    loginAdmin: 'Krishikagos Admin',
    email: 'Email',
    emailOrUser: 'Email or username',
    password: 'Password',
    loggingIn: 'Signing in...',
    reporterReg: 'Reporter registration',
    greetMorning: 'Good morning',
    greetAfternoon: 'Good afternoon',
    greetEvening: 'Good evening',
    totalPosts: 'Total posts',
    published: 'published',
    totalViews: 'Total views',
    viewsSum: 'Sum of all news views',
    todayPosts: "Today's posts",
    in7days: 'in 7 days',
    drafts: 'Drafts',
    pendingWriters: 'pending writers',
    headlines: 'Headlines',
    featured: 'Featured',
    popular: 'Popular',
    photos: 'Photos',
    videos: 'Videos',
    staff: 'Staff',
    writers: 'Writers',
    websites: 'Websites',
    newPost: 'New post',
    newPostDesc: 'Write and publish news',
    allPostsDesc: 'List and edit posts',
    homeLeadDesc: 'Arrange news on every page',
    catDesc: 'Manage sections',
    photoDesc: 'Upload / edit photos',
    videoDesc: 'Video gallery',
    siteDesc: 'Name, logo, contact',
    writerDesc: 'Approve accounts',
    siteLiveDesc: 'Open live portal',
    homeLeadTitle: 'News position manager',
    homeLeadHelp:
      'Select page, drag news into position. Delete only empties slot — does not remove article. Saving updates that page.',
    resetPositions: 'Reset all',
    navSidebars: 'Sidebar Settings',
    navPhotos: 'Photo gallery',
    save: 'Save',
    saving: 'Saving...',
    deleteAll: 'Delete all',
    delete: 'Delete',
    breakingNews: 'Breaking News',
    confirmDelete: 'Delete this item?',
  },
}

export function LanguageProvider({ children }) {
  const { pathname } = useLocation()
  const adminView = isAdminPath(pathname)
  const [siteLang, setSiteLang] = useState(() => readStored(SITE_KEY))
  const [adminLang, setAdminLang] = useState(() => readStored(ADMIN_KEY))

  const lang = adminView ? adminLang : siteLang

  useEffect(() => {
    persist(SITE_KEY, siteLang)
  }, [siteLang])

  useEffect(() => {
    persist(ADMIN_KEY, adminLang)
  }, [adminLang])

  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'bn'
    document.documentElement.dataset.localeScope = adminView ? 'admin' : 'site'
  }, [lang, adminView])

  const value = useMemo(() => {
    const isEn = lang === 'en'
    return {
      lang,
      isEn,
      scope: adminView ? 'admin' : 'site',
      siteLang,
      adminLang,
      t: COPY[lang] || COPY.bn,
      setLang: adminView ? setAdminLang : setSiteLang,
      setSiteLang,
      setAdminLang,
      toggleLang: () => {
        const setter = adminView ? setAdminLang : setSiteLang
        setter((v) => (v === 'en' ? 'bn' : 'en'))
      },
      text: (bn, en) => (isEn && en ? en : bn),
    }
  }, [lang, adminView, siteLang, adminLang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
