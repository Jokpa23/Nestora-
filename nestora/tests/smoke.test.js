/* NESTORA QA harness — run with:  npx serve .. -l 8080   then   node tests/smoke.test.js
   Dev dependencies: npm i -D jsdom puppeteer
   */
/* jsdom smoke test for the NESTORA site */
const { JSDOM, VirtualConsole } = require('jsdom');
const BASE = process.env.BASE_URL || 'http://localhost:8080';

let pass = 0, fail = 0;
const problems = [];

function check(name, condition, extra) {
  if (condition) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra !== undefined ? '  →  ' + JSON.stringify(extra) : '')); problems.push(name); }
}

async function load(page) {
  const logs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => {
    const msg = (e && e.message) || String(e);
    if (/Not implemented/i.test(msg)) return; // jsdom lacks scrollTo/matchMedia etc.
    logs.push('jsdomError: ' + msg);
  });
  vc.on('error', (...a) => logs.push('console.error: ' + a.map(String).join(' ')));
  vc.on('warn', () => {});
  const dom = await JSDOM.fromURL(`${BASE}/${page}`, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc,
  });
  await new Promise((r) => dom.window.addEventListener('load', r));
  await new Promise((r) => setTimeout(r, 500));
  return { dom, window: dom.window, doc: dom.window.document, logs };
}

const q = (doc, sel) => doc.querySelectorAll(sel);
const txt = (doc, sel) => (doc.querySelector(sel) || {}).textContent || '';

(async () => {
  /* ---------------------------------------------------------------- HOME */
  console.log('\n=== index.html ===');
  {
    const { window, doc, logs } = await load('index.html');
    check('no runtime errors', logs.length === 0, logs);
    check('featured grid renders 6 cards', q(doc, '#featured-grid .card').length === 6, q(doc, '#featured-grid .card').length);
    check('hero image is not lazy loaded', doc.querySelector('.hero__media img').getAttribute('loading') === null);
    check('hero image file present', /hero\.webp$/.test(doc.querySelector('.hero__media img').getAttribute('src')));
    check('below-the-fold cards use lazy loading', q(doc, '#featured-grid .card__img')[0].getAttribute('loading') === 'lazy');
    check('nav has 6 links', q(doc, '.nav__list .nav__link').length === 6);
    check('stats counters exist', q(doc, '[data-count]').length >= 4);

    // favourite interaction
    const heart = doc.querySelector('#featured-grid .fav-btn');
    heart.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 60));
    check('heart becomes active after click', heart.classList.contains('is-active'));
    check('counter updates to 1', txt(doc, '.favorites-count') === '1', txt(doc, '.favorites-count'));
    check('toast shown for favourite', q(doc, '.toast').length === 1);
    check('localStorage persisted', /^\[\d+\]$/.test(window.localStorage.getItem('nestora:favorites:v1') || ''), window.localStorage.getItem('nestora:favorites:v1'));

    // second click removes it
    heart.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 60));
    check('heart toggles off', !heart.classList.contains('is-active'));
    check('counter hidden at zero', txt(doc, '.favorites-count') === '0');

    // tabs
    const rentTab = doc.querySelector('[data-featured-tab="rent"]');
    rentTab.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 400));
    const rentCards = q(doc, '#featured-grid .card').length;
    check('For Rent tab renders 2 rental listings', rentCards === 2, rentCards);
    check('to-top button injected', !!doc.querySelector('[data-to-top]'));

    const burger = doc.querySelector('[data-burger]');
    const drawer = doc.querySelector('[data-drawer]');
    burger.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check('burger opens the mobile drawer', drawer.classList.contains('is-open'));
    check('burger reflects expanded state', burger.getAttribute('aria-expanded') === 'true');
    doc.querySelector('[data-drawer-close]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check('drawer close button closes the menu', !drawer.classList.contains('is-open'));
    check('body scroll lock released', !doc.body.classList.contains('is-locked'));
    check('footer year stamped', /20\d\d/.test(txt(doc, '[data-year]')));
    check('drawer link count', q(doc, '.drawer__link').length === 6);
    check('drawer has its own close button', !!doc.querySelector('[data-drawer-close]'));
    window.close();
  }

  /* ---------------------------------------------------------- PROPERTIES */
  console.log('\n=== properties.html ===');
  {
    const { window, doc, logs } = await load('properties.html');
    check('no runtime errors', logs.length === 0, logs);
    check('count reads 8 Properties Found', /8\s*Properties Found/i.test(txt(doc, '#results-count')), txt(doc, '#results-count'));
    check('page 1 shows 6 cards', q(doc, '#results-grid .card').length === 6, q(doc, '#results-grid .card').length);
    check('pagination rendered', q(doc, '#results-pagination button').length === 4, q(doc, '#results-pagination button').length);
    check('summary line filled', /Showing 1–6 of 8/.test(txt(doc, '#results-summary')), txt(doc, '#results-summary'));

    const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));
    const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    const wait = () => new Promise((r) => setTimeout(r, 320));

    // pagination
    click(doc.querySelector('#results-pagination button[data-page="2"]'));
    await wait();
    check('page 2 shows remaining 2 cards', q(doc, '#results-grid .card').length === 2, q(doc, '#results-grid .card').length);
    click(doc.querySelector('#results-pagination button[data-page="1"]'));
    await wait();

    // preset: for rent
    click(doc.querySelector('[data-preset="rent"]'));
    await wait();
    check('For Rent preset → 2 properties', /2\s*Properties Found/i.test(txt(doc, '#results-count')), txt(doc, '#results-count'));
    check('preset chip is active', doc.querySelector('[data-preset="rent"]').classList.contains('is-active'));

    // back to all, then combine type + price
    click(doc.querySelector('[data-preset="all"]'));
    await wait();
    const typeSelect = doc.querySelector('#filter-type');
    typeSelect.value = 'Apartment';
    fire(typeSelect, 'change');
    await wait();
    check('type=Apartment → 2 properties', /2\s*Properties Found/i.test(txt(doc, '#results-count')), txt(doc, '#results-count'));

    typeSelect.value = 'Any';
    fire(typeSelect, 'change');
    await wait();
    const min = doc.querySelector('#filter-min');
    const max = doc.querySelector('#filter-max');
    min.value = '100000000'; fire(min, 'change');
    max.value = '250000000'; fire(max, 'change');
    await wait();
    check('₦100M–₦250M → 3 properties', /3\s*Properties Found/i.test(txt(doc, '#results-count')), txt(doc, '#results-count'));
    check('active filter chips rendered', q(doc, '#active-filters .chip').length === 2, q(doc, '#active-filters .chip').length);
    check('URL kept in sync', /min=100000000/.test(window.location.search), window.location.search);

    // bedrooms pill inside the price filter
    const beds3 = doc.querySelector('input[name="beds"][value="3"]');
    beds3.checked = true;
    fire(beds3, 'change');
    await wait();
    check('combining 3+ beds keeps 3 in range', /3\s*Properties Found/i.test(txt(doc, '#results-count')), txt(doc, '#results-count'));

    // sorting
    const sort = doc.querySelector('#sort-select');
    sort.value = 'price-desc'; fire(sort, 'change');
    await wait();
    const firstPrice = txt(doc, '#results-grid .card .card__price');
    check('price high→low sorts correctly', /185,000,000/.test(firstPrice), firstPrice);
    sort.value = 'popular'; fire(sort, 'change');
    await wait();
    check('most popular sorts correctly', /The Haven Residence/.test(txt(doc, '#results-grid .card')), txt(doc, '#results-grid .card .card__title'));

    // chip removal + clear all
    click(doc.querySelector('#active-filters .chip'));
    await wait();
    check('removing the min-price chip widens results', /4\s*Properties Found/i.test(txt(doc, '#results-count')), txt(doc, '#results-count'));
    click(doc.querySelector('[data-clear-all]'));
    await wait();
    check('clear all restores 8', /8\s*Properties Found/i.test(txt(doc, '#results-count')), txt(doc, '#results-count'));

    // search: no results
    const search = doc.querySelector('#search-input');
    search.value = 'zzzz';
    fire(search, 'input');
    await wait();
    check('empty state shown for no match', doc.querySelector('#results-empty').hidden === false);
    check('grid hidden when empty', doc.querySelector('#results-grid').hidden === true);
    check('empty state names the query', /zzzz/.test(txt(doc, '#results-empty-query')), txt(doc, '#results-empty-query'));

    // search: location match
    search.value = 'Lekki';
    fire(search, 'input');
    await wait();
    check('search "Lekki" → 3 properties', /3\s*Properties Found/i.test(txt(doc, '#results-count')), txt(doc, '#results-count'));

    // search by property name
    search.value = 'Azure Heights';
    fire(search, 'input');
    await wait();
    check('search by name works', /1\s*Property Found/i.test(txt(doc, '#results-count')), txt(doc, '#results-count'));

    click(doc.querySelector('#search-clear'));
    await wait();
    check('search clear resets list', /8\s*Properties Found/i.test(txt(doc, '#results-count')), txt(doc, '#results-count'));

    // mobile filter toggle
    click(doc.querySelector('#filters-toggle'));
    check('filter panel toggles on mobile trigger', doc.querySelector('#filters-panel').classList.contains('is-open'));

    // favourite from a card
    click(doc.querySelector('#results-grid .fav-btn'));
    await new Promise((r) => setTimeout(r, 60));
    check('favouriting from listing works', /1/.test(txt(doc, '.favorites-count')));
    window.close();
  }

  /* ------------------------------------------------------- PROPERTY PAGE */
  console.log('\n=== property.html?id=1 ===');
  {
    const { window, doc, logs } = await load('property.html?id=1');
    check('no runtime errors', logs.length === 0, logs);
    check('title set from data', /Haven Residence/.test(doc.title), doc.title);
    check('name rendered', txt(doc, '#detail-name') === 'The Haven Residence', txt(doc, '#detail-name'));
    check('location rendered', /Lekki, Lagos/.test(txt(doc, '#detail-location')));
    check('price rendered in Naira', /₦185,000,000/.test(txt(doc, '#detail-price')), txt(doc, '#detail-price'));
    check('thumbnails = 5', q(doc, '#gallery-thumbs .gallery__thumb').length === 5, q(doc, '#gallery-thumbs .gallery__thumb').length);
    check('counter reads 1 / 5', txt(doc, '#gallery-counter') === '1 / 5', txt(doc, '#gallery-counter'));
    check('10 features listed', q(doc, '#detail-features li').length === 10, q(doc, '#detail-features li').length);
    check('10 spec rows', q(doc, '#detail-specs .spec-row').length === 10, q(doc, '#detail-specs .spec-row').length);
    check('spec includes Year Built 2025', /2025/.test(txt(doc, '#detail-specs')));
    check('meta strip has 5 items', q(doc, '#detail-meta .detail-meta__item').length === 5, q(doc, '#detail-meta .detail-meta__item').length);
    check('agent name is David Williams', txt(doc, '#agent-name') === 'David Williams', txt(doc, '#agent-name'));
    check('agent role rendered', /Senior Property Consultant/.test(txt(doc, '#agent-role')));
    check('agent photo points at local asset', /assets\/images\/agents\/agent-01\.webp/.test(doc.querySelector('#agent-photo img').getAttribute('src')));
    check('whatsapp deep link built', /wa\.me\/2348024157788/.test(doc.querySelector('#agent-whatsapp').getAttribute('href')));
    check('tel link built', /^tel:\+2348024157788$/.test(doc.querySelector('#agent-phone').getAttribute('href')), doc.querySelector('#agent-phone').getAttribute('href'));
    check('mailto link built', /^mailto:david\.williams@nestora\.ng/.test(doc.querySelector('#agent-email').getAttribute('href')));
    check('similar properties: 3 cards', q(doc, '#similar-grid .card').length === 3, q(doc, '#similar-grid .card').length);
    check('map address filled', /The Haven Residence/.test(txt(doc, '#map-address')), txt(doc, '#map-address'));
    check('map landmarks filled', q(doc, '#map-landmarks span').length === 4, q(doc, '#map-landmarks span').length);
    check('viewing date min set to today or later', !!doc.querySelector('#viewing-date').min);
    check('contact agent modal exists', !!doc.querySelector('#agent-modal'));

    // gallery navigation
    const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    click(doc.querySelector('#gallery-next'));
    await new Promise((r) => setTimeout(r, 260));
    check('next moves gallery to 2 / 5', txt(doc, '#gallery-counter') === '2 / 5', txt(doc, '#gallery-counter'));
    click(doc.querySelector('#gallery-prev'));
    click(doc.querySelector('#gallery-prev'));
    await new Promise((r) => setTimeout(r, 260));
    check('prev wraps around to 5 / 5', txt(doc, '#gallery-counter') === '5 / 5', txt(doc, '#gallery-counter'));
    click(doc.querySelector('#gallery-thumbs [data-thumb="2"]'));
    await new Promise((r) => setTimeout(r, 260));
    check('thumbnail click switches image', txt(doc, '#gallery-counter') === '3 / 5', txt(doc, '#gallery-counter'));
    check('active thumbnail marked', doc.querySelector('#gallery-thumbs [data-thumb="2"]').classList.contains('is-active'));

    // favourite heart in gallery
    const heart = doc.querySelector('#detail-fav');
    check('heart is wired with the property id', heart.getAttribute('data-fav') === '1');
    click(heart);
    await new Promise((r) => setTimeout(r, 60));
    check('details heart toggles on', heart.classList.contains('is-active'));
    check('inline save button synced', doc.querySelector('#detail-fav-inline').classList.contains('is-active'));

    // viewing form validation
    const form = doc.querySelector('#request-viewing form');
    const submit = form.querySelector('[type="submit"]');
    click(submit);
    await new Promise((r) => setTimeout(r, 60));
    check('empty submit flags errors', q(doc, '#request-viewing .field.has-error').length >= 3, q(doc, '#request-viewing .field.has-error').length);
    check('error text is human readable', /required/i.test(txt(doc, '#request-viewing .field-error')));

    // invalid phone + email
    form.querySelector('#viewing-name').value = 'Ada Obi';
    form.querySelector('#viewing-email').value = 'not-an-email';
    form.querySelector('#viewing-phone').value = '12345';
    const future = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    form.querySelector('#viewing-date').value = future;
    form.querySelector('#viewing-message').value = 'Saturday morning would be ideal for me.';
    click(submit);
    await new Promise((r) => setTimeout(r, 60));
    const emailField = doc.querySelector('#viewing-email').closest('.field');
    const phoneField = doc.querySelector('#viewing-phone').closest('.field');
    check('invalid email caught', /valid email/i.test(emailField.textContent) && emailField.classList.contains('has-error'));
    check('invalid phone caught', /Nigerian number/i.test(phoneField.textContent) && phoneField.classList.contains('has-error'));

    // valid submit
    form.querySelector('#viewing-email').value = 'ada.obi@example.com';
    form.querySelector('#viewing-phone').value = '0802 415 7788';
    click(submit);
    await new Promise((r) => setTimeout(r, 1300));
    check('valid submit shows success toast', q(doc, '.toast--success').length === 1, q(doc, '.toast').length);
    check('form resets after submit', form.querySelector('#viewing-name').value === '');
    window.close();
  }

  console.log('\n=== property.html?id=999 (missing) ===');
  {
    const { window, doc, logs } = await load('property.html?id=999');
    check('no runtime errors', logs.length === 0, logs);
    check('missing-property panel visible', doc.querySelector('#property-missing').hidden === false);
    check('main content hidden', doc.querySelector('#property-root').hidden === true);
    window.close();
  }

  /* --------------------------------------------------------- FAVOURITES */
  console.log('\n=== favorites.html ===');
  {
    const { window, doc, logs } = await load('favorites.html');
    check('no runtime errors', logs.length === 0, logs);
    check('empty state visible when nothing saved', doc.querySelector('#favorites-empty').hidden === false);
    check('empty copy matches spec', /You haven't saved any properties yet\./.test(txt(doc, '#favorites-empty')));
    check('explore button present', /Explore Properties/.test(txt(doc, '#favorites-empty')));
    check('grid hidden when empty', doc.querySelector('#favorites-grid').hidden === true);
    check('clear button hidden when empty', doc.querySelector('#favorites-clear').hidden === true);

    window.NestoraFavorites.add(1);
    window.NestoraFavorites.add(6);
    await new Promise((r) => setTimeout(r, 120));
    check('saved cards render (2)', q(doc, '#favorites-grid .card').length === 2, q(doc, '#favorites-grid .card').length);
    check('empty state hidden once saved', doc.querySelector('#favorites-empty').hidden === true);
    check('summary line populated', /2 saved properties/.test(txt(doc, '#favorites-summary')), txt(doc, '#favorites-summary'));
    check('newest favourite first', /Skyline Penthouse/.test(txt(doc, '#favorites-grid .card')), txt(doc, '#favorites-grid .card .card__title'));

    const heart = doc.querySelector('#favorites-grid .fav-btn');
    heart.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 150));
    check('un-favouriting from the page removes the card', q(doc, '#favorites-grid .card').length === 1, q(doc, '#favorites-grid .card').length);

    doc.querySelector('#favorites-clear').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 150));
    check('clear all restores empty state', doc.querySelector('#favorites-empty').hidden === false);
    window.close();
  }

  /* ------------------------------------------------------------- ABOUT */
  console.log('\n=== about.html ===');
  {
    const { window, doc, logs } = await load('about.html');
    check('no runtime errors', logs.length === 0, logs);
    check('timeline has 6 milestones', q(doc, '.timeline__item').length === 6, q(doc, '.timeline__item').length);
    check('team cards = 4', q(doc, '.team-card').length === 4, q(doc, '.team-card').length);
    check('accordion items = 5', q(doc, '.accordion__item').length === 5, q(doc, '.accordion__item').length);
    check('first accordion open with height', parseInt(doc.querySelector('.accordion__item.is-open .accordion__panel').style.maxHeight || '0', 10) >= 0);
    const trigger = doc.querySelectorAll('.accordion__trigger')[1];
    trigger.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check('accordion opens on click', doc.querySelectorAll('.accordion__item')[1].classList.contains('is-open'));
    check('only one accordion open', q(doc, '.accordion__item.is-open').length === 1);
    check('invalid svg paths absent', !/he14|hhe/.test(doc.documentElement.innerHTML));
    check('team section anchor exists', !!doc.querySelector('#team'));
    window.close();
  }

  /* ----------------------------------------------------------- CONTACT */
  console.log('\n=== contact.html?subject=sell ===');
  {
    const { window, doc, logs } = await load('contact.html?subject=sell');
    check('no runtime errors', logs.length === 0, logs);
    check('subject preselects from URL', doc.querySelector('#contact-subject').value === 'sell', doc.querySelector('#contact-subject').value);
    check('opening hours table present', q(doc, '.hours-table tr').length === 4);
    check('social links present', q(doc, '.socials .social-btn').length >= 4);
    check('map placeholder present', !!doc.querySelector('.map-block'));
    check('map card copy present', /Nestora Head Office/.test(txt(doc, '.map-card')));

    const form = doc.querySelector('form[data-validate]');
    const submit = form.querySelector('[type="submit"]');
    submit.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 80));
    check('validation blocks empty submit', q(doc, '.field.has-error').length >= 4, q(doc, '.field.has-error').length);
    check('toast warns about the form', q(doc, '.toast--error').length === 1);

    form.querySelector('#contact-name').value = 'Tolu Ade';
    form.querySelector('#contact-email').value = 'tolu@example.com';
    form.querySelector('#contact-phone').value = '+234 803 662 1094';
    form.querySelector('#contact-subject').value = 'buy';
    form.querySelector('#contact-message').value = 'Please send me off-market listings in Ikoyi under ₦350M.';
    form.querySelector('input[name="consent"]').checked = true;
    submit.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 1400));
    check('success toast after valid submit', q(doc, '.toast--success').length === 1, q(doc, '.toast').length);
    check('consent box reset', form.querySelector('input[name="consent"]').checked === false);

    // newsletter in footer
    const news = doc.querySelector('form[data-newsletter]');
    news.querySelector('input').value = 'reader@example.com';
    news.querySelector('[type="submit"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 80));
    const toastTitles = Array.prototype.map.call(q(doc, '.toast'), (t) => t.textContent).join(' || ');
    check('newsletter subscribes', /You're subscribed/.test(toastTitles), toastTitles.slice(0, 120));

    // demo link
    doc.querySelector('[data-demo]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 60));
    check('demo legal links show a toast instead of navigating', /Demo link/.test(txt(doc, '.toasts')));
    window.close();
  }

  console.log('\n──────────────────────────────');
  console.log(`PASS ${pass}   FAIL ${fail}`);
  if (problems.length) console.log('Failures:\n - ' + problems.join('\n - '));
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('TEST CRASH', e); process.exit(2); });
