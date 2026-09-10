async function inspectLive() {
  for (const domain of ['https://krishikagoj.vercel.app', 'https://krishikagoj-two.vercel.app']) {
    console.log('\n========================================');
    console.log('Checking Domain:', domain);
    console.log('========================================');

    // 1. Check API /api/settings and /api/home
    try {
      const setRes = await fetch(`${domain}/api/settings`);
      const setData = await setRes.json();
      console.log('Settings API status:', setRes.status);
      console.log('Settings keys:', Object.keys(setData));
      console.log('newsStoriesTitle in settings:', setData.newsStoriesTitle);
      console.log('homepageSlots:', Boolean(setData.homepageSlots));
    } catch (e) {
      console.log('Settings API error:', e.message);
    }

    try {
      const homeRes = await fetch(`${domain}/api/home`);
      const homeData = await homeRes.json();
      console.log('Home API status:', homeRes.status);
      console.log('newsStoriesTitle in home settings:', homeData?.settings?.newsStoriesTitle);
    } catch (e) {
      console.log('Home API error:', e.message);
    }

    // 2. Check HTML and JS bundles
    try {
      const htmlRes = await fetch(domain);
      const html = await htmlRes.text();
      const scriptRegex = /src="([^"]+\.js)"/g;
      let match;
      const scripts = [];
      while ((match = scriptRegex.exec(html)) !== null) {
        scripts.push(match[1]);
      }
      console.log('Loaded scripts from index.html:', scripts);

      for (const src of scripts) {
        const scriptUrl = src.startsWith('http') ? src : `${domain}${src}`;
        const scriptRes = await fetch(scriptUrl);
        const scriptText = await scriptRes.text();
        console.log(`Script ${src} size: ${scriptText.length}`);
        console.log(`- has "newsStoriesTitle":`, scriptText.includes('newsStoriesTitle'));
        console.log(`- has "নিউজ স্টোরিজ সেকশন":`, scriptText.includes('নিউজ স্টোরিজ সেকশন'));
      }
    } catch (e) {
      console.log('HTML/JS error:', e.message);
    }
  }
}

inspectLive();
