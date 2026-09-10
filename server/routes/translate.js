import { Router } from 'express'
import Article from '../models/Article.js'
import { translateText, translateHtml, translateArticleFields } from '../utils/translator.js'
import { ARTICLE_DETAIL_SELECT } from '../utils/articleFields.js'

const router = Router()

/**
 * POST /api/translate/text
 * Translates single text snippet
 */
router.post('/text', async (req, res) => {
  try {
    const { text, from = 'bn', to = 'en' } = req.body
    if (!text) return res.json({ translated: '' })
    const translated = await translateText(text, from, to)
    res.json({ translated })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * POST /api/translate/html
 * Translates HTML snippet preserving markup
 */
router.post('/html', async (req, res) => {
  try {
    const { html, from = 'bn', to = 'en' } = req.body
    if (!html) return res.json({ translated: '' })
    const translated = await translateHtml(html, from, to)
    res.json({ translated })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * POST /api/translate/article
 * Ensures English translation exists for an article.
 * If missing, generates translation and saves to MongoDB.
 */
router.post('/article', async (req, res) => {
  try {
    const { idOrSlug, title, excerpt, body } = req.body

    if (idOrSlug) {
      const isId = /^[0-9a-fA-F]{24}$/.test(idOrSlug)
      const article = await Article.findOne(
        isId ? { _id: idOrSlug } : { slug: idOrSlug },
      ).select(ARTICLE_DETAIL_SELECT)

      if (!article) {
        return res.status(404).json({ message: 'Article not found' })
      }

      // If article already has English fields populated, return them
      if (article.titleEn && (article.bodyEn || !article.body)) {
        return res.json({
          _id: article._id,
          titleEn: article.titleEn,
          excerptEn: article.excerptEn || '',
          bodyEn: article.bodyEn || '',
        })
      }

      // Generate missing translations
      const trans = await translateArticleFields({
        title: article.title,
        excerpt: article.excerpt,
        body: article.body,
      })

      const updates = {}
      if (trans.titleEn) updates.titleEn = trans.titleEn
      if (trans.excerptEn) updates.excerptEn = trans.excerptEn
      if (trans.bodyEn) updates.bodyEn = trans.bodyEn

      if (Object.keys(updates).length > 0) {
        await Article.updateOne({ _id: article._id }, { $set: updates })
      }

      return res.json({
        _id: article._id,
        titleEn: updates.titleEn || article.titleEn || '',
        excerptEn: updates.excerptEn || article.excerptEn || '',
        bodyEn: updates.bodyEn || article.bodyEn || '',
      })
    }

    if (title || body || excerpt) {
      const trans = await translateArticleFields({ title, excerpt, body })
      return res.json(trans)
    }

    return res.status(400).json({ message: 'Missing article parameters' })
  } catch (err) {
    console.error('Translation error:', err)
    res.status(500).json({ message: err.message })
  }
})

export default router
