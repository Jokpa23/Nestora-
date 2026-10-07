"""NESTORA asset pipeline — source images → optimised WebP.

HOW THIS WAS USED IN THIS WORKSPACE
-----------------------------------
1. Original photography (AI-generated + stock) sat in /_raw and /image-search.
2. This script cropped each source to its target aspect ratio, resized with
   Lanczos resampling, lightly re-sharpened and saved as WebP at the quality
   needed for each slot (hero ~72, cards ~76-80, interiors ~78-84).
3. Output: /nestora/assets/images/** — 49 files, ≈4.5 MB total, hero ≈215 KB.

Re-run it after dropping your own sources in `SOURCE_DIR` / `SEARCH_DIR`:

    pip install Pillow
    python3 tools/build-assets.py

Every job below names the exact destination file referenced by the site, so the
generated file names always line up with js/properties.js and the HTML.

GENERATION PROMPTS (for reproducing the source set with an image model)
----------------------------------------------------------------------
hero.webp            Cinematic golden-hour exterior of a contemporary Lagos residence with an
                     infinity pool, palm trees and warm interior lighting. 16:9.
property-01.webp     Modern 4-bedroom detached duplex in Lekki, off-white render with charcoal
                     accents, double-height entrance, interlocking paved driveway.
property-02.webp     Luxury Ikoyi apartment tower, glass balconies, low-angle daylight.
property-03.webp     Cubic white villa in Ajah ringed by coconut palms, private pool, timber deck.
property-04.webp     Victoria Island high-rise at blue hour, curved glass balconies, lit lobby.
property-05.webp     Semi-detached duplex in Ikeja, beige stucco, black gate, paved compound.
property-06.webp     Lekki rooftop terrace at sunset with plunge pool and city skyline.
property-07.webp     Modern terraced townhouses on a quiet serviced estate street.
property-08.webp     Eleve-storey glass and stone office building on Victoria Island.
*-(2..5).webp        Matching interiors: living room, kitchen, bedroom, pool/garden, terrace.
agents/*.webp        Professional corporate headshots on a warm ivory backdrop. 4:5.
pages/about.webp     Bright Lagos estate-agency office interior with plans and models.
pages/team.webp      Consultants around a meeting table (team page imagery).
pages/services.webp  Office interior used beside the services list.
pages/cta.webp       Wide exterior used as the call-to-action band background (16:7).
"""

"""Build optimised WebP assets for the NESTORA website from source images."""
from PIL import Image, ImageEnhance
import os

RAW = '/home/user/_raw'
SRCH = '/home/user/image-search'
OUT = '/home/user/nestora/assets/images'

def build(src, dest, size, box=None, quality=80, sharpen=True):
    """Crop to the target aspect ratio, resize and save as WebP."""
    im = Image.open(src).convert('RGB')
    tw, th = size
    target_ar = tw / th
    w, h = im.size
    ar = w / h
    if box:                                  # manual crop box (l,t,r,b) in fractions
        l, t, r, b = box
        im = im.crop((int(l*w), int(t*h), int(r*w), int(b*h)))
    elif ar > target_ar:                     # too wide -> crop sides
        nw = int(h * target_ar)
        im = im.crop(((w-nw)//2, 0, (w-nw)//2+nw, h))
    elif ar < target_ar:                     # too tall -> crop top/bottom (bias upward)
        nh = int(w / target_ar)
        top = max(0, min(int((h-nh)*0.32), h-nh))
        im = im.crop((0, top, w, top+nh))
    im = im.resize(size, Image.LANCZOS)
    if sharpen:
        im = ImageEnhance.Sharpness(im).enhance(1.06)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    im.save(dest, 'WEBP', quality=quality, method=6)
    return os.path.getsize(dest)

CARD = (1280, 854)      # 3:2 property cards / gallery images
GAL  = (1280, 853)
jobs = [
    # --- hero (16:9, above the fold, no lazy loading) ---
    (f'{RAW}/hero.jpg',                 f'{OUT}/hero.webp',            (1920, 1080), None, 78),
    # --- property 01 : The Haven Residence (Lekki) ---
    (f'{RAW}/property-01.jpg',          f'{OUT}/properties/property-01.webp',   CARD, None, 80),
    (f'{RAW}/interior-living.jpg',      f'{OUT}/properties/property-01-2.webp', GAL, None, 78),
    (f'{RAW}/interior-kitchen.jpg',     f'{OUT}/properties/property-01-3.webp', GAL, None, 78),
    (f'{RAW}/interior-bedroom.jpg',     f'{OUT}/properties/property-01-4.webp', GAL, None, 78),
    (f'{SRCH}/modern-luxury-villa-swimming-pool-exteri-1.jpg', f'{OUT}/properties/property-01-5.webp', GAL, None, 82),
    # --- property 02 : Azure Heights (Ikoyi) ---
    (f'{RAW}/property-02.jpg',          f'{OUT}/properties/property-02.webp',   CARD, None, 80),
    (f'{SRCH}/luxury-penthouse-interior-floor-to-ceili-2.jpg', f'{OUT}/properties/property-02-2.webp', GAL, None, 80),
    (f'{SRCH}/luxury-living-room-interior-modern-desig-4.jpg', f'{OUT}/properties/property-02-3.webp', GAL, None, 84),
    (f'{SRCH}/modern-kitchen-interior-luxury-marble-is-1.webp',f'{OUT}/properties/property-02-4.webp', GAL, None, 82),
    (f'{SRCH}/modern-bedroom-interior-design-neutral-t-1.jpg', f'{OUT}/properties/property-02-5.webp', GAL, None, 84),
    # --- property 03 : Palm Grove Villa (Ajah) ---
    (f'{RAW}/property-03.jpg',          f'{OUT}/properties/property-03.webp',   CARD, None, 80),
    (f'{SRCH}/modern-luxury-villa-swimming-pool-exteri-4.jpg', f'{OUT}/properties/property-03-2.webp', GAL, None, 82),
    (f'{SRCH}/luxury-modern-mansion-exterior-architect-3.jpg', f'{OUT}/properties/property-03-3.webp', GAL, None, 84),
    (f'{SRCH}/luxury-living-room-interior-modern-desig-5.jpg', f'{OUT}/properties/property-03-4.webp', GAL, None, 82),
    (f'{SRCH}/modern-bedroom-interior-design-neutral-t-5.jpg', f'{OUT}/properties/property-03-5.webp', GAL, None, 84),
    # --- property 04 : The Meridian (Victoria Island) ---
    (f'{RAW}/property-04.jpg',          f'{OUT}/properties/property-04.webp',   CARD, None, 80),
    (f'{SRCH}/luxury-penthouse-interior-floor-to-ceili-1.webp',f'{OUT}/properties/property-04-2.webp', GAL, None, 82),
    (f'{SRCH}/luxury-living-room-interior-modern-desig-3.jpg', f'{OUT}/properties/property-04-3.webp', GAL, (0.0, 0.10, 1.0, 0.80), 82),
    (f'{SRCH}/modern-kitchen-interior-luxury-marble-is-3.jpg', f'{OUT}/properties/property-04-4.webp', GAL, None, 82),
    (f'{SRCH}/modern-bedroom-interior-design-neutral-t-3.jpg', f'{OUT}/properties/property-04-5.webp', GAL, None, 84),
    # --- property 05 : Oakwood Residence (Ikeja) ---
    (f'{RAW}/property-05.jpg',          f'{OUT}/properties/property-05.webp',   CARD, None, 80),
    (f'{SRCH}/contemporary-duplex-house-exterior-archi-4.jpg', f'{OUT}/properties/property-05-2.webp', GAL, None, 84),
    (f'{SRCH}/luxury-living-room-interior-modern-desig-1.jpg', f'{OUT}/properties/property-05-3.webp', GAL, None, 86),
    (f'{SRCH}/modern-kitchen-interior-luxury-marble-is-2.webp',f'{OUT}/properties/property-05-4.webp', GAL, None, 82),
    (f'{SRCH}/modern-bedroom-interior-design-neutral-t-2.jpg', f'{OUT}/properties/property-05-5.webp', GAL, None, 84),
    # --- property 06 : Skyline Penthouse (Lekki Phase 1) ---
    (f'{RAW}/property-06.jpg',          f'{OUT}/properties/property-06.webp',   CARD, None, 80),
    (f'{SRCH}/luxury-penthouse-interior-floor-to-ceili-3.jpg', f'{OUT}/properties/property-06-2.webp', GAL, None, 82),
    (f'{SRCH}/luxury-living-room-interior-modern-desig-2.jpg', f'{OUT}/properties/property-06-3.webp', GAL, None, 86),
    (f'{SRCH}/modern-kitchen-interior-luxury-marble-is-5.jpg', f'{OUT}/properties/property-06-4.webp', GAL, None, 84),
    (f'{SRCH}/modern-bedroom-interior-design-neutral-t-4.jpg', f'{OUT}/properties/property-06-5.webp', GAL, None, 84),
    # --- property 07 : The Lekki Terraces (rent) ---
    (f'{SRCH}/contemporary-duplex-house-exterior-archi-5.jpg', f'{OUT}/properties/property-07.webp',   CARD, None, 84),
    (f'{SRCH}/luxury-modern-mansion-exterior-architect-4.jpg', f'{OUT}/properties/property-07-2.webp', GAL, None, 84),
    (f'{SRCH}/luxury-modern-mansion-exterior-architect-5.jpg', f'{OUT}/properties/property-07-3.webp', GAL, None, 84),
    (f'{SRCH}/modern-luxury-villa-swimming-pool-exteri-5.webp',f'{OUT}/properties/property-07-4.webp', GAL, None, 82),
    (f'{SRCH}/modern-bedroom-interior-design-neutral-t-1.jpg', f'{OUT}/properties/property-07-5.webp', GAL, None, 84),
    # --- property 08 : Marina Business Suites (commercial, rent) ---
    (f'{SRCH}/modern-apartment-building-facade-residen-4.jpg', f'{OUT}/properties/property-08.webp',   CARD, None, 84),
    (f'{SRCH}/modern-apartment-building-facade-residen-3.jpg', f'{OUT}/properties/property-08-2.webp', GAL, None, 84),
    (f'{RAW}/interior-living.jpg',      f'{OUT}/properties/property-08-3.webp', GAL, None, 78),
    (f'{SRCH}/modern-kitchen-interior-luxury-marble-is-4.png', f'{OUT}/properties/property-08-4.webp', GAL, None, 82),
    (f'{SRCH}/modern-apartment-building-facade-residen-5.jpg', f'{OUT}/properties/property-08-5.webp', GAL, None, 84),
    # --- agents / team ---
    (f'{SRCH}/professional-business-portrait-headshot--4.jpg', f'{OUT}/agents/agent-01.webp', (720, 900), None, 86),
    (f'{SRCH}/professional-business-portrait-headshot--3.jpg', f'{OUT}/agents/agent-02.webp', (720, 900), None, 86),
    (f'{SRCH}/professional-business-portrait-headshot--1.jpg', f'{OUT}/agents/agent-03.webp', (720, 900), None, 86),
    (f'{SRCH}/professional-business-portrait-headshot--5.jpg', f'{OUT}/agents/agent-04.webp', (720, 900), None, 86),
    # --- pages ---
    (f'{SRCH}/real-estate-agents-team-meeting-modern-o-3.jpg', f'{OUT}/pages/about.webp',      (1400, 1050), None, 84),
    (f'{SRCH}/real-estate-agents-team-meeting-modern-o-5.jpg', f'{OUT}/pages/team.webp',       (1400, 933),  None, 84),
    (f'{RAW}/interior-living.jpg',      f'{OUT}/pages/services.webp',   (1400, 933), None, 78),
    (f'{RAW}/property-03.jpg',          f'{OUT}/pages/cta.webp',        (1600, 700), None, 78),
]

total = 0
for src, dest, size, box, q in jobs:
    if not os.path.exists(src):
        print('!! MISSING', src); continue
    kb = build(src, dest, size, box, q) / 1024
    total += kb
    print(f'{dest.replace("/home/user/nestora/",""):46s} {size[0]}x{size[1]}  {kb:6.1f} KB')
print(f'\nTOTAL: {total/1024:.2f} MB across {len(jobs)} files')
