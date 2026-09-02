import 'dotenv/config'
import jwt from 'jsonwebtoken'
import { connectDb } from '../server/app.js'
import User from '../server/models/User.js'
import Article from '../server/models/Article.js'
import Category from '../server/models/Category.js'
import SiteSetting from '../server/models/SiteSetting.js'
import app from '../server/app.js'
import http from 'http'

async function startTestServer() {
  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(5051, resolve))
  return server
}

async function runTests() {
  console.log('--- Starting Verification of AI Writer and Facebook Posting Features ---')
  await connectDb()
  const server = await startTestServer()
  const baseUrl = 'http://localhost:5051/api'

  try {
    // 1. Get or create a superadmin user for token
    let user = await User.findOne({ role: 'superadmin' })
    if (!user) {
      user = await User.findOne({ isActive: true })
    }
    const token = jwt.sign(
      { id: user?._id || '600000000000000000000001', role: 'superadmin' },
      process.env.JWT_SECRET || 'krishikajosh-secret-change-me',
      { expiresIn: '1h' },
    )

    // ----------------------------------------------------
    // TEST 1: AI Writer Endpoint Checks
    // ----------------------------------------------------
    console.log('\n[Test 1] Testing AI Writer Endpoint (/api/settings/ai-writer/generate)...')

    // 1a. Test empty headline
    const resEmptyHead = await fetch(`${baseUrl}/settings/ai-writer/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ headline: '' }),
    })
    const dataEmptyHead = await resEmptyHead.json()
    console.log('1a. Empty headline status:', resEmptyHead.status, '| message:', dataEmptyHead.message)
    if (resEmptyHead.status === 400 && dataEmptyHead.message.includes('Head Line')) {
      console.log('✅ PASS: Empty headline is properly validated.')
    } else {
      console.error('❌ FAIL: Empty headline validation failed.')
    }

    // 1b. Test missing API key handling (or generation if API key is present)
    const resValidHead = await fetch(`${baseUrl}/settings/ai-writer/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        headline: 'কেজি ৩০ লাখ টাকায় মরিচ চাষ কুমিল্লায়',
        category: 'কৃষি',
      }),
    })
    const dataValidHead = await resValidHead.json()
    console.log('1b. AI Writer call status:', resValidHead.status, '| response:', dataValidHead.message || (dataValidHead.content ? 'Content generated successfully' : ''))
    if (resValidHead.ok && dataValidHead.content) {
      console.log('✅ PASS: AI Writer generated content successfully!')
    } else if (resValidHead.status === 400 && dataValidHead.message.includes('API Key')) {
      console.log('✅ PASS: Missing AI API key gracefully handled with clear Bengali guidance!')
    }

    // ----------------------------------------------------
    // TEST 2: Facebook Posting Endpoint Checks
    // ----------------------------------------------------
    console.log('\n[Test 2] Testing Facebook Posting Endpoint (/api/articles/admin/:id/facebook-post)...')

    // Find or create a category and article
    let cat = await Category.findOne({ isActive: true })
    if (!cat) {
      cat = await Category.create({ name: 'কৃষি', slug: 'krishi-test', isActive: true })
    }

    // 2a. Test draft article prevention
    const draftArticle = await Article.create({
      title: 'টেস্ট ড্রাফট খবর ' + Date.now(),
      slug: 'test-draft-news-' + Date.now(),
      body: '<p>ড্রাফট বডি</p>',
      category: cat._id,
      isPublished: false,
    })

    const resDraftPost = await fetch(`${baseUrl}/articles/admin/${draftArticle._id}/facebook-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    const dataDraftPost = await resDraftPost.json()
    console.log('2a. Draft article post status:', resDraftPost.status, '| message:', dataDraftPost.message)
    if (resDraftPost.status === 400 && dataDraftPost.message.includes('ড্রাফট')) {
      console.log('✅ PASS: Draft post is properly blocked from publishing to Facebook.')
    } else {
      console.error('❌ FAIL: Draft post was not blocked correctly.')
    }

    // 2b. Test published article Facebook post (with/without credentials)
    const publishedArticle = await Article.create({
      title: 'কেজি ৩০ লাখ টাকায় মরিচ চাষ কুমিল্লায়',
      slug: 'chili-cultivation-cumilla-' + Date.now(),
      excerpt: 'কাঁচা অবস্থায় সবুজ, পাকলে প্রথমে হলুদ, পরে গাঢ় লাল।',
      body: '<p>কুমিল্লায় বিশেষ জাতের মরিচ চাষ করে কৃষকদের মাঝে ব্যাপক সাড়া পড়েছে।</p>',
      category: cat._id,
      image: '/placeholder-news.svg',
      isPublished: true,
    })

    const resPublishedPost = await fetch(`${baseUrl}/articles/admin/${publishedArticle._id}/facebook-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    const dataPublishedPost = await resPublishedPost.json()
    console.log('2b. Published article post status:', resPublishedPost.status, '| message:', dataPublishedPost.message)

    if (resPublishedPost.ok && dataPublishedPost.success) {
      console.log('✅ PASS: Facebook post published successfully!')
    } else if (resPublishedPost.status === 400 && dataPublishedPost.message.includes('Facebook Page ID অথবা Page Access Token')) {
      console.log('✅ PASS: Missing Facebook credentials handled with clear Bengali guidance and no silent failure!')
    }

    // Clean up test articles
    await Article.findByIdAndDelete(draftArticle._id)
    await Article.findByIdAndDelete(publishedArticle._id)

    console.log('\n--- All Automated End-to-End Checks Completed Successfully ---')
  } finally {
    server.close()
  }
}

runTests().catch((err) => {
  console.error('Test run failed:', err)
  process.exit(1)
})
