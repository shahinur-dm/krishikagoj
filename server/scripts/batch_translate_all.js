import 'dotenv/config'
import mongoose from 'mongoose'
import Article from '../models/Article.js'
import Category from '../models/Category.js'
import Subcategory from '../models/Subcategory.js'
import BreakingNews from '../models/BreakingNews.js'
import LayoutTopic from '../models/LayoutTopic.js'
import { connectDb } from '../app.js'
import { translateText, translateArticleFields } from '../utils/translator.js'

async function run() {
  await connectDb()
  console.log('Connected to MongoDB for batch translation...')

  // 1. Fix Categories missing nameEn
  const categories = await Category.find({})
  for (const cat of categories) {
    if (!cat.nameEn || !cat.nameEn.trim()) {
      const en = await translateText(cat.name, 'bn', 'en')
      console.log(`Updating Category [${cat.name}] -> [${en}]`)
      cat.nameEn = en
      await cat.save()
    }
  }

  // 2. Fix Subcategories missing nameEn
  const subcategories = await Subcategory.find({})
  for (const sub of subcategories) {
    if (!sub.nameEn || !sub.nameEn.trim()) {
      const en = await translateText(sub.nameBn, 'bn', 'en')
      console.log(`Updating Subcategory [${sub.nameBn}] -> [${en}]`)
      sub.nameEn = en
      await sub.save()
    }
  }

  // 3. Fix LayoutTopics missing titleEn
  const layoutTopics = await LayoutTopic.find({})
  for (const topic of layoutTopics) {
    if (!topic.titleEn || !topic.titleEn.trim()) {
      const en = await translateText(topic.title, 'bn', 'en')
      console.log(`Updating LayoutTopic [${topic.title}] -> [${en}]`)
      topic.titleEn = en
      await topic.save()
    }
  }

  // 4. Fix BreakingNews missing titleEn
  const breakingNews = await BreakingNews.find({})
  for (const bn of breakingNews) {
    if (!bn.titleEn || !bn.titleEn.trim()) {
      const en = await translateText(bn.titleBn, 'bn', 'en')
      console.log(`Updating BreakingNews [${bn.titleBn}] -> [${en}]`)
      bn.titleEn = en
      await bn.save()
    }
  }

  // 5. Batch Translate all Articles missing titleEn or excerptEn
  const articlesToTranslate = await Article.find({
    $or: [
      { titleEn: { $exists: false } },
      { titleEn: '' },
      { titleEn: null },
      { excerptEn: { $exists: false } },
      { excerptEn: '' },
      { excerptEn: null },
    ],
  })

  console.log(`Found ${articlesToTranslate.length} articles needing English translation.`)

  let count = 0
  for (const art of articlesToTranslate) {
    count++
    try {
      console.log(`[${count}/${articlesToTranslate.length}] Translating: ${art.title.slice(0, 40)}...`)
      const trans = await translateArticleFields({
        title: art.title,
        excerpt: art.excerpt,
        body: art.body,
      })

      const updates = {}
      if (trans.titleEn && (!art.titleEn || !art.titleEn.trim())) updates.titleEn = trans.titleEn
      if (trans.excerptEn && (!art.excerptEn || !art.excerptEn.trim())) updates.excerptEn = trans.excerptEn
      if (trans.bodyEn && (!art.bodyEn || !art.bodyEn.trim())) updates.bodyEn = trans.bodyEn

      if (Object.keys(updates).length > 0) {
        await Article.updateOne({ _id: art._id }, { $set: updates })
      }
      
      // Small pause to avoid hitting rate limits
      await new Promise((r) => setTimeout(r, 150))
    } catch (err) {
      console.error(`Failed translating article ${art._id}:`, err.message)
    }
  }

  console.log('Batch translation complete!')
  await mongoose.disconnect()
}

run().catch((err) => {
  console.error('Batch translation script failed:', err)
  process.exit(1)
})
