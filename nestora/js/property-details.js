/* ==========================================================================
   NESTORA — js/property-details.js
   --------------------------------------------------------------------------
   Renders property.html from the ?id= query parameter:

     • image gallery (thumbnails, next/prev, keyboard support, lightbox)
     • headline, price, key facts, description, amenities, specification
     • location block (styled map placeholder + neighbourhood notes)
     • agent card with phone / WhatsApp / email actions
     • "Request a Viewing" form (validated by main.js)
     • similar property suggestions
   ========================================================================== */

(function (window, document) {
  "use strict";

  var Data = window.NestoraData;
  var UI = window.NestoraUI;

  var gallery = { images: [], index: 0, title: "" };

  /* Neighbourhood notes power the location panel — a small static map keeps
     the demo dependency-free, so these lines stand in for a live map API. */
  var AREA_NOTES = {
    Lekki: ["Admiralty Way", "Lekki Phase 1 Gate", "Nike Art Gallery", "Lekki-Ikoyi Link Bridge"],
    Ikoyi: ["Awolowo Road", "Kingsway Road", "Ikoyi Club 1938", "Third Mainland Bridge"],
    Ajah: ["Abraham Adesanya Estate", "Ajah Market", "Lekki-Epe Expressway", "Novare Mall (Sangotedo)"],
    "Victoria Island": ["Adeola Odeku Street", "Oniru Market", "Landmark Beach", "Ozumba Mbadiwe Avenue"],
    Ikeja: ["Ikeja GRA", "Allen Avenue", "Ikeja City Mall", "Murtala Muhammed Airport"]
  };

  /* ---------------------------------------------------------------------
     Helpers
     --------------------------------------------------------------------- */
  function el(id) { return document.getElementById(id); }
  function setText(id, value) {
    var node = el(id);
    if (node) node.textContent = value;
  }
  function setHTML(id, value) {
    var node = el(id);
    if (node) node.innerHTML = value;
  }

  function specRow(key, value) {
    return '<div class="spec-row"><span class="spec-row__key">' + key +
      '</span><span class="spec-row__val">' + value + "</span></div>";
  }

  function metaItem(iconName, label, value) {
    return [
      '<div class="detail-meta__item">',
      window.icon(iconName),
      "<div>",
      '<p class="detail-meta__label">' + label + "</p>",
      '<p class="detail-meta__value">' + value + "</p>",
      "</div>",
      "</div>"
    ].join("");
  }

  /* ---------------------------------------------------------------------
     Gallery
     --------------------------------------------------------------------- */
  function renderGallery(property) {
    gallery.images = property.images.slice();
    gallery.index = 0;
    gallery.title = property.name;

    var stage = el("gallery-image");
    stage.src = gallery.images[0];
    stage.alt = property.name + " — main view";

    // thumbnails
    setHTML("gallery-thumbs", gallery.images.map(function (src, index) {
      return [
        '<button class="gallery__thumb' + (index === 0 ? " is-active" : "") + '" type="button" ' +
          'data-thumb="' + index + '" aria-label="Show image ' + (index + 1) + ' of ' + gallery.images.length + '">',
        '<img src="' + src + '" alt="' + property.name + " — image " + (index + 1) +
          '" width="320" height="240" loading="lazy" decoding="async">',
        "</button>"
      ].join("");
    }).join(""));

    updateCounter();

    // thumbnails
    document.querySelectorAll("[data-thumb]").forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        showImage(Number(thumb.getAttribute("data-thumb")));
      });
    });

    // next / previous
    var prev = el("gallery-prev");
    var next = el("gallery-next");
    if (prev) prev.addEventListener("click", function () { showImage(gallery.index - 1); });
    if (next) next.addEventListener("click", function () { showImage(gallery.index + 1); });

    // click the stage to open the full-screen viewer
    var stageWrap = el("gallery-stage");
    if (stageWrap) {
      stageWrap.addEventListener("click", function (event) {
        if (event.target.closest(".gallery__nav") || event.target.closest("[data-fav]")) return;
        UI.openLightbox(gallery.images, gallery.index, property.name);
      });
    }

    // keyboard control while the gallery is in view
    document.addEventListener("keydown", function (event) {
      if (document.body.classList.contains("is-locked")) return; // lightbox/drawer open
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      if (/INPUT|SELECT|TEXTAREA/.test(tag)) return;
      if (event.key === "ArrowLeft") showImage(gallery.index - 1);
      if (event.key === "ArrowRight") showImage(gallery.index + 1);
    });
  }

  function showImage(index) {
    var total = gallery.images.length;
    gallery.index = (index + total) % total;

    var stage = el("gallery-image");
    stage.classList.add("is-swapping");

    window.setTimeout(function () {
      stage.src = gallery.images[gallery.index];
      stage.alt = gallery.title + " — image " + (gallery.index + 1);
      stage.classList.remove("is-swapping");
    }, 180);

    document.querySelectorAll("[data-thumb]").forEach(function (thumb) {
      thumb.classList.toggle("is-active", Number(thumb.getAttribute("data-thumb")) === gallery.index);
    });
    updateCounter();
  }

  function updateCounter() {
    setText("gallery-counter", (gallery.index + 1) + " / " + gallery.images.length);
  }

  /* ---------------------------------------------------------------------
     Main content
     --------------------------------------------------------------------- */
  function renderProperty(property) {
    var agent = Data.getAgent(property.agentId);
    var rent = property.status === "Rent";

    // Document metadata
    document.title = property.name + " · " + property.location + " | NESTORA";
    var meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", property.name + " in " + property.location + " — " +
        Data.priceLabel(property) + ", " + property.bedrooms + " bedrooms, " + property.size +
        " m². Book an inspection with NESTORA.");
    }

    // Breadcrumb + headline
    setText("crumb-name", property.name);
    setText("detail-name", property.name);
    setHTML("detail-location", window.icon("pin") + "<span>" + property.location + "</span>");
    setHTML("detail-badges",
      '<span class="badge badge--' + (rent ? "rent" : "sale") + '">For ' + (rent ? "Rent" : "Sale") + "</span>" +
      '<span class="badge badge--soft">' + property.type + "</span>" +
      (property.featured ? '<span class="badge badge--featured">' + window.icon("star", "icon--sm") + " Featured</span>" : ""));

    setHTML("detail-price", Data.priceLabel(property) + "<small>" +
      (rent ? "Annual rent · negotiable" : "Asking price · negotiable") + "</small>");

    // Key facts strip
    setHTML("detail-meta", [
      property.bedrooms > 0 ? metaItem("bed", "Bedrooms", property.bedrooms) : "",
      metaItem("bath", "Bathrooms", property.bathrooms),
      metaItem("area", "Floor area", property.size + " m²"),
      metaItem("car", "Parking", property.parking),
      metaItem("building", "Type", property.type)
    ].join(""));

    // Gallery badges + favourite
    setHTML("gallery-badges",
      '<span class="badge badge--' + (rent ? "rent" : "sale") + '">For ' + (rent ? "Rent" : "Sale") + "</span>" +
      '<span class="badge badge--dark">' + property.propertyType + "</span>");

    // Sticky favourite button (kept in sync by favorites.js)
    var favBtn = el("detail-fav");
    if (favBtn) {
      favBtn.setAttribute("data-fav", property.id);
      favBtn.setAttribute("aria-label", property.name);
      favBtn.hidden = false;
    }
    var inlineFav = el("detail-fav-inline");
    if (inlineFav) {
      inlineFav.setAttribute("data-fav", property.id);
      inlineFav.setAttribute("aria-label", "Save " + property.name);
      inlineFav.hidden = false;
    }
    var shareBtn = el("detail-share");
    if (shareBtn) {
      shareBtn.setAttribute("data-share", property.id);
      shareBtn.hidden = false;
    }
    window.NestoraFavorites.sync();

    // Description
    setText("detail-eyebrow-type", property.propertyType + " · " + property.location);
    setHTML("detail-description", property.description.map(function (paragraph) {
      return "<p>" + paragraph + "</p>";
    }).join(""));

    // Amenities
    setHTML("detail-features", property.amenities.map(function (amenity) {
      return "<li><span class='tick'>" + window.icon("check", "icon--sm") + "</span>" + amenity + "</li>";
    }).join(""));

    // Specification table
    var specs = [
      ["Property Type", property.propertyType],
      ["Status", "For " + property.status],
      ["Year Built", property.yearBuilt],
      ["Property Size", property.size + " m²"],
      ["Bedrooms", property.bedrooms > 0 ? property.bedrooms : "—"],
      ["Bathrooms", property.bathrooms],
      ["Parking", property.parking],
      ["Furnishing", property.furnishing],
      ["Title Document", property.title],
      ["Listing Reference", "NST-" + String(property.id).padStart(4, "0")]
    ];
    setHTML("detail-specs", specs.map(function (row) { return specRow(row[0], row[1]); }).join(""));

    // Price panel
    setHTML("panel-price", Data.priceLabel(property) + "<small>" +
      (rent ? "Per annum, payable annually" : "Negotiable · verified listing") + "</small>");
    setHTML("panel-price-rows", [
      '<div class="price-card__row"><span>Service charge</span><strong>' +
        (property.type === "Commercial" ? "₦4,200,000 / year" : "₦" + (property.size * 12000).toLocaleString("en-NG") + " / year") +
        "</strong></div>",
      '<div class="price-card__row"><span>Title document</span><strong>' + property.title + "</strong></div>",
      '<div class="price-card__row"><span>Listing reference</span><strong>NST-' +
        String(property.id).padStart(4, "0") + "</strong></div>"
    ].join(""));

    // Location panel
    setText("map-address", property.name + ", " + property.location);
    setText("map-pin-label", property.area + " · " + property.city);
    var notes = AREA_NOTES[property.area] || [];
    setHTML("map-landmarks", notes.map(function (note) { return "<span>" + note + "</span>"; }).join(""));

    // Agent card
    setHTML("agent-photo", '<img class="agent-card__photo" src="' + agent.photo + '" alt="' +
      agent.name + ', ' + agent.role + ' at NESTORA" width="720" height="900" loading="lazy" decoding="async">');
    setText("agent-name", agent.name);
    setText("agent-role", agent.role);
    setHTML("agent-meta", [
      window.icon("star", "icon--sm"),
      agent.rating + " rating · " + agent.listings + " listings · " + agent.focus
    ].join(" "));

    var tel = el("agent-phone");
    if (tel) tel.href = "tel:" + agent.phone.replace(/\s/g, "");
    var wa = el("agent-whatsapp");
    if (wa) {
      wa.href = "https://wa.me/" + agent.whatsapp + "?text=" +
        encodeURIComponent("Hello " + agent.name.split(" ")[0] + ", I'd like to arrange an inspection of " +
          property.name + " (" + property.location + ") listed at " + Data.priceLabel(property) + ".");
      wa.target = "_blank";
      wa.rel = "noopener";
    }
    var mail = el("agent-email");
    if (mail) {
      mail.href = "mailto:" + agent.email + "?subject=" +
        encodeURIComponent("Enquiry: " + property.name + " (NST-" + String(property.id).padStart(4, "0") + ")");
    }

    // Pre-fill the forms with the listing reference
    var viewingProperty = el("viewing-property");
    if (viewingProperty) viewingProperty.value = property.name + " · " + property.location;
    var modalProperty = el("modal-property");
    if (modalProperty) modalProperty.value = property.name;
    setText("viewing-agent-name", agent.name);

    // Minimum date for the "Preferred Date" field
    var dateField = el("viewing-date");
    if (dateField) {
      var today = new Date();
      var iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      dateField.min = iso;
      dateField.value = "";
    }

    // Browser document title in the tab
    window.NestoraLastViewed = property.id;
  }

  /* ---------------------------------------------------------------------
     Similar listings
     --------------------------------------------------------------------- */
  function renderSimilar(property) {
    var grid = el("similar-grid");
    if (!grid) return;

    var scored = Data.properties
      .filter(function (item) { return item.id !== property.id; })
      .map(function (item) {
        var score = 0;
        if (item.area === property.area) score += 3;
        if (item.type === property.type) score += 2;
        if (item.status === property.status) score += 1;
        score -= Math.abs(item.price - property.price) / 100000000; // closer prices rank higher
        return { item: item, score: score };
      })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 3)
      .map(function (entry) { return entry.item; });

    grid.innerHTML = scored.map(function (item) { return Data.propertyCard(item); }).join("");
    document.dispatchEvent(new CustomEvent("nestora:content-rendered", { detail: { root: grid } }));
    window.NestoraFavorites.sync();
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    if (!el("property-root")) return; // not the details page

    var params = new URLSearchParams(window.location.search);
    var property = Data.getProperty(params.get("id") || "1");

    if (!property) {
      el("property-root").hidden = true;
      var missing = el("property-missing");
      if (missing) missing.hidden = false;
      document.title = "Property not found | NESTORA";
      return;
    }

    renderGallery(property);
    renderProperty(property);
    renderSimilar(property);
    window.NestoraUI.initReveal(document.getElementById("property-root"));
  });
})(window, document);
