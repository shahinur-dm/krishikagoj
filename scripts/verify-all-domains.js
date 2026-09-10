async function verifyAll() {
  const domains = [
    'https://krishikagoj.com',
    'https://krishikagoj.vercel.app',
    'https://krishikagoj-two.vercel.app'
  ];

  console.log('Verifying all production domains and custom domain...');

  for (let attempt = 1; attempt <= 15; attempt++) {
    console.log(`\n--- Check #${attempt} ---`);
    let allUpdated = true;

    for (const domain of domains) {
      try {
        const htmlRes = await fetch(domain, { cache: 'no-store' });
        const html = await htmlRes.text();
        const mainMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
        const mainBundle = mainMatch ? mainMatch[1] : 'not found';

        const setRes = await fetch(`${domain}/api/settings`, { cache: 'no-store' });
        const settings = await setRes.json();

        const homeRes = await fetch(`${domain}/api/home`, { cache: 'no-store' });
        const home = await homeRes.json();

        const storyTitle = home?.settings?.newsStoriesTitle || home?.settings?.newsStandingTitle;

        console.log(`[${domain}]`);
        console.log(`  Bundle: ${mainBundle}`);
        console.log(`  Settings Title: "${settings?.newsStoriesTitle}"`);
        console.log(`  Home Title: "${storyTitle}"`);

        if (!storyTitle || mainBundle === '/assets/index-DRvzlZtC.js') {
          allUpdated = false;
        }
      } catch (e) {
        console.log(`[${domain}] Error:`, e.message);
        allUpdated = false;
      }
    }

    if (allUpdated && attempt >= 2) {
      console.log('\n>>> SUCCESS! All domains (including custom domain https://krishikagoj.com) are updated and fully synchronized! <<<');
      break;
    }

    await new Promise(r => setTimeout(r, 10000));
  }
}

verifyAll();
