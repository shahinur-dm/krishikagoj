import 'dotenv/config'
import mongoose from 'mongoose'
import Category from '../models/Category.js'
import Subcategory from '../models/Subcategory.js'
import Article from '../models/Article.js'
import SiteSetting from '../models/SiteSetting.js'
import User from '../models/User.js'
import PhotoGallery from '../models/PhotoGallery.js'
import VideoGallery from '../models/VideoGallery.js'
import Staff from '../models/Staff.js'
import ImportantWebsite from '../models/ImportantWebsite.js'
import {
  buildArticles,
  subcategoriesSeed,
  photosSeed,
  videosSeed,
  staffSeed,
  websitesSeed,
  siteSettingsSeed,
} from './demo-data.js'

const categoriesSeed = [
  { name: 'প্রচ্ছদ', nameEn: 'Home', slug: 'home', order: 0, description: 'হোমপেজ' },
  { name: 'ফসল', nameEn: 'Crops', slug: 'foshol', order: 1, description: 'ফসল ও চাষাবাদ' },
  { name: 'কৃষি প্রশাসন', nameEn: 'Admin', slug: 'proshason', order: 2 },
  { name: 'কৃষি গবেষণা', nameEn: 'Research', slug: 'gobeshona', order: 3 },
  { name: 'প্রাণিসম্পদ', nameEn: 'Livestock', slug: 'prani', order: 4 },
  { name: 'মৎস্য সম্পদ', nameEn: 'Fisheries', slug: 'motso', order: 5 },
  { name: 'বদলি', nameEn: 'Transfer', slug: 'bodoli', order: 6 },
  { name: 'কৃষি প্রযুক্তি', nameEn: 'Technology', slug: 'projukti', order: 7 },
  { name: 'বিশেষ প্রতিবেদন', nameEn: 'Special', slug: 'bishesh', order: 8 },
  { name: 'কৃষি শিক্ষা', nameEn: 'Education', slug: 'shikkha', order: 9 },
  { name: 'কৃষি উদ্যোক্তা', nameEn: 'Entrepreneurs', slug: 'uddokta', order: 10 },
  { name: 'মতামত', nameEn: 'Opinion', slug: 'motamot', order: 11 },
  { name: 'কৃষকের কথা', nameEn: 'Farmer Voice', slug: 'krishoker-kotha', order: 12 },
  { name: 'সাফল্য', nameEn: 'Success', slug: 'safollo', order: 13 },
]

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI missing')

  await mongoose.connect(uri)
  console.log('Connected to MongoDB')

  await Promise.all([
    Article.deleteMany({}),
    Subcategory.deleteMany({}),
    Category.deleteMany({}),
    SiteSetting.deleteMany({}),
    User.deleteMany({}),
    PhotoGallery.deleteMany({}),
    VideoGallery.deleteMany({}),
    Staff.deleteMany({}),
    ImportantWebsite.deleteMany({}),
  ])

  // Drop old global unique slug index on subcategories if present
  try {
    await Subcategory.collection.dropIndex('slug_1')
  } catch {
    /* ok if missing */
  }

  const cats = await Category.insertMany(categoriesSeed)
  const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c]))

  const subcats = await Subcategory.insertMany(
    subcategoriesSeed.map((s) => ({
      nameBn: s.nameBn,
      nameEn: s.nameEn,
      slug: s.slug,
      category: bySlug[s.cat]._id,
      order: s.order,
      isActive: true,
    })),
  )

  const subsByCat = {}
  subcats.forEach((s) => {
    const cat = cats.find((c) => String(c._id) === String(s.category))
    if (!cat) return
    if (!subsByCat[cat.slug]) subsByCat[cat.slug] = []
    subsByCat[cat.slug].push(s)
  })

  const admin = await User.create({
    name: 'Super Admin',
    email: 'superadmin@example.com',
    password: 'password',
    role: 'superadmin',
    isActive: true,
    permissions: {
      category: true,
      district: true,
      post: true,
      allpost: true,
      setting: true,
      gallery: true,
      ads: true,
      role: true,
    },
  })

  const writer = await User.create({
    name: 'মোঃ নাঈম হোসেন',
    email: 'reporter@example.com',
    password: 'password',
    role: 'writer',
    isActive: true,
    permissions: { post: true, allpost: false },
  })

  const articles = buildArticles(bySlug, subsByCat).map((a, i) => ({
    ...a,
    authorUser: i % 4 === 0 ? writer._id : admin._id,
  }))
  await Article.insertMany(articles)

  await PhotoGallery.insertMany(photosSeed)
  await VideoGallery.insertMany(videosSeed)
  await Staff.insertMany(
    staffSeed.map((s, i) => ({
      ...s,
      order: i,
      isActive: true,
      user: i === 0 ? writer._id : null,
    })),
  )
  await ImportantWebsite.insertMany(
    websitesSeed.map((w, i) => ({ ...w, order: i, isActive: true })),
  )
  await SiteSetting.create(siteSettingsSeed)

  await Promise.all([
    Category.syncIndexes(),
    Subcategory.syncIndexes(),
    Article.syncIndexes(),
  ])

  console.log(
    `Seeded ${cats.length} categories, ${subcats.length} subcategories, ${articles.length} articles (with subcategory + authorUser), ${photosSeed.length} photos, ${videosSeed.length} videos`,
  )
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
