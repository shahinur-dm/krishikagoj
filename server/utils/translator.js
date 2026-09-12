/**
 * Automatic Bengali to English Translation Utility
 * Krishikagoj News Portal
 * 
 * Features:
 * - Multi-provider fallback:
 *   1. Google Translate GTX API (Fast, free, reliable)
 *   2. MyMemory Translation API (Backup)
 *   3. AI Writer (Gemini / OpenAI if configured in SiteSetting)
 * - HTML structure preservation (tags, attributes, images, embeds are preserved, inner text is translated)
 * - In-memory and hash caching to avoid redundant API calls
 * - Safe error handling (never crashes, falls back gracefully)
 */

import crypto from 'crypto'
import SiteSetting from '../models/SiteSetting.js'

// In-memory LRU-like translation cache
const textCache = new Map()
const MAX_CACHE_ITEMS = 5000

function hashKey(text, from = 'bn', to = 'en') {
  return crypto.createHash('md5').update(`${from}:${to}:${text}`).digest('hex')
}

function getCached(text, from = 'bn', to = 'en') {
  if (!text) return ''
  const key = hashKey(text, from, to)
  return textCache.get(key) || null
}

function setCached(text, translated, from = 'bn', to = 'en') {
  if (!text || !translated) return
  if (textCache.size >= MAX_CACHE_ITEMS) {
    const firstKey = textCache.keys().next().value
    textCache.delete(firstKey)
  }
  const key = hashKey(text, from, to)
  textCache.set(key, translated)
}

/**
 * Clean text before translation
 */
function cleanRawText(str) {
  if (!str) return ''
  return String(str).replace(/\r\n/g, '\n').trim()
}

/**
 * Tier 1: Google Translate GTX endpoint
 */
async function translateWithGoogleGtx(text, from = 'bn', to = 'en') {
  if (!text || !text.trim()) return ''
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`
  
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })
    if (!res.ok) throw new Error(`Google translate returned ${res.status}`)
    const data = await res.json()
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map((item) => (item && item[0] ? item[0] : '')).join('')
      return translated.trim()
    }
    throw new Error('Invalid Google translate response structure')
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Tier 2: MyMemory API Fallback
 */
async function translateWithMyMemory(text, from = 'bn', to = 'en') {
  if (!text || !text.trim()) return ''
  const langpair = `${from}|${to}`
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${encodeURIComponent(langpair)}`
  
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`MyMemory returned ${res.status}`)
    const data = await res.json()
    if (data?.responseData?.translatedText) {
      return data.responseData.translatedText.trim()
    }
    throw new Error('MyMemory translation missing')
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Tier 3: AI Writer (Gemini) fallback if configured in SiteSetting
 */
async function translateWithAiSetting(text, from = 'bn', to = 'en') {
  try {
    const setting = await SiteSetting.findOne({ key: 'site' }).select('aiWriter').lean()
    const ai = setting?.aiWriter
    if (!ai?.apiKey) return ''

    const apiKey = ai.apiKey
    const model = ai.model || 'gemini-1.5-flash'
    const prompt = `Translate the following ${from === 'bn' ? 'Bengali' : from} text into natural, fluent English for a news website. Output ONLY the translated text without any explanation, markdown code blocks, or preamble:\n\n${text}`

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 12000)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
        }),
        signal: ctrl.signal,
      })
      if (!res.ok) return ''
      const data = await res.json()
      const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text
      return candidate ? candidate.trim() : ''
    } finally {
      clearTimeout(timer)
    }
  } catch {
    return ''
  }
}

function chunkText(text, maxLen = 1200) {
  if (text.length <= maxLen) return [text]
  const chunks = []
  let remaining = text
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining)
      break
    }
    let splitIdx = remaining.lastIndexOf('\n', maxLen)
    if (splitIdx === -1 || splitIdx < maxLen / 2) {
      splitIdx = remaining.lastIndexOf(' ', maxLen)
    }
    if (splitIdx === -1 || splitIdx < maxLen / 4) {
      splitIdx = maxLen
    }
    chunks.push(remaining.slice(0, splitIdx).trim())
    remaining = remaining.slice(splitIdx).trim()
  }
  return chunks.filter(Boolean)
}

/**
 * Translates a single text string with multi-tier fallback and caching
 */
export async function translateText(text, from = 'bn', to = 'en') {
  const cleaned = cleanRawText(text)
  if (!cleaned) return ''

  // Check cache
  const cached = getCached(cleaned, from, to)
  if (cached) return cached

  // Split into chunks if text is very long
  if (cleaned.length > 1200) {
    const chunks = chunkText(cleaned, 1200)
    if (chunks.length > 1) {
      const translatedChunks = []
      for (const ch of chunks) {
        if (ch) {
          const trans = await translateText(ch, from, to)
          translatedChunks.push(trans)
        }
      }
      const result = translatedChunks.join(' ')
      setCached(cleaned, result, from, to)
      return result
    }
  }

  // Tier 1: Google GTX
  try {
    const result = await translateWithGoogleGtx(cleaned, from, to)
    if (result && result !== cleaned) {
      setCached(cleaned, result, from, to)
      return result
    }
  } catch (err) {
    console.warn('[Translator] Google GTX failed:', err.message)
  }

  // Tier 2: MyMemory
  try {
    const result = await translateWithMyMemory(cleaned, from, to)
    if (result && result !== cleaned) {
      setCached(cleaned, result, from, to)
      return result
    }
  } catch (err) {
    console.warn('[Translator] MyMemory failed:', err.message)
  }

  // Tier 3: AI Writer
  try {
    const result = await translateWithAiSetting(cleaned, from, to)
    if (result && result !== cleaned) {
      setCached(cleaned, result, from, to)
      return result
    }
  } catch (err) {
    console.warn('[Translator] AI setting failed:', err.message)
  }

  return cleaned
}

/**
 * Translates HTML content while preserving tags and structure
 */
export async function translateHtml(html, from = 'bn', to = 'en') {
  if (!html || !String(html).trim()) return ''
  const str = String(html)

  // Check cache
  const cached = getCached(str, from, to)
  if (cached) return cached

  // Tokenize HTML into tags and text segments
  const tagRegex = /(<[^>]+>)/g
  const tokens = str.split(tagRegex)

  const textSegments = []
  const textIndices = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (!token) continue
    if (token.startsWith('<') && token.endsWith('>')) {
      // HTML tag
      continue
    }
    const trimmed = token.trim()
    if (trimmed) {
      textIndices.push(i)
      textSegments.push(trimmed)
    }
  }

  if (textSegments.length === 0) {
    return str
  }

  // Join segments with unique delimiter for single-request translation
  const DELIM = ' ___TK___ '
  const combinedText = textSegments.join(DELIM)

  try {
    const translatedCombined = await translateText(combinedText, from, to)
    const translatedParts = translatedCombined.split(/___TK___/i).map((s) => s.trim())

    if (translatedParts.length === textSegments.length) {
      textIndices.forEach((idx, i) => {
        const orig = tokens[idx]
        const leadingSpace = orig.match(/^\s*/)?.[0] || ''
        const trailingSpace = orig.match(/\s*$/)?.[0] || ''
        tokens[idx] = `${leadingSpace}${translatedParts[i]}${trailingSpace}`
      })
    } else {
      // Fallback if delimiters were altered by translation engine
      for (let i = 0; i < textIndices.length; i++) {
        const idx = textIndices[i]
        const orig = tokens[idx]
        const trimmed = orig.trim()
        try {
          const trans = await translateText(trimmed, from, to)
          const leadingSpace = orig.match(/^\s*/)?.[0] || ''
          const trailingSpace = orig.match(/\s*$/)?.[0] || ''
          tokens[idx] = `${leadingSpace}${trans}${trailingSpace}`
        } catch {
          // keep original
        }
      }
    }
  } catch (err) {
    console.warn('[Translator] translateHtml combined batch failed:', err.message)
  }

  const finalHtml = tokens.join('')
  setCached(str, finalHtml, from, to)
  return finalHtml
}

/**
 * Translate Article fields (title, excerpt, body)
 */
export async function translateArticleFields({ title, excerpt, body }) {
  const result = {
    titleEn: '',
    excerptEn: '',
    bodyEn: '',
  }

  if (title) {
    try {
      result.titleEn = await translateText(title, 'bn', 'en')
    } catch (err) {
      console.warn('[Translator] Failed translating title:', err.message)
    }
  }

  if (excerpt) {
    try {
      result.excerptEn = await translateText(excerpt, 'bn', 'en')
    } catch (err) {
      console.warn('[Translator] Failed translating excerpt:', err.message)
    }
  }

  if (body) {
    try {
      result.bodyEn = await translateHtml(body, 'bn', 'en')
    } catch (err) {
      console.warn('[Translator] Failed translating body:', err.message)
    }
  }

  return result
}
