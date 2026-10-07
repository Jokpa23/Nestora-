# NESTORA — Premium Real Estate Website

**Find a place that feels like home.**

A complete, production-shaped real-estate website for a fictional Nigerian (Lagos) property
company. Built with **HTML5, CSS3 and vanilla JavaScript only** — no frameworks, no build step,
no CDN calls, no runtime API dependencies. Open it offline and everything still works.

---

## 1. Quick start

```bash
# any static server works — the site has zero build dependencies
cd nestora
python3 -m http.server 8080      # or: npx serve .
# then open http://localhost:8080
```

Opening `index.html` directly from the file system also works.

---

## 2. Project structure

```
nestora/
├── index.html            Home: hero + search, featured listings, services, locations, testimonials, CTA
├── properties.html       Listing experience: search, filters, sorting, pagination, empty state
├── property.html         Details page (reads ?id=): gallery, amenities, specs, map, agent, forms
├── favorites.html        Saved properties (localStorage) + empty state
├── about.html            Story, mission, values, timeline, team, FAQ accordion
├── contact.html          Contact form, office details, opening hours, map placeholder
│
├── css/
│   └── style.css         Full design system — tokens, components, animations, responsive (18 sections)
│
├── js/
│   ├── properties.js     PROPERTIES data source, agents, Naira formatting, shared card template, icons
│   ├── main.js           Header/drawer, scroll reveal, toasts, validation, modal, lightbox, accordion
│   ├── filters.js        Listing filters + sorting + pagination + URL sync (properties.html)
│   ├── favorites.js      localStorage favourites store, heart sync, favourites page renderer
│   ├── property-details.js  Details page renderer (gallery, specs, agent, similar listings)
│   └── home.js           Home page featured rail + All / For Sale / For Rent tabs
│
├── assets/
│   ├── images/
│   │   ├── hero.webp              1920×1080 hero (never lazy-loaded)
│   │   ├── properties/            8 listings × 5 gallery images (3:2 WebP, lazy-loaded)
│   │   ├── agents/                Consultant portraits
│   │   └── pages/                 about / team / services / CTA imagery
│   └── icons/
│       ├── favicon.svg            House mark, used as favicon + app icon
│       ├── logo.svg               Standalone lockup for decks and print
│       └── site.webmanifest
│
└── tests/                 Optional QA harnesses (see §7)
```

---

## 3. Adding or editing a property

Everything renders from **one array** in `js/properties.js`. Add an object and the card, listing
filters, detail page, favourites and "similar properties" update automatically.

```js
{
  id: 9,                                  // unique, also used as ?id= on property.html
  slug: "my-new-listing",
  name: "Admiralty Court",
  location: "Lekki Phase 1, Lagos",       // shown on cards
  area: "Lekki",                          // powers the location filter
  city: "Lagos",
  price: 210000000,                       // Naira, annual figure for rentals
  status: "Sale",                         // "Sale" | "Rent"
  type: "Apartment",                      // Apartment | House | Villa | Duplex | Penthouse | Commercial
  propertyType: "Serviced Apartment",     // longer label for the spec table
  bedrooms: 3, bathrooms: 4, size: 295,
  parking: "2 Cars", yearBuilt: 2025,
  furnishing: "Semi-Furnished", title: "Certificate of Occupancy",
  featured: true,                         // appears in the home page rail
  views: 1200, addedDaysAgo: 3,           // drive "Most Popular" / "Newest" sorting
  agentId: 1,                             // matches an entry in AGENTS
  amenities: ["Swimming Pool", "Fitted Kitchen", "…"],
  description: ["Paragraph one…", "Paragraph two…"],
  images: [
    "assets/images/properties/property-09.webp",   // first image is the card cover
    "assets/images/properties/property-09-2.webp"
  ]
}
```

Consultants live in the `AGENTS` array just above it (name, role, photo, phone, WhatsApp, email).

---

## 4. Replacing the photography

All imagery is **local WebP**, sized and compressed for the web (≈4.5 MB for the whole site;
the hero is ~215 KB and everything below the fold is lazy-loaded).

| Swap this file | Use an image of | Notes |
| --- | --- | --- |
| `assets/images/hero.webp` | full-bleed exterior, 1920×1080+ | not lazy-loaded, keep it under ~250 KB |
| `assets/images/properties/property-01.webp` | 3:2 landscape cover shot | card cover for listing 1 |
| `assets/images/properties/property-01-2.webp` … `-5.webp` | 3:2 gallery shots | interiors, pool, garden… |
| `assets/images/agents/agent-01.webp` | portrait, 4:5 | David Williams (also used on the details page) |
| `assets/images/pages/about.webp` | office / team, 4:3 | About hero media |
| `assets/images/pages/cta.webp` | wide exterior, 16:7 | home + about call-to-action band |

Keep the same file names and nothing else needs to change. `_raw/build-assets.py` in the
workspace shows the exact crop → resize → WebP pipeline used to produce these files.

---

## 5. How the JavaScript is wired

| Concern | File | Notes |
| --- | --- | --- |
| Data + formatting + card template | `properties.js` | `window.NestoraData` |
| Favourites (localStorage) | `favorites.js` | `window.NestoraFavorites`, emits `nestora:favorites-changed` |
| Filters, sorting, pagination, URL sync | `filters.js` | state object ⇄ query string via `history.replaceState` |
| Details page | `property-details.js` | reads `?id=`, renders gallery/specs/agent/similar |
| Global UI | `main.js` | `window.NestoraToast`, `window.NestoraUI` |

Cross-module contract: dynamically injected markup is announced with
`nestora:content-rendered` so the scroll-reveal observer re-scans it, and favourites are
synced through `nestora:favorites-changed`. Any card rendered anywhere in the site is click-
compatible with the delegated handlers in `main.js` — no re-binding required.

**Filter query parameters** (bookmarkable, shareable):
`properties.html?q=Lekki&type=Apartment&status=Sale&min=100000000&max=250000000&beds=3&baths=3&size=300&sort=price-asc`

---

## 6. Accessibility & UX details

- Skip-to-content link, visible focus rings, `aria-*` state on menu/modal/accordion/filters
- Keyboard support: arrow keys move the gallery, <kbd>Esc</kbd> closes drawer/modal/lightbox
- Form validation is inline, human-readable and announced via `aria-live`
- `prefers-reduced-motion` disables zoom reveals, counters and smooth scrolling
- Toasts use a polite live region; icons are `aria-hidden` with text labels alongside
- Responsive from 320 px to 1920 px (verified — see §7), CSS Grid + Flexbox throughout

---

## 7. Testing in this repo

The two harnesses in `tests/` are optional and need dev dependencies:

```bash
npm i -D jsdom puppeteer
python3 -m http.server 8080        # serve the site
BASE_URL=http://localhost:8080 node tests/smoke.test.js        # 118 assertions, DOM + localStorage
BASE_URL=http://localhost:8080 node tests/responsive-audit.js  # overflow check at 8 breakpoints
BASE_URL=http://localhost:8080 node tests/screenshots.js       # screenshots to tests/screenshots/
```

`smoke.test.js` covers navigation, the featured rail and tabs, every filter and sort mode
(including combined filters and the empty state), pagination, favourites persistence, the
gallery (thumbs, next/prev, wrap-around), form validation on all three forms, the mobile
drawer, the accordion, the missing-property state and the toast system.

Last run in this workspace: **118 assertions passed, 0 console errors across 12 page/viewport
combinations, 0 overflow issues at 320/390/768/834/1024/1280/1440/1920 px.**

---

## 8. Fonts & offline behaviour

There are **no network requests at runtime** — no Google Fonts, no icon CDN, no map API.
Iconography is inline SVG; the map is a styled CSS/SVG placeholder; social links point to
`instagram.com` / `linkedin.com` / `facebook.com` / `wa.me` only when a visitor deliberately
clicks them.

The type stack asks for Manrope → Inter → DM Sans and falls back to the system UI font, so it
looks correct offline either way. To self-host Manrope, drop the `.woff2` files into
`assets/fonts/` and uncomment the `@font-face` block documented at the top of `css/style.css`.

---

## 9. Swapping the map placeholder for a real map

Both `property.html` and `contact.html` use a dependency-free `.map-block` (grid + SVG roads +
marker). To go live, replace the block's inner content with your provider's embed and keep the
`.map-card` overlay, or inject a `<div class="map-block__canvas" id="map">` and initialise the
provider's JavaScript against it.

---

## 10. Credits

Photography in `assets/images/` is AI-generated/stock demonstration imagery prepared for this
build, and can be replaced wholesale for a real client deployment. All company details
(address, phone numbers, RC number, testimonials, team members) are fictional and intended for
demonstration purposes only.
