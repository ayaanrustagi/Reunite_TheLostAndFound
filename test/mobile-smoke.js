/**
 * Mobile / tablet layout smoke test.
 *
 * Serves the static site and drives a headless Chromium across phone, tablet,
 * and desktop viewports, asserting on each page that:
 *   - there is no horizontal overflow (content fits the viewport),
 *   - the hero's Three.js canvas initialises and has a non-zero size,
 *   - no uncaught JavaScript errors fire.
 *
 * Run:  npm test     (requires `npx playwright install chromium` once)
 *
 * Exits non-zero on any failure so it can gate CI. Skips gracefully (exit 0)
 * if the Chromium binary hasn't been installed.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = 4321;

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.ico': 'image/x-icon',
};

function startServer() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let url = decodeURIComponent(req.url.split('?')[0]);
      if (url.startsWith('/api/')) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('[]'); }
      if (url === '/') url = '/index.html';
      const file = path.join(ROOT, url);
      if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
      fs.readFile(file, (err, buf) => {
        if (err) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
        res.end(buf);
      });
    });
    srv.listen(PORT, () => resolve(srv));
  });
}

const VIEWPORTS = [
  { name: 'phone-360',   width: 360,  height: 640  },
  { name: 'phone-390',   width: 390,  height: 844  },
  { name: 'phone-430',   width: 430,  height: 932  },
  { name: 'tablet-768',  width: 768,  height: 1024 },
  { name: 'tablet-820',  width: 820,  height: 1180 },
  { name: 'tablet-1024', width: 1024, height: 1366 },
  { name: 'desktop-1280', width: 1280, height: 800 },
];
const SECTIONS = ['found', 'report', 'claim'];

async function measure(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    const canvas = document.getElementById('sh-canvas');
    return {
      overflow: de.scrollWidth - window.innerWidth,
      hasTHREE: !!window.THREE,
      canvas: canvas ? { w: canvas.clientWidth, h: canvas.clientHeight } : null,
    };
  });
}

(async () => {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch { console.log('SKIP: playwright not installed (npm i -D playwright).'); process.exit(0); }

  const server = await startServer();
  let browser;
  try {
    browser = await chromium.launch({
      args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'],
    });
  } catch (e) {
    console.log('SKIP: Chromium not installed — run `npx playwright install chromium`.');
    server.close();
    process.exit(0);
  }

  const failures = [];

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2, isMobile: vp.width < 1025, hasTouch: vp.width < 1025,
    });
    const page = await ctx.newPage();
    const jsErrors = new Set();
    page.on('pageerror', e => jsErrors.add(String(e).slice(0, 140)));

    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    const hero = await measure(page);
    if (hero.overflow > 1) failures.push(`${vp.name} hero: horizontal overflow +${hero.overflow}px`);
    if (!hero.hasTHREE)    failures.push(`${vp.name} hero: Three.js failed to load`);
    if (vp.width >= 1025) {
      if (!hero.canvas || hero.canvas.w < 1 || hero.canvas.h < 1)
        failures.push(`${vp.name} hero: canvas has no size`);
    }

    for (const sec of SECTIONS) {
      await page.evaluate(s => window.navigateToSection && window.navigateToSection(s), sec);
      await page.waitForTimeout(350);
      const m = await measure(page);
      if (m.overflow > 1) failures.push(`${vp.name} ${sec}: horizontal overflow +${m.overflow}px`);
    }

    if (jsErrors.size) failures.push(`${vp.name}: JS errors → ${[...jsErrors].join(' | ')}`);

    console.log(`${failures.some(f => f.startsWith(vp.name)) ? 'FAIL' : 'PASS'}  ${vp.name}`);
    await ctx.close();
  }

  await browser.close();
  server.close();

  if (failures.length) {
    console.error('\n' + failures.length + ' failure(s):');
    failures.forEach(f => console.error('  - ' + f));
    process.exit(1);
  }
  console.log('\nAll viewports passed: no overflow, hero renders, no JS errors.');
})();
