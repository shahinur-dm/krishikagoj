import 'dotenv/config'
import mongoose from 'mongoose'
import Article from '../models/Article.js'
import Category from '../models/Category.js'
import Subcategory from '../models/Subcategory.js'
import Opinion from '../models/Opinion.js'
import { translateText } from '../utils/translator.js'
import { connectDb } from '../app.js'

async function check() {
  await connectDb()
  const total = await Article.countDocuments()
  const withEn = await Article.countDocuments({ titleEn: { $exists: true, $nin: ['', null] } })
  const withoutEn = await Article.countDocuments({
    $or: [{ titleEn: { $exists: false } }, { titleEn: '' }, { titleEn: null }],
  })
  console.log('ARTICLES:', { total, withEn, withoutEn })

  const samples = await Article.find({
    $or: [{ titleEn: { $exists: false } }, { titleEn: '' }, { titleEn: null }],
  })
    .select('title titleEn excerpt excerptEn')
    .limit(10)
    .lean()
  console.log('Sample articles without English title:', samples)

  const breaking = await BreakingNews.find({}).lean()
  console.log('Breaking News:', breaking)

  const cats = await Category.find({}).select('name nameEn slug').lean()
  console.log('Categories:', cats)

  const opinions = await Opinion.find({}).lean()
  console.log('Opinions count:', opinions.length)
  for (const op of opinions) {
    if (!op.titleEn) {
      const en = await translateText(op.title, 'bn', 'en')
      await Opinion.updateOne({ _id: op._id }, { $set: { titleEn: en } })
      console.log(`Updated Opinion [${op.title}] -> [${en}]`)
    }
  }

  await mongoose.disconnect()
}

check().catch(console.error)
