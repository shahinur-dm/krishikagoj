import { translateText, translateHtml, translateArticleFields } from '../utils/translator.js'

async function runComprehensiveVerification() {
  console.log('====================================================')
  console.log('  KRISHIKAGOJ TRANSLATION & LANGUAGE SYSTEM AUDIT  ')
  console.log('====================================================\n')

  let passed = 0
  let total = 0

  function assert(condition, message) {
    total++
    if (condition) {
      console.log(`[PASS] ${message}`)
      passed++
    } else {
      console.error(`[FAIL] ${message}`)
      throw new Error(`Assertion failed: ${message}`)
    }
  }

  // 1. Article Creation / Headline translation
  console.log('--- 1. ADMIN ARTICLE CREATION TEST ---')
  const bnTitle = 'মেহেরপুরে গ্রীষ্মকালীন তরমুজ চাষে কৃষকদের অভাবনীয় সাফল্য'
  const bnExcerpt = 'মেহেরপুরের চাষিরা অসময়ে তরমুজ চাষ করে অধিক লাভবান হচ্ছেন।'
  const bnBody = '<p>মেহেরপুর জেলায় <strong>গ্রীষ্মকালীন তরমুজ</strong> চাষ বাড়ছে। <a href="https://krishikagoj.com/news/test">বিস্তারিত পড়ুন এখানে</a>।</p>'
  
  const transFields = await translateArticleFields({
    title: bnTitle,
    excerpt: bnExcerpt,
    body: bnBody,
  })

  assert(transFields.titleEn && typeof transFields.titleEn === 'string', 'English Title generated successfully')
  assert(transFields.excerptEn && typeof transFields.excerptEn === 'string', 'English Excerpt generated successfully')
  assert(transFields.bodyEn && typeof transFields.bodyEn === 'string', 'English Body generated successfully')
  console.log('Result EN Title:', transFields.titleEn)
  console.log('Result EN Excerpt:', transFields.excerptEn)

  // 2. Rich HTML, Media, and Hyperlink Preservation
  console.log('\n--- 2. RICH HTML & MEDIA PRESERVATION TEST ---')
  const complexHtml = `
    <p>কৃষি কর্মকর্তা বলেন, <strong>বীজ বপনের</strong> পর প্রয়োজনীয় সার দিতে হবে।</p>
    <figure class="news-image"><img src="/api/media/watermelon-photo.jpg" alt="তরমুজ ক্ষেত" /><figcaption>মেহেরপুরের তরমুজ ক্ষেত</figcaption></figure>
    <p>ভিডিও রিপোর্ট দেখতে ক্লিক করুন: <a href="https://youtube.com/watch?v=12345" target="_blank">ভিডিও লিংক</a></p>
    <iframe src="https://www.youtube.com/embed/12345" width="100%" height="360" title="video" frameborder="0"></iframe>
    <ul>
      <li>জাত: ব্লাক বেবি</li>
      <li>ফলন: হেক্টর প্রতি ৩৫ টন</li>
    </ul>
  `
  const translatedComplexHtml = await translateHtml(complexHtml, 'bn', 'en')
  
  assert(translatedComplexHtml.includes('<strong>') && translatedComplexHtml.includes('</strong>'), '<strong> tags preserved')
  assert(translatedComplexHtml.includes('<img src="/api/media/watermelon-photo.jpg"'), 'Image src preserved perfectly')
  assert(translatedComplexHtml.includes('href="https://youtube.com/watch?v=12345"'), 'Anchor href URL preserved')
  assert(translatedComplexHtml.includes('src="https://www.youtube.com/embed/12345"'), 'Iframe src preserved')
  assert(translatedComplexHtml.includes('<ul>') && translatedComplexHtml.includes('<li>'), 'List tags preserved')
  console.log('Translated Complex HTML snippet:\n', translatedComplexHtml.trim().slice(0, 300) + '...')

  // 3. Translation Cache & Speed
  console.log('\n--- 3. TRANSLATION CACHE EFFICIENCY TEST ---')
  const startT = Date.now()
  const cachedTitle = await translateText(bnTitle, 'bn', 'en')
  const endT = Date.now()
  assert(cachedTitle === transFields.titleEn, 'Cached title matches generated title')
  assert(endT - startT < 20, `Cached lookup returned instantly in ${endT - startT}ms`)

  // 4. Safe Error Fallback Handling
  console.log('\n--- 4. FAILURE RESILIENCE TEST ---')
  const emptyRes = await translateText('', 'bn', 'en')
  assert(emptyRes === '', 'Empty input handled gracefully without crashing')

  const nullRes = await translateHtml(null, 'bn', 'en')
  assert(nullRes === '', 'Null HTML handled gracefully without crashing')

  console.log(`\n====================================================`)
  console.log(`  AUDIT COMPLETE: ${passed}/${total} CHECKS PASSED`)
  console.log(`====================================================`)
}

runComprehensiveVerification().catch((err) => {
  console.error('Audit failed:', err)
  process.exit(1)
})
