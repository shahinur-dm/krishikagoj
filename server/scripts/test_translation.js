import { translateText, translateHtml, translateArticleFields } from '../utils/translator.js'

async function runTests() {
  console.log('=== TEST 1: Plain text headline translation ===')
  const bnHeadline = '১৬৫৫ কোটি টাকার ১৭ প্রকল্প: প্রথম মাসে বরাদ্দ ও খরচ শূন্য'
  const enHeadline = await translateText(bnHeadline, 'bn', 'en')
  console.log('BN:', bnHeadline)
  console.log('EN:', enHeadline)
  if (!enHeadline || enHeadline === bnHeadline) {
    throw new Error('Headline translation failed')
  }

  console.log('\n=== TEST 2: Short head / Excerpt translation ===')
  const bnExcerpt = 'বিএডিসি সূত্র জানায়, চলতি অর্থবছরে ১৭টি প্রকল্প বাস্তবায়ন করা হচ্ছে।'
  const enExcerpt = await translateText(bnExcerpt, 'bn', 'en')
  console.log('BN Excerpt:', bnExcerpt)
  console.log('EN Excerpt:', enExcerpt)
  if (!enExcerpt || enExcerpt === bnExcerpt) {
    throw new Error('Excerpt translation failed')
  }

  console.log('\n=== TEST 3: Rich HTML Details translation preserving tags ===')
  const bnHtml = `
    <p>বিএডিসি সূত্র জানায়, <strong>চলতি অর্থবছরে</strong> ১৭টি প্রকল্প বাস্তবায়ন করা হচ্ছে।</p>
    <p>এগুলোর মোট ব্যয় ধরা হয়েছে <a href="https://krishikagoj.com">১৬৫৫ কোটি টাকা</a>।</p>
    <ul>
      <li>প্রথম প্রকল্প: সেচ উন্নয়ন</li>
      <li>দ্বিতীয় প্রকল্প: বীজ সংরক্ষণ</li>
    </ul>
    <figure><img src="/api/media/12345" alt="চিত্র" /><figcaption>প্রকল্পের চিত্র</figcaption></figure>
  `
  const enHtml = await translateHtml(bnHtml, 'bn', 'en')
  console.log('EN HTML:\n', enHtml)
  
  if (!enHtml.includes('<strong>') || !enHtml.includes('</strong>')) {
    throw new Error('HTML tags were corrupted during translation')
  }
  if (!enHtml.includes('<a href="https://krishikagoj.com">')) {
    throw new Error('Anchor link attributes were corrupted during translation')
  }
  if (!enHtml.includes('<img src="/api/media/12345" alt="চিত্র" />')) {
    throw new Error('Image tag was corrupted during translation')
  }

  console.log('\n=== TEST 4: Full Article Fields Translation ===')
  const articleFields = await translateArticleFields({
    title: 'কৃষি বিপ্লবে নতুন দিগন্ত',
    excerpt: 'আধুনিক প্রযুক্তির ব্যবহারে কৃষিতে এসেছে বিরাট পরিবর্তন।',
    body: '<p>কৃষক ভাইদের জন্য সরকার নতুন সুযোগ-সুবিধা ঘোষণা করেছে।</p>',
  })
  console.log('Article Translated:', articleFields)
  if (!articleFields.titleEn || !articleFields.excerptEn || !articleFields.bodyEn) {
    throw new Error('Article translation failed to populate all fields')
  }

  console.log('\n=== TEST 5: Cache Verification ===')
  const t1 = Date.now()
  const cachedTitle = await translateText(bnHeadline, 'bn', 'en')
  const t2 = Date.now()
  console.log(`Cache retrieval took ${t2 - t1}ms -> ${cachedTitle}`)
  if (t2 - t1 > 50) {
    console.warn('Cache might not be hitting instantaneous lookup')
  }

  console.log('\n>>> ALL TRANSLATION TESTS PASSED SUCCESSFULLY! <<<')
}

runTests().catch((err) => {
  console.error('Test failed:', err)
  process.exit(1)
})
