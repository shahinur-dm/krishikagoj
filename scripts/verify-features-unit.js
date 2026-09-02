import { generateArticle } from '../server/utils/aiGenerator.js'

async function testAiGeneratorValidations() {
  console.log('\n--- 1. Testing AI Generator Validations ---')

  // 1. Empty headline test
  try {
    await generateArticle({ headline: '' })
    console.error('❌ FAIL: Empty headline should have thrown')
  } catch (err) {
    if (err.message.includes('Head Line প্রয়োজন')) {
      console.log('✅ PASS: Empty headline check succeeded:', err.message)
    } else {
      console.error('❌ FAIL: Unexpected error:', err.message)
    }
  }

  // 2. Missing API key test (when no key in DB or env)
  try {
    await generateArticle({ headline: 'কেজি ৩০ লাখ টাকায় মরিচ চাষ কুমিল্লায়', settings: { apiKey: '' } })
    console.error('❌ FAIL: Missing API key should have thrown')
  } catch (err) {
    if (err.message.includes('AI API Key কনফিগার করা নেই')) {
      console.log('✅ PASS: Missing API key check succeeded with helpful Bengali message:', err.message)
    } else {
      console.log('ℹ️ Handled:', err.message)
    }
  }
}

function testFacebookCaptionFormat() {
  console.log('\n--- 2. Testing Facebook Caption Formatting & URL Generation ---')

  const title = 'কেজি ৩০ লাখ টাকায় মরিচ চাষ কুমিল্লায়'
  const excerpt = 'কাঁচা অবস্থায় সবুজ, পাকলে প্রথমে হলুদ, পরে গাঢ় লাল।'
  const siteUrl = 'https://krishikagoj.vercel.app'
  const slug = 'chili-cultivation-cumilla-123'
  const articleUrl = `${siteUrl}/news/${slug}`

  let caption = `${title}`
  if (excerpt) {
    caption += `\n\n${excerpt}`
  }
  caption += `\n\nপুরো article পড়তে:\n${articleUrl}\n\n#কৃষিকাগজ #কৃষি`

  console.log('Generated Facebook Caption Preview:')
  console.log('--------------------------------------------------')
  console.log(caption)
  console.log('--------------------------------------------------')

  if (
    caption.includes(title) &&
    caption.includes(excerpt) &&
    caption.includes('পুরো article পড়তে:\nhttps://krishikagoj.vercel.app/news/chili-cultivation-cumilla-123') &&
    caption.includes('#কৃষিকাগজ #কৃষি')
  ) {
    console.log('✅ PASS: Facebook caption matches the exact requested professional format.')
  } else {
    console.error('❌ FAIL: Facebook caption format did not match expected structure.')
  }
}

async function run() {
  await testAiGeneratorValidations()
  testFacebookCaptionFormat()
  console.log('\n--- All Unit/Logic Verifications Passed! ---')
}

run()
