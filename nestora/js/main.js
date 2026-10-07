/* ==========================================================================
   NESTORA — js/main.js
   --------------------------------------------------------------------------
   Shared behaviour for every page:

     01. DOM helpers
     02. Toast notifications
     03. Header, mobile drawer & back-to-top
     04. Scroll reveal + animated counters
     05. Favourites (heart buttons, counter, share)
     06. Form validation
     07. Modal & lightbox
     08. Accordion
     09. Home page search widget
   ========================================================================== */

(function (window, document) {
  "use strict";

  /* ======================================================================
     01. DOM HELPERS
     ====================================================================== */
  function $(selector, scope) { return (scope || document).querySelector(selector); }
  function $$(selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); }
  function on(el, event, handler, options) { if (el) el.addEventListener(event, handler, options || false); }
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ======================================================================
     02. TOAST NOTIFICATIONS
     ----------------------------------------------------------------------
     A single live region is injected into every page by this module, so
     pages only need to call NestoraToast.show({ ... }).
     ====================================================================== */
  var toastHost = null;

  function ensureToastHost() {
    if (toastHost) return toastHost;
    toastHost = $("#toasts");
    if (!toastHost) {
      toastHost = document.createElement("div");
      toastHost.className = "toasts";
      toastHost.id = "toasts";
      toastHost.setAttribute("role", "status");
      toastHost.setAttribute("aria-live", "polite");
      document.body.appendChild(toastHost);
    }
    return toastHost;
  }

  var Toast = {
    /**
     * @param {Object} options
     * @param {string} options.title     bold first line
     * @param {string} [options.text]    supporting line
     * @param {string} [options.variant] "success" | "info" | "error"
     * @param {number} [options.timeout] ms before auto-dismiss
     */
    show: function (options) {
      options = options || {};
      var host = ensureToastHost();
      var variant = options.variant || "info";
      var iconName = variant === "success" ? "check" : variant === "error" ? "info" : "heart";

      var el = document.createElement("div");
      el.className = "toast toast--" + variant;
      el.innerHTML = [
        '<span class="toast__icon">' + window.icon(iconName, "icon--sm") + "</span>",
        '<div style="min-width:0">',
        '  <p class="toast__title">' + (options.title || "Done") + "</p>",
        options.text ? '  <p class="toast__text">' + options.text + "</p>" : "",
        "</div>",
        '<button class="toast__close" type="button" aria-label="Dismiss notification">' + window.icon("close", "icon--sm") + "</button>"
      ].join("");
      host.appendChild(el);

      // animate in on the next frame
      window.requestAnimationFrame(function () { el.classList.add("is-visible"); });

      var timer = window.setTimeout(dismiss, options.timeout || 4200);
      on($(".toast__close", el), "click", function () { window.clearTimeout(timer); dismiss(); });

      function dismiss() {
        el.classList.add("is-leaving");
        window.setTimeout(function () { el.remove(); }, 320);
      }
    }
  };

  /* ======================================================================
     03. HEADER, MOBILE DRAWER & BACK-TO-TOP
     ====================================================================== */
  function initHeader() {
    var header = $("[data-header]");
    if (!header) return;

    var transparent = document.body.getAttribute("data-transparent-header") === "true";
    var lastY = window.pageYOffset;
    var drawer = $("[data-drawer]");
    var burger = $("[data-burger]");

    function update() {
      var y = window.pageYOffset;
      var solid = !transparent || y > 24;
      header.classList.toggle("is-scrolled", solid);
      header.classList.toggle("header--on-hero", transparent && !solid);

      var drawerOpen = drawer && drawer.classList.contains("is-open");
      var scrollingDown = y > lastY && y > 420;
      header.classList.toggle("is-hidden", !!scrollingDown && !drawerOpen);
      lastY = y;

      var toTop = $("[data-to-top]");
      if (toTop) toTop.classList.toggle("is-visible", y > 700);
    }

    update();
    on(window, "scroll", function () { window.requestAnimationFrame(update); }, { passive: true });

    /* ---- mobile drawer ---- */
    function openDrawer() {
      if (!drawer) return;
      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      if (burger) {
        burger.classList.add("is-open");
        burger.setAttribute("aria-expanded", "true");
      }
      document.body.classList.add("is-locked");
      var firstLink = $(".drawer__link", drawer);
      if (firstLink) window.setTimeout(function () { firstLink.focus(); }, 260);
    }

    function closeDrawer() {
      if (!drawer || !drawer.classList.contains("is-open")) return;
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      if (burger) {
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
      document.body.classList.remove("is-locked");
    }

    on(burger, "click", function () {
      drawer && drawer.classList.contains("is-open") ? closeDrawer() : openDrawer();
    });
    on($(".drawer__scrim", drawer), "click", closeDrawer);
    on($("[data-drawer-close]", drawer), "click", closeDrawer);
    $$(".drawer__link, .drawer .btn", drawer).forEach(function (link) { on(link, "click", closeDrawer); });
    on(document, "keydown", function (event) {
      if (event.key === "Escape") {
        closeDrawer();
        closeModal();
        closeLightbox();
      }
    });
    on(window, "resize", function () {
      if (window.innerWidth > 1024) closeDrawer();
    });

    /* ---- back to top ---- */
    var toTop = $("[data-to-top]");
    on(toTop, "click", function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
  }

  /* ======================================================================
     04. SCROLL REVEAL + ANIMATED COUNTERS
     ====================================================================== */
  var revealObserver = null;

  function initReveal(root) {
    var scope = root || document;
    var targets = $$("[data-reveal], .reveal-img", scope).filter(function (el) {
      return !el.hasAttribute("data-reveal-bound");
    });
    if (!targets.length) return;

    if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = el.getAttribute("data-reveal-delay");
          if (delay) el.style.setProperty("--reveal-delay", delay + "ms");
          el.classList.add("is-visible");
          revealObserver.unobserve(el);
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    }

    targets.forEach(function (el) {
      el.setAttribute("data-reveal-bound", "true");
      revealObserver.observe(el);
    });
  }

  function initCounters(root) {
    var counters = $$("[data-count]", root || document);
    if (!counters.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var suffix = el.getAttribute("data-suffix") || "";
      var prefix = el.getAttribute("data-prefix") || "";
      var duration = 1400;
      var start = null;

      if (prefersReducedMotion()) {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
        return;
      }

      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        var value = target * eased;
        el.textContent = prefix + value.toLocaleString("en-NG", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }) + suffix;
        if (progress < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(run);
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { observer.observe(el); });
  }

  /* ======================================================================
     05. FAVOURITES — heart buttons, counter, share
     ====================================================================== */
  function initFavorites() {
    if (!window.NestoraFavorites) return;

    // Delegated click handling so JS-generated cards work automatically.
    on(document, "click", function (event) {
      var favBtn = event.target.closest ? event.target.closest("[data-fav]") : null;
      if (favBtn) {
        event.preventDefault();
        var id = Number(favBtn.getAttribute("data-fav"));
        var property = window.NestoraData.getProperty(id);
        var added = window.NestoraFavorites.toggle(id);

        favBtn.classList.remove("is-pop");
        void favBtn.offsetWidth; // restart the CSS animation
        favBtn.classList.add("is-pop");

        Toast.show({
          title: added ? "Saved to favourites" : "Removed from favourites",
          text: added
            ? property.name + " · " + property.location + " was added to your saved list."
            : property.name + " was removed from your saved list.",
          variant: added ? "info" : "success",
          timeout: 3600
        });
        return;
      }

      // Copy a deep link to a listing
      var shareBtn = event.target.closest ? event.target.closest("[data-share]") : null;
      if (shareBtn) {
        event.preventDefault();
        copyText(new URL("property.html?id=" + shareBtn.getAttribute("data-share"), window.location.href).href);
      }
    });

    // Bump the header counter whenever the store changes
    on(document, "nestora:favorites-changed", function (event) {
      var counter = $("[data-favorites-count]");
      if (!counter) return;
      counter.classList.remove("is-bump");
      void counter.offsetWidth;
      counter.classList.add("is-bump");
      if (event.detail && event.detail.action === "removed") {
        /* keep the toast from the click handler as the single message */
      }
    });
  }

  function copyText(text) {
    function done() {
      Toast.show({ title: "Link copied", text: "The property link is on your clipboard.", variant: "success", timeout: 2600 });
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else {
      fallback();
    }
    function fallback() {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "true");
      area.style.position = "fixed";
      area.style.top = "-1000px";
      document.body.appendChild(area);
      area.select();
      try { document.execCommand("copy"); done(); } catch (error) {
        Toast.show({ title: "Copy unavailable", text: text, variant: "error" });
      }
      area.remove();
    }
  }

  /* ======================================================================
     06. FORM VALIDATION
     ----------------------------------------------------------------------
     Any <form data-validate> is wired up automatically. Individual inputs
     opt in with `required` and/or `data-rule="email|phone|date-future|
     minlength:20|checked"`. Errors render into the sibling .field-error
     element and a success toast is shown on submit.
     ====================================================================== */
  var VALIDATORS = {
    email: {
      test: function (value) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value); },
      message: "Enter a valid email address."
    },
    phone: {
      test: function (value) {
        var digits = value.replace(/[\s()\-.]/g, "");
        return /^(\+?234|0)[789][01]\d{8}$/.test(digits);
      },
      message: "Enter a valid Nigerian number, e.g. 0802 415 7788."
    },
    "date-future": {
      test: function (value) {
        if (!value) return false;
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(value + "T23:59:59") >= today;
      },
      message: "Choose today or a future date."
    },
    checked: {
      test: function (value, field) { return field.checked; },
      message: "Please tick this box to continue."
    }
  };

  function fieldWrapper(field) {
    return field.closest(".field") || field.closest(".check") || field.parentElement;
  }

  function errorSlot(field) {
    var wrapper = fieldWrapper(field);
    var slot = wrapper ? $(".field-error", wrapper) : null;
    if (!slot && wrapper) {
      slot = document.createElement("p");
      slot.className = "field-error";
      wrapper.appendChild(slot);
    }
    return slot;
  }

  function validateField(field) {
    var value = (field.value || "").trim();
    var rules = (field.getAttribute("data-rule") || "").split("|").filter(Boolean);
    var label = field.getAttribute("data-label") || "This field";
    var message = "";

    if (field.hasAttribute("required")) rules.unshift("required");

    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      var [name, arg] = rule.split(":");

      if (name === "required") {
        if (field.type === "checkbox" ? !field.checked : !value) {
          message = label + " is required.";
          break;
        }
      } else if (name === "minlength") {
        if (value && value.length < Number(arg)) {
          message = label + " should be at least " + arg + " characters.";
          break;
        }
      } else if (VALIDATORS[name]) {
        if (value && !VALIDATORS[name].test(value, field)) {
          message = VALIDATORS[name].message;
          break;
        }
        if (!value && field.hasAttribute("required") && name !== "required") {
          message = label + " is required.";
          break;
        }
      }
    }

    var wrapper = fieldWrapper(field);
    var slot = errorSlot(field);
    if (wrapper) wrapper.classList.toggle("has-error", !!message);
    if (slot) slot.textContent = message;
    field.setAttribute("aria-invalid", message ? "true" : "false");
    return !message;
  }

  function initForms() {
    $$("form[data-validate]").forEach(function (form) {
      var fields = $$("input, select, textarea", form).filter(function (field) {
        return field.hasAttribute("required") || field.hasAttribute("data-rule");
      });

      fields.forEach(function (field) {
        on(field, "blur", function () { validateField(field); });
        on(field, "input", function () {
          if (fieldWrapper(field) && fieldWrapper(field).classList.contains("has-error")) validateField(field);
        });
      });

      on(form, "submit", function (event) {
        event.preventDefault();
        var valid = true;
        var firstInvalid = null;

        fields.forEach(function (field) {
          var ok = validateField(field);
          if (!ok && !firstInvalid) firstInvalid = field;
          valid = valid && ok;
        });

        if (!valid) {
          Toast.show({
            title: "Please check the form",
            text: "Some details are missing or need correcting.",
            variant: "error"
          });
          if (firstInvalid) {
            firstInvalid.focus({ preventScroll: false });
            firstInvalid.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
          }
          return;
        }

        // Simulated submit (no backend in this demo)
        var submitBtn = $('[type="submit"]', form);
        var originalHTML = submitBtn ? submitBtn.innerHTML : "";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>Sending…</span>';
        }

        window.setTimeout(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHTML;
          }
          Toast.show({
            title: form.getAttribute("data-success-title") || "Message sent",
            text: form.getAttribute("data-success") || "Thank you — a Nestora consultant will contact you shortly.",
            variant: "success",
            timeout: 5200
          });
          form.reset();
          fields.forEach(function (field) {
            var wrapper = fieldWrapper(field);
            if (wrapper) wrapper.classList.remove("has-error");
          });
          if (form.getAttribute("data-redirect")) {
            window.setTimeout(function () {
              window.location.href = form.getAttribute("data-redirect");
            }, 1400);
          }
        }, form.getAttribute("data-delay") === "0" ? 0 : 900);
      });
    });
  }

  /* ======================================================================
     07. MODAL & LIGHTBOX
     ====================================================================== */
  var activeModal = null;

  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    closeModal();
    activeModal = modal;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    var focusable = $("input, select, textarea, button:not(.modal__close)", modal);
    if (focusable) window.setTimeout(function () { focusable.focus(); }, 220);
  }

  function closeModal() {
    if (!activeModal) return;
    activeModal.classList.remove("is-open");
    activeModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
    activeModal = null;
  }

  function initModals() {
    on(document, "click", function (event) {
      var trigger = event.target.closest ? event.target.closest("[data-modal-open]") : null;
      if (trigger) {
        event.preventDefault();
        openModal(trigger.getAttribute("data-modal-open"));
        return;
      }
      if (event.target.closest && event.target.closest("[data-modal-close]")) {
        event.preventDefault();
        closeModal();
      }
    });
  }

  /* Lightbox ------------------------------------------------------------- */
  var lightbox = null;
  var lightboxState = { images: [], index: 0, title: "" };

  function ensureLightbox() {
    if (lightbox) return lightbox;
    lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-label", "Property image viewer");
    lightbox.innerHTML = [
      '<img alt="">',
      '<p class="lightbox__caption"></p>',
      '<button class="lightbox__close" type="button" aria-label="Close viewer">' + window.icon("close") + "</button>",
      '<button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Previous image">' + window.icon("chevronLeft") + "</button>",
      '<button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Next image">' + window.icon("chevronRight") + "</button>"
    ].join("");
    document.body.appendChild(lightbox);

    on($(".lightbox__close", lightbox), "click", closeLightbox);
    on($(".lightbox__nav--prev", lightbox), "click", function (e) { e.stopPropagation(); step(-1); });
    on($(".lightbox__nav--next", lightbox), "click", function (e) { e.stopPropagation(); step(1); });
    on(lightbox, "click", function (e) { if (e.target === lightbox) closeLightbox(); });
    return lightbox;
  }

  function paintLightbox() {
    var img = $("img", lightbox);
    img.src = lightboxState.images[lightboxState.index];
    img.alt = lightboxState.title + " — image " + (lightboxState.index + 1);
    $(".lightbox__caption", lightbox).textContent =
      lightboxState.title + " · " + (lightboxState.index + 1) + " / " + lightboxState.images.length;
  }

  function step(direction) {
    var total = lightboxState.images.length;
    lightboxState.index = (lightboxState.index + direction + total) % total;
    paintLightbox();
  }

  function openLightbox(images, index, title) {
    ensureLightbox();
    lightboxState = { images: images, index: index || 0, title: title || "" };
    paintLightbox();
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
  }

  function closeLightbox() {
    if (!lightbox || !lightbox.classList.contains("is-open")) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
  }

  /* ======================================================================
     08. ACCORDION
     ====================================================================== */
  function initAccordion() {
    $$(".accordion").forEach(function (group) {
      var items = $$(".accordion__item", group);

      // Open any item marked .is-open in the markup
      items.forEach(function (item) {
        if (!item.classList.contains("is-open")) return;
        var openPanel = $(".accordion__panel", item);
        if (openPanel) openPanel.style.maxHeight = openPanel.scrollHeight + "px";
      });

      items.forEach(function (item) {
        var trigger = $(".accordion__trigger", item);
        var panel = $(".accordion__panel", item);
        on(trigger, "click", function () {
          var isOpen = item.classList.contains("is-open");

          items.forEach(function (other) {
            other.classList.remove("is-open");
            var otherPanel = $(".accordion__panel", other);
            if (otherPanel) otherPanel.style.maxHeight = "0px";
            var otherTrigger = $(".accordion__trigger", other);
            if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
          });

          if (!isOpen) {
            item.classList.add("is-open");
            panel.style.maxHeight = panel.scrollHeight + "px";
            trigger.setAttribute("aria-expanded", "true");
          }
        });
      });
    });
  }

  /* ======================================================================
     09. HOME PAGE SEARCH WIDGET
     ----------------------------------------------------------------------
     The hero search and its quick chips simply navigate to properties.html
     with query parameters — filters.js does the rest.
     ====================================================================== */
  function initHeroSearch() {
    var form = $("#hero-search");
    if (form) {
      on(form, "submit", function (event) {
        event.preventDefault();
        var params = new URLSearchParams();
        var map = { location: "location", type: "type", min: "minPrice", max: "maxPrice" };
        Object.keys(map).forEach(function (fieldName) {
          var field = form.elements[fieldName];
          var value = field && field.value ? field.value.trim() : "";
          if (value && value !== "Any") params.set(map[fieldName], value);
        });
        window.location.href = "properties.html" + (params.toString() ? "?" + params.toString() : "");
      });
    }

    $$("[data-quick]").forEach(function (chip) {
      on(chip, "click", function () {
        window.location.href = "properties.html?" + chip.getAttribute("data-quick");
      });
    });

    // Location field suggestions
    var datalist = $("#areas-list");
    if (datalist && window.NestoraData) {
      datalist.innerHTML = window.NestoraData.getAreas().map(function (area) {
        return "<option value='" + area + "'></option>";
      }).join("");
    }
  }

  /* ======================================================================
     10. CONTACT PAGE — pre-select the enquiry type from ?subject=
     ----------------------------------------------------------------------
     Lets every "Sell" / "List Your Property" call to action land on the
     contact page with the right subject already chosen.
     ====================================================================== */
  function initContactSubject() {
    var select = $("#contact-subject");
    if (!select) return;

    var wanted = new URLSearchParams(window.location.search).get("subject");
    if (!wanted) return;

    var match = $$("option", select).filter(function (option) {
      return option.value === wanted;
    })[0];

    if (match) {
      select.value = wanted;
      select.classList.add("is-prefilled");
      var note = $("#contact-subject-note");
      if (note) note.hidden = false;
    }
  }

  /* ======================================================================
     BOOTSTRAP
     ====================================================================== */
  document.addEventListener("DOMContentLoaded", function () {
    initHeader();
    initReveal();
    initCounters();
    initFavorites();
    initForms();
    initModals();
    initAccordion();
    initHeroSearch();
    initContactSubject();

    // Stamp the current year in any footer
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

    // Inject the back-to-top control (keeps markup light)
    if (!$("[data-to-top]")) {
      var toTop = document.createElement("button");
      toTop.className = "to-top";
      toTop.type = "button";
      toTop.setAttribute("data-to-top", "");
      toTop.setAttribute("aria-label", "Back to top");
      toTop.innerHTML = window.icon("chevronUp");
      document.body.appendChild(toTop);
    }

    // Demo-only links (privacy policy, terms) — no dead hrefs in the markup
    $$("[data-demo]").forEach(function (link) {
      on(link, "click", function (event) {
        event.preventDefault();
        Toast.show({
          title: "Demo link",
          text: "Legal pages are not part of this demonstration build.",
          variant: "info",
          timeout: 3000
        });
      });
    });

    // Newsletter form in the footer
    $$("form[data-newsletter]").forEach(function (form) {
      on(form, "submit", function (event) {
        event.preventDefault();
        var input = $("input", form);
        if (!input.value.trim() || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(input.value.trim())) {
          Toast.show({ title: "Check your email", text: "Enter a valid email address to subscribe.", variant: "error" });
          input.focus();
          return;
        }
        Toast.show({
          title: "You're subscribed",
          text: "New Nestora listings and market notes will land in your inbox monthly.",
          variant: "success"
        });
        form.reset();
      });
    });
  });

  // Re-scan for reveal targets after dynamic rendering (filters, favourites…)
  document.addEventListener("nestora:content-rendered", function (event) {
    initReveal(event.detail && event.detail.root);
    initCounters(event.detail && event.detail.root);
  });

  /* ======================================================================
     PUBLIC API
     ====================================================================== */
  window.NestoraToast = Toast;
  window.NestoraUI = {
    openModal: openModal,
    closeModal: closeModal,
    openLightbox: openLightbox,
    closeLightbox: closeLightbox,
    validateField: validateField,
    initReveal: initReveal,
    copyText: copyText
  };
})(window, document);
