import mongoose from 'mongoose'
import SiteSetting from '../models/SiteSetting.js'

export async function generateArticle({ headline, excerpt, category, subcategory, language, settings }) {
  if (!headline || !headline.trim()) {
    throw new Error('Head Line প্রয়োজন। অনুগ্রহ করে প্রথমে শিরোনাম লিখুন।')
  }

  let aiWriter = settings || {}
  if (!settings && mongoose.connection.readyState === 1) {
    try {
      const siteSettings = await SiteSetting.findOne({ key: 'site' }).lean()
      aiWriter = siteSettings?.aiWriter || {}
    } catch {}
  }

  const apiKey =
    aiWriter.apiKey?.trim() ||
    process.env.OPENAI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.AI_API_KEY ||
    ''

  if (!apiKey) {
    throw new Error(
      'AI API Key কনফিগার করা নেই। অনুগ্রহ করে Admin Panel > AI Writer Settings-এ গিয়ে API Key সেট করুন অথবা সার্ভার .env ফাইলে OPENAI_API_KEY / GEMINI_API_KEY যুক্ত করুন।',
    )
  }

  const model = (aiWriter.model?.trim() || process.env.AI_MODEL || 'gpt-4o').toLowerCase()
  const temperature = parseFloat(aiWriter.temperature) || 0.7
  const maxTokens = parseInt(aiWriter.maxTokens, 10) || 1500
  const customTemplate = aiWriter.promptTemplate?.trim() || ''

  const isGemini = model.startsWith('gemini') || apiKey.startsWith('AIza')

  const systemPrompt = `আপনি "কৃষিকাগজ" (Krishi Kagoj - বাংলাদেশের কৃষি ও জাতীয় সংবাদ পোর্টাল)-এর একজন অভিজ্ঞ জ্যেষ্ঠ সাংবাদিক ও লেখক।
আপনার দায়িত্ব হলো প্রদত্ত শিরোনামের (Headline) উপর ভিত্তি করে একটি সম্পূর্ণ, তথ্যবহুল, প্রাতিষ্ঠানিক ও আকর্ষণীয় বাংলা সংবাদ প্রতিবেদন/আর্টিকেল রচনা করা।

প্রতিবেদনের কাঠামো ও নিয়মাবলী:
১. সূচনা (Introduction): সংবাদের মূল বার্তা ও ঘটনার প্রেক্ষাপট দিয়ে আকর্ষণীয় ভূমিকা (১টি অনুচ্ছেদ)।
২. মূল বিবরণী (Detailed Body): ঘটনার প্রেক্ষাপট, কৃষকের অভিজ্ঞতা, চাষপদ্ধতি, অর্থনৈতিক সম্ভাবনা, উৎপাদন ব্যয় ও লাভ, অথবা প্রাসঙ্গিক বাস্তবসম্মত আলোচনা (২-৩টি অনুচ্ছেদ)।
৩. পরামর্শ ও উপসংহার (Conclusion / Outlook): কৃষি কর্মকর্তা/বিশেষজ্ঞদের মতামত, ভবিষ্যৎ সম্ভাবনা এবং কৃষকদের জন্য করণীয় বা অনুপ্রেরণামূলক ইতিবাচক সমাপ্তি (১টি অনুচ্ছেদ)।
৪. ভাষা ও শৈলী: বস্তুনিষ্ঠ, তথ্যবহুল, নির্ভরযোগ্য ও শুদ্ধ প্রমিত বাংলা (Professional Newspaper Standard)।
৫. কোনো অবাস্তব, আজগুবি বা মিথ্যা পরিসংখ্যান/তথ্য নিজে বানিয়ে লিখবেন না। যেসব তথ্য নিশ্চিত নয়, সেখানে বাস্তবসম্মত প্রাতিষ্ঠানিক বিবরণ দিন।
৬. আউটপুট সরাসরি পরিষ্কার HTML অনুচ্ছেদ ফরম্যাটে (<p>অনুচ্ছেদ ১</p><p>অনুচ্ছেদ ২</p>...) প্রদান করুন। কোনো মার্কডাউন কোড ব্লক (যেমন \`\`\`html) লিখবেন না।`

  let userPrompt = `সংবাদের শিরোনাম: ${headline.trim()}`
  if (category) userPrompt += `\nক্যাটাগরি: ${category}`
  if (subcategory) userPrompt += `\nসাব-ক্যাটাগরি: ${subcategory}`
  if (excerpt) userPrompt += `\nসংক্ষিপ্ত বিবরণ (Short Head): ${excerpt}`

  if (customTemplate) {
    userPrompt = customTemplate
      .replace(/\{\{headline\}\}/gi, headline.trim())
      .replace(/\{\{title\}\}/gi, headline.trim())
      .replace(/\{\{category\}\}/gi, category || '')
      .replace(/\{\{subcategory\}\}/gi, subcategory || '')
      .replace(/\{\{excerpt\}\}/gi, excerpt || '')
  }

  let generatedText = ''

  if (isGemini) {
    const geminiModel = model.startsWith('gemini') ? model : 'gemini-1.5-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.error) {
      throw new Error(`Gemini API Error: ${data?.error?.message || res.statusText || 'Request failed'}`)
    }
    generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } else {
    // OpenAI or OpenAI-compatible endpoint
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.error) {
      throw new Error(`OpenAI API Error: ${data?.error?.message || res.statusText || 'Request failed'}`)
    }
    generatedText = data?.choices?.[0]?.message?.content || ''
  }

  // Format and clean up the generated text into clean HTML paragraphs
  let html = (generatedText || '').trim()
  html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim()

  if (!html) {
    throw new Error('AI কোনো লেখা তৈরি করতে পারেনি। অনুগ্রহ করে আবার চেষ্টা করুন।')
  }

  // If text does not contain HTML tags, convert lines/paragraphs to <p>
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    const paragraphs = html
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
    html = paragraphs.map((p) => `<p>${p.replace(/\n/g, '<br />')}</p>`).join('')
  }

  return html
}
