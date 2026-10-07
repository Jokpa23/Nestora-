/* NESTORA QA harness — run with:  npx serve .. -l 8080   then   node tests/responsive-audit.js
   Dev dependencies: npm i -D jsdom puppeteer
   */
/* Overflow / clipping audit across pages and breakpoints */
const puppeteer = require('puppeteer');
const BASE = process.env.BASE_URL || 'http://localhost:8080';

const PAGES = ['index.html', 'properties.html', 'property.html?id=1', 'favorites.html', 'about.html', 'contact.html'];
const VIEWPORTS = [
  { w: 1920, h: 1080, label: '1920' },
  { w: 1440, h: 900, label: '1440' },
  { w: 1280, h: 800, label: '1280' },
  { w: 1024, h: 768, label: '1024' },
  { w: 834, h: 1112, label: '834' },
  { w: 768, h: 1024, label: '768' },
  { w: 390, h: 844, label: '390' },
  { w: 320, h: 700, label: '320' },
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  for (const path of PAGES) {
    const results = [];
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.w, height: vp.h });
      await page.goto(`${BASE}/${path}`, { waitUntil: 'networkidle0' });
      await page.evaluate(async () => {
        window.scrollTo(0, document.body.scrollHeight); // trigger reveals + lazy loads
        await new Promise((r) => setTimeout(r, 400));
        window.scrollTo(0, 0);
      });
      await new Promise((r) => setTimeout(r, 500));

      const audit = await page.evaluate((vw) => {
        const issues = [];
        // horizontal page overflow
        const docW = document.documentElement.scrollWidth;
        if (docW > vw + 1) issues.push(`page scrollWidth ${docW} > ${vw}`);

        // true page overflow: only report elements NOT clipped by an ancestor
        const clippedByAncestor = (el) => {
          let node = el.parentElement;
          while (node && node !== document.body) {
            const cs = getComputedStyle(node);
            if (/(hidden|clip|auto|scroll)/.test(cs.overflowX) || /(hidden|clip|auto|scroll)/.test(cs.overflow)) return true;
            node = node.parentElement;
          }
          return false;
        };
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          const style = getComputedStyle(el);
          if (style.position === 'fixed' || style.visibility === 'hidden' || style.display === 'none') return;
          if (clippedByAncestor(el)) return; // decorative layer inside an overflow-hidden box
          if (r.right > vw + 2 && r.width > 30) {
            const tag = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
            if (!issues.some((i) => i.includes(tag))) issues.push(`overflows right: ${tag} (right ${Math.round(r.right)})`);
          }
        });

        // text clipped inside its own box (heights)
        const clipped = [];
        document.querySelectorAll('.panel, .card__body, .btn, .form-grid, .detail-layout, .sidebar, .price-card, .agent-card, .field, .input, .select, .textarea, .badge, .chip').forEach((el) => {
          const cs = getComputedStyle(el);
          if (cs.overflow === 'hidden' && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
            clipped.push(el.className.split(/\s+/)[0] + ` +${el.scrollWidth - el.clientWidth}px`);
          }
          if (cs.overflow !== 'visible' && el.scrollHeight > el.clientHeight + 2 && cs.overflowY === 'hidden' && el.clientHeight > 0) {
            clipped.push(el.className.split(/\s+/)[0] + ` clipped vertically +${el.scrollHeight - el.clientHeight}px`);
          }
        });
        return { issues, clipped: clipped.slice(0, 8), docW, innerW: window.innerWidth };
      }, vp.w);

      if (audit.issues.length || audit.clipped.length) {
        results.push({ viewport: vp.label, issues: audit.issues, clipped: audit.clipped });
      }
      await page.close();
    }
    console.log(`\n${path}`);
    console.log(results.length ? JSON.stringify(results, null, 1) : '  ✓ no overflow or clipping at any breakpoint');
  }
  await browser.close();
})();
