async function checkChunks() {
  for (const domain of ['https://krishikagoj.vercel.app', 'https://krishikagoj-two.vercel.app']) {
    console.log('\n========================================');
    console.log('Inspecting Chunks for:', domain);
    console.log('========================================');

    const htmlRes = await fetch(domain);
    const html = await htmlRes.text();
    const mainJsMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (!mainJsMatch) {
      console.log('Could not find main JS');
      continue;
    }

    const mainJsUrl = `${domain}${mainJsMatch[1]}`;
    console.log('Main JS:', mainJsUrl);
    const mainJsRes = await fetch(mainJsUrl);
    const mainJsText = await mainJsRes.text();

    // Find all chunk URLs in the main JS
    const chunkMatches = [...mainJsText.matchAll(/assets\/[A-Za-z0-9_-]+\.js/g)].map(m => m[0]);
    console.log('Total chunks referenced:', chunkMatches.length);

    // Look for WebsiteSettingsPage chunk
    for (const chunk of chunkMatches) {
      if (chunk.includes('WebsiteSettings') || chunk.includes('HomeLead') || chunk.includes('ytARmGiP')) {
        console.log('Found relevant chunk:', chunk);
        const chunkRes = await fetch(`${domain}/${chunk}`);
        const chunkText = await chunkRes.text();
        console.log(`- ${chunk} (status: ${chunkRes.status}, size: ${chunkText.length})`);
        console.log(`  has "newsStoriesTitle":`, chunkText.includes('newsStoriesTitle'));
        console.log(`  has "নিউজ স্টোরিজ সেকশন শিরোনাম":`, chunkText.includes('নিউজ স্টোরিজ সেকশন শিরোনাম'));
      }
    }
  }
}

checkChunks();
