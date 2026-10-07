/* ==========================================================================
   NESTORA — js/properties.js
   --------------------------------------------------------------------------
   Single source of truth for the website's listings.

   Every card, grid, filter and detail page is generated from the PROPERTIES
   array below, so adding a new listing is as simple as pushing one more object
   to this array (see the field reference at the top of the array).

   IMAGES
   All photography lives in assets/images/ as optimised WebP files. Replace the
   files using the same names (or point `images` at new files) to re-skin the
   demo with real client photography.
   ========================================================================== */

(function (window) {
  "use strict";

  /* ======================================================================
     Inline SVG icon set
     Kept in JS so that generated markup (cards, filter chips, toasts) can
     reuse exactly the same iconography as the static HTML.
     ====================================================================== */
  var ICONS = {
    bed: '<path d="M3 18v-6a2 2 0 0 1 2-2h11a3 3 0 0 1 3 3v5"/><path d="M3 18h18"/><path d="M3 12V8"/><path d="M7 10h4"/>',
    bath: '<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M7 19l-1 2M18 19l1 2"/>',
    area: '<path d="M4 9V4h5"/><path d="M20 15v5h-5"/><path d="M4 4l7 7"/><path d="M20 20l-7-7"/>',
    pin: '<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    heart: '<path d="M12 20s-7-4.4-7-9.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 7 3.6c0 5-7 9.4-7 9.4z"/>',
    arrowRight: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    arrowUpRight: '<path d="M7 17L17 7"/><path d="M8 7h9v9"/>',
    chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
    chevronRight: '<path d="M9 6l6 6-6 6"/>',
    chevronUp: '<path d="M6 15l6-6 6 6"/>',
    car: '<path d="M5 16v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1"/><path d="M16 16v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1"/><path d="M4 16h16v-3.2L18.4 8.4A2 2 0 0 0 16.5 7h-9a2 2 0 0 0-1.9 1.4L4 12.8z"/><path d="M7 13h.01M17 13h.01"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
    phone: '<path d="M6.6 3.5h2.2l1.4 3.4-1.6 1.4a11 11 0 0 0 5.1 5.1l1.4-1.6 3.4 1.4v2.2a2 2 0 0 1-2.2 2A15.4 15.4 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M4 7.5l8 5.5 8-5.5"/>',
    whatsapp: '<path d="M20 11.7a8 8 0 0 1-11.9 7L4 20l1.4-4A8 8 0 1 1 20 11.7z"/><path d="M9.2 9c.3 2.4 2.2 4.3 4.6 4.6l1-1.3 1.7.9v1.3c-2.9.5-6-2.4-6.6-5.4l1.3-.1z"/>',
    shield: '<path d="M12 3l7 3v5.4c0 4.3-2.9 7.4-7 9.6-4.1-2.2-7-5.3-7-9.6V6z"/><path d="M9 12l2 2 4-4"/>',
    key: '<circle cx="8" cy="15" r="3.2"/><path d="M10.3 12.7L19 4M16 5.6l2.4 2.4M14 7.6l1.8 1.8"/>',
    chart: '<path d="M4 20h16"/><path d="M7 20v-6M12 20V6M17 20v-9"/>',
    building: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h6"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.4a3.2 3.2 0 0 1 0 6.2"/><path d="M17.5 19a5.5 5.5 0 0 0-2.2-4.4"/>',
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2l-1.6 4.2-4.2 1.6 1.6-4.2z"/>',
    sparkle: '<path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    sliders: '<path d="M4 8h10M18 8h2M4 16h4M12 16h8"/><circle cx="16" cy="8" r="2"/><circle cx="10" cy="16" r="2"/>',
    star: '<path d="M12 4.5l2.3 4.9 5.2.7-3.8 3.7.9 5.3-4.6-2.5-4.6 2.5.9-5.3L4.5 10l5.2-.7z"/>',
    layers: '<path d="M12 4l8 4.2-8 4.2-8-4.2z"/><path d="M4 13.5l8 4.2 8-4.2"/>',
    file: '<path d="M14 4H7.5A2.5 2.5 0 0 0 5 6.5v11A2.5 2.5 0 0 0 7.5 20h9A2.5 2.5 0 0 0 19 17.5V9z"/><path d="M14 4v5h5"/>',
    wifi: '<path d="M4.5 9.5a11 11 0 0 1 15 0"/><path d="M7.5 13a7 7 0 0 1 9 0"/><circle cx="12" cy="17" r="1.2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>'
  };

  /** Build an inline SVG string for a named icon. */
  function icon(name, className) {
    var path = ICONS[name] || ICONS.info;
    return (
      '<svg class="icon ' + (className || "") + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" ' +
      'stroke-width="1.6" aria-hidden="true" focusable="false">' + path + "</svg>"
    );
  }

  /* ======================================================================
     Formatting helpers
     ====================================================================== */

  /** ₦185,000,000 */
  function formatNaira(value) {
    return "₦" + Number(value).toLocaleString("en-NG", { maximumFractionDigits: 0 });
  }

  /** ₦450M / ₦18.5M a year — used in chips and compact UI */
  function formatNairaShort(value) {
    if (value >= 1000000000) return "₦" + (value / 1000000000).toFixed(value % 1000000000 ? 1 : 0) + "B";
    if (value >= 1000000) return "₦" + (value / 1000000).toFixed(value % 1000000 ? 1 : 0) + "M";
    if (value >= 1000) return "₦" + Math.round(value / 1000) + "K";
    return formatNaira(value);
  }

  /** Price label that accounts for rental periods. */
  function priceLabel(property) {
    return property.status === "Rent"
      ? formatNaira(property.price) + " / year"
      : formatNaira(property.price);
  }

  function plural(value, single, many) {
    return value + " " + (value === 1 ? single : many || single + "s");
  }

  /* ======================================================================
     Agents
     ====================================================================== */
  var AGENTS = [
    {
      id: 1,
      name: "David Williams",
      role: "Senior Property Consultant",
      photo: "assets/images/agents/agent-01.webp",
      phone: "+234 802 415 7788",
      whatsapp: "2348024157788",
      email: "david.williams@nestora.ng",
      listings: 42,
      rating: 4.9,
      focus: "Lekki · Ikoyi · Victoria Island"
    },
    {
      id: 2,
      name: "Amaka Okafor",
      role: "Luxury Homes Advisor",
      photo: "assets/images/agents/agent-02.webp",
      phone: "+234 803 662 1094",
      whatsapp: "2348036621094",
      email: "amaka.okafor@nestora.ng",
      listings: 36,
      rating: 4.8,
      focus: "Ikoyi · Banana Island"
    },
    {
      id: 3,
      name: "Tunde Bello",
      role: "Investment & Land Specialist",
      photo: "assets/images/agents/agent-03.webp",
      phone: "+234 805 219 4471",
      whatsapp: "2348052194471",
      email: "tunde.bello@nestora.ng",
      listings: 28,
      rating: 4.9,
      focus: "Epe · Ibeju-Lekki · Ajah"
    },
    {
      id: 4,
      name: "Grace Adeyemi",
      role: "Lettings Manager",
      photo: "assets/images/agents/agent-04.webp",
      phone: "+234 807 334 8820",
      whatsapp: "2348073348820",
      email: "grace.adeyemi@nestora.ng",
      listings: 31,
      rating: 4.7,
      focus: "Yaba · Ikeja · Gbagada"
    }
  ];

  /* ======================================================================
     PROPERTIES
     ----------------------------------------------------------------------
     Field reference
       id, slug        unique identifiers
       name            listing headline
       location        "Lekki, Lagos"            (shown on cards)
       area, city      used by the location filter
       price           number in Naira (annual for rentals)
       status          "Sale" | "Rent"
       type            Apartment | House | Villa | Duplex | Penthouse | Commercial
       propertyType    longer label for the spec table
       bedrooms, bathrooms, size, parking
       yearBuilt, furnishing, title
       featured        shows in "Featured Properties" on the home page
       views, addedDaysAgo   power the "Most Popular" / "Newest" sorting
       amenities       feature list
       description     array of paragraphs
       images          local WebP gallery (first image is the cover)
     ====================================================================== */
  var PROPERTIES = [
    {
      id: 1,
      slug: "the-haven-residence",
      name: "The Haven Residence",
      location: "Lekki, Lagos",
      area: "Lekki",
      city: "Lagos",
      price: 185000000,
      status: "Sale",
      type: "House",
      propertyType: "Detached Duplex",
      bedrooms: 4,
      bathrooms: 5,
      size: 420,
      parking: "4 Cars",
      yearBuilt: 2025,
      furnishing: "Semi-Furnished",
      title: "Governor's Consent",
      featured: true,
      views: 1840,
      addedDaysAgo: 4,
      agentId: 1,
      amenities: [
        "Swimming Pool", "BQ (Boys' Quarters)", "Fully Fitted Kitchen", "Smart Home System",
        "24/7 Security", "Ample Parking", "Landscaped Garden", "Standby Generator",
        "CCTV Surveillance", "Air Conditioning"
      ],
      description: [
        "Designed for modern family living, The Haven Residence combines generous interiors, contemporary architecture and thoughtfully designed outdoor spaces. Set behind a private gate within a serviced estate off Admiralty Way, the home opens into a double-height entrance hall that leads to formal and family living areas finished in warm oak, natural stone and full-height glazing.",
        "The first floor holds four en-suite bedrooms, including a principal suite with a walk-in wardrobe, private balcony and a spa-style bathroom. Outside, a decked terrace steps down to a heated swimming pool framed by mature palms — an easy setting for weekend entertaining. The property is delivered semi-furnished with a fitted kitchen, integrated smart-home controls and a two-bedroom boys' quarters."
      ],
      images: [
        "assets/images/properties/property-01.webp",
        "assets/images/properties/property-01-2.webp",
        "assets/images/properties/property-01-3.webp",
        "assets/images/properties/property-01-4.webp",
        "assets/images/properties/property-01-5.webp"
      ]
    },
    {
      id: 2,
      slug: "azure-heights",
      name: "Azure Heights",
      location: "Ikoyi, Lagos",
      area: "Ikoyi",
      city: "Lagos",
      price: 320000000,
      status: "Sale",
      type: "Apartment",
      propertyType: "Luxury Apartment",
      bedrooms: 3,
      bathrooms: 4,
      size: 310,
      parking: "2 Cars",
      yearBuilt: 2024,
      furnishing: "Fully Furnished",
      title: "Certificate of Occupancy",
      featured: true,
      views: 2260,
      addedDaysAgo: 11,
      agentId: 2,
      amenities: [
        "Rooftop Terrace", "Infinity Pool", "Gym & Wellness Suite", "Concierge Service",
        "Fitted Kitchen", "Smart Access Control", "Standby Generator", "CCTV Surveillance",
        "High-Speed Lift", "Air Conditioning"
      ],
      description: [
        "Azure Heights occupies the eighth floor of one of Ikoyi's most considered residential towers, a short drive from Kingsway Road and Awolowo Road. The apartment is arranged around a wide living pavilion that opens onto a covered balcony with uninterrupted views across the Lagos skyline towards the lagoon.",
        "Interiors are delivered fully furnished in a restrained palette of ivory, walnut and brushed brass, with a designer kitchen, three en-suite bedrooms and a study that converts easily into a fourth bedroom. Residents share a rooftop pool, gym, residents' lounge and 24-hour concierge, supported by full power redundancy."
      ],
      images: [
        "assets/images/properties/property-02.webp",
        "assets/images/properties/property-02-2.webp",
        "assets/images/properties/property-02-3.webp",
        "assets/images/properties/property-02-4.webp",
        "assets/images/properties/property-02-5.webp"
      ]
    },
    {
      id: 3,
      slug: "palm-grove-villa",
      name: "Palm Grove Villa",
      location: "Ajah, Lagos",
      area: "Ajah",
      city: "Lagos",
      price: 145000000,
      status: "Sale",
      type: "Villa",
      propertyType: "Contemporary Villa",
      bedrooms: 4,
      bathrooms: 4,
      size: 380,
      parking: "3 Cars",
      yearBuilt: 2023,
      furnishing: "Semi-Furnished",
      title: "Governor's Consent",
      featured: true,
      views: 1425,
      addedDaysAgo: 21,
      agentId: 3,
      amenities: [
        "Private Pool", "BQ (Boys' Quarters)", "Fitted Kitchen", "Solar Inverter System",
        "Gated Estate", "Landscaped Garden", "Borehole & Treatment Plant", "CCTV Surveillance",
        "Study Room", "Air Conditioning"
      ],
      description: [
        "Palm Grove Villa is an easy-going family home in a gated Ajah estate, arranged over two levels around a central courtyard garden. Broad sliding doors dissolve the boundary between the living room, dining area and a covered terrace that overlooks the pool.",
        "Four bedrooms sit on the upper level, each with fitted wardrobes and natural cross-ventilation. A solar inverter system, borehole with treatment plant and full perimeter CCTV make the home comfortable and secure year-round, while the estate's wide streets and green verges suit young families."
      ],
      images: [
        "assets/images/properties/property-03.webp",
        "assets/images/properties/property-03-2.webp",
        "assets/images/properties/property-03-3.webp",
        "assets/images/properties/property-03-4.webp",
        "assets/images/properties/property-03-5.webp"
      ]
    },
    {
      id: 4,
      slug: "the-meridian",
      name: "The Meridian",
      location: "Victoria Island, Lagos",
      area: "Victoria Island",
      city: "Lagos",
      price: 275000000,
      status: "Sale",
      type: "Apartment",
      propertyType: "Serviced Apartment",
      bedrooms: 3,
      bathrooms: 3,
      size: 280,
      parking: "2 Cars",
      yearBuilt: 2025,
      furnishing: "Fully Furnished",
      title: "Certificate of Occupancy",
      featured: true,
      views: 1980,
      addedDaysAgo: 2,
      agentId: 1,
      amenities: [
        "Serviced Building", "Gym & Sauna", "Rooftop Lounge", "Backup Power 24/7",
        "Fitted Kitchen", "Concierge & Housekeeping", "Smart Access Control", "CCTV Surveillance",
        "Meeting Room", "Air Conditioning"
      ],
      description: [
        "The Meridian is a serviced three-bedroom residence on Victoria Island, positioned for professionals who want the business district on their doorstep. The apartment is finished to a hotel standard, with floor-to-ceiling glazing framing views over the marina and the city beyond.",
        "Services include housekeeping, concierge, and dedicated parking for two cars. Building amenities span a gym, sauna, rooftop lounge and a residents' meeting room — all maintained by a full-time facility management team with 24-hour backup power."
      ],
      images: [
        "assets/images/properties/property-04.webp",
        "assets/images/properties/property-04-2.webp",
        "assets/images/properties/property-04-3.webp",
        "assets/images/properties/property-04-4.webp",
        "assets/images/properties/property-04-5.webp"
      ]
    },
    {
      id: 5,
      slug: "oakwood-residence",
      name: "Oakwood Residence",
      location: "Ikeja, Lagos",
      area: "Ikeja",
      city: "Lagos",
      price: 110000000,
      status: "Sale",
      type: "Duplex",
      propertyType: "Semi-Detached Duplex",
      bedrooms: 4,
      bathrooms: 4,
      size: 350,
      parking: "3 Cars",
      yearBuilt: 2022,
      furnishing: "Unfurnished",
      title: "Governor's Consent",
      featured: true,
      views: 1180,
      addedDaysAgo: 34,
      agentId: 4,
      amenities: [
        "Family Lounge", "BQ (Boys' Quarters)", "Fitted Kitchen", "Borehole Water Supply",
        "Standby Generator", "Gated Compound", "Paved Driveway", "CCTV Surveillance",
        "Store Room", "Air Conditioning"
      ],
      description: [
        "Oakwood Residence is a well-proportioned semi-detached duplex on a quiet, tree-lined street minutes from Ikeja GRA. The ground floor offers a formal sitting room, a family lounge, guest powder room and a generous kitchen with a separate pantry and service access to the boys' quarters.",
        "Upstairs, four bedrooms include a principal suite with a dressing area. The compound is fully paved with space for three cars, a gated entrance and independent borehole supply — a practical, move-in ready home for a growing family or a strong rental investment."
      ],
      images: [
        "assets/images/properties/property-05.webp",
        "assets/images/properties/property-05-2.webp",
        "assets/images/properties/property-05-3.webp",
        "assets/images/properties/property-05-4.webp",
        "assets/images/properties/property-05-5.webp"
      ]
    },
    {
      id: 6,
      slug: "skyline-penthouse",
      name: "Skyline Penthouse",
      location: "Lekki Phase 1, Lagos",
      area: "Lekki",
      city: "Lagos",
      price: 450000000,
      status: "Sale",
      type: "Penthouse",
      propertyType: "Duplex Penthouse",
      bedrooms: 5,
      bathrooms: 6,
      size: 620,
      parking: "4 Cars",
      yearBuilt: 2025,
      furnishing: "Fully Furnished",
      title: "Certificate of Occupancy",
      featured: true,
      views: 3120,
      addedDaysAgo: 7,
      agentId: 2,
      amenities: [
        "Private Rooftop Pool", "Panoramic City Views", "Private Lift Access", "Home Cinema",
        "Fitted Kitchen", "Wine Cellar", "Smart Home System", "CCTV Surveillance",
        "2 BQ Rooms", "Air Conditioning"
      ],
      description: [
        "Occupying the top two floors of a landmark Lekki Phase 1 tower, Skyline Penthouse is the most complete residence on our books. Private lift access opens directly into a double-height gallery living space, wrapped in glass with sweeping views across the lagoon to the Lagos skyline.",
        "The upper level hosts a private rooftop terrace with a plunge pool, outdoor kitchen and covered lounge — engineered for entertaining at scale. Five en-suite bedrooms, a home cinema, wine cellar and staff accommodation complete a genuinely rare offering."
      ],
      images: [
        "assets/images/properties/property-06.webp",
        "assets/images/properties/property-06-2.webp",
        "assets/images/properties/property-06-3.webp",
        "assets/images/properties/property-06-4.webp",
        "assets/images/properties/property-06-5.webp"
      ]
    },
    {
      id: 7,
      slug: "the-lekki-terraces",
      name: "The Lekki Terraces",
      location: "Lekki Phase 1, Lagos",
      area: "Lekki",
      city: "Lagos",
      price: 18500000,
      status: "Rent",
      type: "Duplex",
      propertyType: "Terraced Duplex",
      bedrooms: 3,
      bathrooms: 4,
      size: 260,
      parking: "2 Cars",
      yearBuilt: 2024,
      furnishing: "Semi-Furnished",
      title: "Rental Agreement",
      featured: false,
      views: 940,
      addedDaysAgo: 15,
      agentId: 4,
      amenities: [
        "Serviced Estate", "Fitted Kitchen", "Backup Power", "Water Treatment",
        "Gated & Manned", "Playground", "Paved Driveway", "CCTV Surveillance",
        "Guest Toilet", "Air Conditioning"
      ],
      description: [
        "A freshly completed three-bedroom terraced duplex available for rent in a serviced Lekki Phase 1 estate, offered semi-furnished with a fully fitted kitchen and built-in wardrobes throughout.",
        "Residents enjoy estate-wide security, treated water, steady backup power and a children's playground, with the Admiralty Way retail strip and key schools a short drive away. Rent is payable annually with standard agency and legal fees applying."
      ],
      images: [
        "assets/images/properties/property-07.webp",
        "assets/images/properties/property-07-2.webp",
        "assets/images/properties/property-07-3.webp",
        "assets/images/properties/property-07-4.webp",
        "assets/images/properties/property-07-5.webp"
      ]
    },
    {
      id: 8,
      slug: "marina-business-suites",
      name: "Marina Business Suites",
      location: "Victoria Island, Lagos",
      area: "Victoria Island",
      city: "Lagos",
      price: 42000000,
      status: "Rent",
      type: "Commercial",
      propertyType: "Office Floor (Grade A)",
      bedrooms: 0,
      bathrooms: 6,
      size: 780,
      parking: "12 Cars",
      yearBuilt: 2021,
      furnishing: "Fitted",
      title: "Commercial Lease",
      featured: false,
      views: 760,
      addedDaysAgo: 26,
      agentId: 3,
      amenities: [
        "Grade A Building", "Open-Plan Floor", "2 Meeting Rooms", "Fibre Internet Ready",
        "Dedicated Parking Bays", "Full Power Redundancy", "Lifts & Fire System", "CCTV Surveillance",
        "Reception & Pantry Area", "Central Air Conditioning"
      ],
      description: [
        "A full Grade A office floor on Victoria Island, offered fitted and ready for occupation. The floor delivers an efficient open-plan layout of 780 m², six washrooms, two glazed meeting rooms, a server room and a reception suite with a pantry.",
        "The building provides full power redundancy, dual lifts, a fire suppression system, on-site facility management and twelve dedicated parking bays. Ideal for financial services, energy or technology occupiers seeking a prestigious address with flexible lease terms."
      ],
      images: [
        "assets/images/properties/property-08.webp",
        "assets/images/properties/property-08-2.webp",
        "assets/images/properties/property-08-3.webp",
        "assets/images/properties/property-08-4.webp",
        "assets/images/properties/property-08-5.webp"
      ]
    }
  ];

  /* ======================================================================
     Lookups & derived helpers
     ====================================================================== */
  function getProperty(id) {
    var key = String(id);
    return PROPERTIES.filter(function (p) {
      return String(p.id) === key || p.slug === key;
    })[0];
  }

  function getAgent(id) {
    return AGENTS.filter(function (a) { return a.id === id; })[0] || AGENTS[0];
  }

  /** Unique, ordered list of areas (used to populate location dropdowns). */
  function getAreas() {
    var seen = {};
    return PROPERTIES.map(function (p) { return p.area + ", " + p.city; }).filter(function (area) {
      if (seen[area]) return false;
      seen[area] = true;
      return true;
    }).sort();
  }

  function getTypes() {
    var seen = {};
    return PROPERTIES.map(function (p) { return p.type; }).filter(function (t) {
      if (seen[t]) return false;
      seen[t] = true;
      return true;
    });
  }

  /* ======================================================================
     Card template — used by the home page, listing page, favourites and
     the "similar properties" rail on the detail page.
     ====================================================================== */
  function propertyCard(p, options) {
    options = options || {};
    var isFav = !!(window.NestoraFavorites && window.NestoraFavorites.has(p.id));
    var rent = p.status === "Rent";
    var beds = p.bedrooms > 0
      ? '<li>' + icon("bed") + "<span>" + p.bedrooms + " Beds</span></li>"
      : "";

    return [
      '<article class="card" data-property-card data-id="' + p.id + '" data-reveal>',
      '  <div class="card__media">',
      '    <a href="property.html?id=' + p.id + '" aria-label="View ' + p.name + '">',
      /* Swap the WebP files in assets/images/properties/ to change card imagery */
      '      <img class="card__img" src="' + p.images[0] + '" alt="' + p.name + " in " + p.location +
      '" width="1280" height="854" loading="' + (options.eager ? "eager" : "lazy") + '" decoding="async">',
      "    </a>",
      '    <div class="card__badges">',
      '      <span class="badge badge--' + (rent ? "rent" : "sale") + '">For ' + (rent ? "Rent" : "Sale") + "</span>",
      p.featured ? '<span class="badge badge--featured">' + icon("star", "icon--sm") + " Featured</span>" : "",
      "    </div>",
      '    <button class="fav-btn' + (isFav ? " is-active" : "") + '" type="button" data-fav="' + p.id +
        '" aria-pressed="' + isFav + '" aria-label="' + (isFav ? "Remove " : "Save ") + p.name + ' to favourites" title="Save to favourites">',
      icon("heart"),
      "    </button>",
      "  </div>",
      '  <div class="card__body">',
      '    <div class="card__status-row">',
      '      <span class="card__type">' + p.type + (p.type === "Commercial" ? "" : " · " + p.propertyType) + "</span>",
      '      <span class="card__type">' + plural(p.size, "m²", "m²") + "</span>",
      "    </div>",
      '    <h3 class="card__title"><a href="property.html?id=' + p.id + '">' + p.name + "</a></h3>",
      '    <p class="card__location">' + icon("pin") + "<span>" + p.location + "</span></p>",
      '    <p class="card__price' + (rent ? " card__price--rent" : "") + '">',
      "      <small>" + (rent ? "Annual rent" : "Asking price") + "</small>",
      priceLabel(p),
      "    </p>",
      '    <ul class="card__meta">',
      beds,
      beds ? '<li class="sep" aria-hidden="true"></li>' : "",
      "<li>" + icon("bath") + "<span>" + p.bathrooms + " Baths</span></li>",
      '<li class="sep" aria-hidden="true"></li>',
      "<li>" + icon("area") + "<span>" + p.size + " m²</span></li>",
      "    </ul>",
      '    <div class="card__cta">',
      '      <a class="btn btn--ghost" href="property.html?id=' + p.id + '">View Details' + icon("arrowRight") + "</a>",
      '      <button class="card__share" type="button" data-share="' + p.id + '" aria-label="Copy link to ' + p.name + '" title="Copy link">',
      icon("arrowUpRight", "icon--sm"),
      "      </button>",
      "    </div>",
      "  </div>",
      "</article>"
    ].join("\n");
  }

  /* ======================================================================
     Public API
     ====================================================================== */
  window.NestoraIcons = ICONS;
  window.icon = icon;

  window.NestoraData = {
    properties: PROPERTIES,
    agents: AGENTS,
    getProperty: getProperty,
    getAgent: getAgent,
    getAreas: getAreas,
    getTypes: getTypes,
    propertyCard: propertyCard,
    formatNaira: formatNaira,
    formatNairaShort: formatNairaShort,
    priceLabel: priceLabel,
    plural: plural
  };
})(window);
