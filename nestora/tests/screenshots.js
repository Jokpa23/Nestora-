/* NESTORA QA harness — run with:  npx serve .. -l 8080   then   node tests/screenshots.js
   Dev dependencies: npm i -D jsdom puppeteer
   */
/* Headless Chrome QA: console errors + screenshots for visual review */
const puppeteer = require('puppeteer');
const fs = require('fs');
const BASE = process.env.BASE_URL || 'http://localhost:8080';
const OUT = process.env.OUT_DIR || './tests/screenshots';
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  ['index', 'index.html'],
  ['properties', 'properties.html'],
  ['property-detail', 'property.html?id=1'],
  ['favorites', 'favorites.html'],
  ['about', 'about.html'],
  ['contact', 'contact.html?subject=sell'],
];

const autoScroll = async (page) => {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0;
      const step = Math.max(200, Math.floor(window.innerHeight * 0.6));
      const timer = setInterval(() => {
        y += step;
        window.scrollTo(0, y);
        if (y >= document.body.scrollHeight) { clearInterval(timer); resolve(); }
      }, 120);
    });
  });
  await new Promise((r) => setTimeout(r, 700));
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 500));
};

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  });
  const report = [];

  for (const [name, path] of PAGES) {
    for (const [label, viewport] of [
      ['desktop', { width: 1440, height: 900, deviceScaleFactor: 1 }],
      ['mobile', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
    ]) {
      const page = await browser.newPage();
      const errors = [];
      page.on('console', (msg) => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
      page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));
      page.on('requestfailed', (req) => errors.push('requestfailed: ' + req.url() + ' — ' + (req.failure() || {}).errorText));

      await page.setViewport(viewport);
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await page.goto(`${BASE}/${path}`, { waitUntil: 'networkidle0', timeout: 60000 });
      await autoScroll(page);

      // top of page
      await page.screenshot({ path: `${OUT}/${name}-${label}-top.png` });
      // a mid-page slice and the footer
      const h = await page.evaluate(() => document.body.scrollHeight);
      await page.evaluate((y) => window.scrollTo(0, y), Math.min(h * 0.42, h - viewport.height));
      await new Promise((r) => setTimeout(r, 900));
      await page.screenshot({ path: `${OUT}/${name}-${label}-mid.png` });
      await page.evaluate((y) => window.scrollTo(0, y), h);
      await new Promise((r) => setTimeout(r, 900));
      await page.screenshot({ path: `${OUT}/${name}-${label}-bottom.png` });

      report.push({ page: name, view: label, height: h, errors });
      await page.close();
    }
  }

  /* mobile menu open state */
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0' });
    await page.click('[data-burger]');
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: `${OUT}/index-mobile-drawer.png` });
    await page.close();
  }

  /* interaction states: favourite clicked + toast, filter applied, lightbox */
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.querySelector('#featured-grid').scrollIntoView({ block: 'center' }));
    await new Promise((r) => setTimeout(r, 1200));
    await page.click('#featured-grid .fav-btn');
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: `${OUT}/state-favourite-toast.png` });
    await page.close();
  }
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto(`${BASE}/properties.html`, { waitUntil: 'networkidle0' });
    await page.select('#filter-type', 'Apartment');
    await page.select('#sort-select', 'price-desc');
    await new Promise((r) => setTimeout(r, 900));
    await page.screenshot({ path: `${OUT}/state-filters-applied.png` });
    await page.close();
  }
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto(`${BASE}/property.html?id=1`, { waitUntil: 'networkidle0' });
    await page.click('#gallery-thumbs [data-thumb="1"]');
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: `${OUT}/state-gallery.png` });
    await page.click('#gallery-stage');
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: `${OUT}/state-lightbox.png` });
    await page.keyboard.press('Escape');
    await page.click('[data-modal-open="agent-modal"]');
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: `${OUT}/state-modal.png` });
    await page.close();
  }

  console.log(JSON.stringify(report, null, 1));
  console.log('\nFiles:', fs.readdirSync(OUT).length);
  await browser.close();
})();
