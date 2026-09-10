async function inspectDomain() {
  const domains = [
    'https://krishikagoj.com',
    'https://krishikagoj.vercel.app',
    'https://krishikagoj-two.vercel.app'
  ];

  for (const domain of domains) {
    console.log('\n========================================');
    console.log('Domain:', domain);
    console.log('========================================');
    try {
      const res = await fetch(domain, { cache: 'no-store' });
      console.log('Status:', res.status);
      console.log('Vercel headers:');
      for (const [k, v] of res.headers.entries()) {
        if (k.toLowerCase().includes('vercel') || k.toLowerCase().includes('cache') || k.toLowerCase().includes('server') || k.toLowerCase().includes('age')) {
          console.log(`  ${k}: ${v}`);
        }
      }
      const html = await res.text();
      const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
      console.log('Main bundle script:', match ? match[1] : 'not found');

      // Check settings API
      const setRes = await fetch(`${domain}/api/settings`, { cache: 'no-store' });
      const settings = await setRes.json();
      console.log('API /api/settings newsStoriesTitle:', settings?.newsStoriesTitle);
      console.log('API /api/settings newsStandingTitle:', settings?.newsStandingTitle);

      // Check home API
      const homeRes = await fetch(`${domain}/api/home`, { cache: 'no-store' });
      const home = await homeRes.json();
      console.log('API /api/home settings.newsStoriesTitle:', home?.settings?.newsStoriesTitle);
      console.log('API /api/home settings.newsStandingTitle:', home?.settings?.newsStandingTitle);
    } catch (e) {
      console.log('Error:', e.message);
    }
  }
}

inspectDomain();
