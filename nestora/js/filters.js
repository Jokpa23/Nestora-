/* ==========================================================================
   NESTORA — js/filters.js
   --------------------------------------------------------------------------
   Drives properties.html: combines every filter, sorts, paginates and
   re-renders the grid in place (no page reload, no libraries).

   State lives in one object. Every control in the filter panel writes into
   that object, the URL is kept in sync with history.replaceState(), and the
   grid is repainted from the shared PROPERTIES data source.
   ========================================================================== */

(function (window, document) {
  "use strict";

  var Data = window.NestoraData;
  var PER_PAGE = 6;

  /* ---------------------------------------------------------------------
     State
     --------------------------------------------------------------------- */
  var state = {
    q: "",            // free text: property name or location
    status: "Any",    // Any | Sale | Rent
    type: "Any",      // Any | Apartment | House | Villa | Duplex | Penthouse | Commercial
    min: "",          // minimum price (string from the select)
    max: "",          // maximum price
    beds: "",         // "" | 1..5  (means "N or more")
    baths: "",        // "" | 1..5
    size: "",         // minimum floor area
    sort: "newest",
    page: 1
  };

  var els = {};

  /* ---------------------------------------------------------------------
     URL <-> state
     --------------------------------------------------------------------- */
  function readUrl() {
    var params = new URLSearchParams(window.location.search);
    ["q", "status", "type", "min", "max", "beds", "baths", "size", "sort"].forEach(function (key) {
      var value = params.get(key);
      if (value !== null && value !== "") state[key] = value;
    });
    if (params.get("minPrice")) state.min = params.get("minPrice");
    if (params.get("maxPrice")) state.max = params.get("maxPrice");
    if (params.get("location")) state.q = params.get("location");
  }

  function writeUrl() {
    var params = new URLSearchParams();
    Object.keys(state).forEach(function (key) {
      if (key === "page") return; // keep the URL tidy
      if (state[key] && state[key] !== "Any") params.set(key, state[key]);
    });
    var query = params.toString();
    var url = window.location.pathname.split("/").pop() + (query ? "?" + query : "");
    window.history.replaceState({}, "", url);
  }

  /* ---------------------------------------------------------------------
     Filtering + sorting
     --------------------------------------------------------------------- */
  function matches(property) {
    // Free text — matches the property name, area, city or full location
    if (state.q) {
      var needle = state.q.toLowerCase().trim();
      var haystack = [property.name, property.location, property.area, property.city, property.type]
        .join(" ").toLowerCase();
      if (haystack.indexOf(needle) === -1) return false;
    }

    if (state.status !== "Any" && property.status !== state.status) return false;
    if (state.type !== "Any" && property.type !== state.type) return false;

    if (state.min !== "" && property.price < Number(state.min)) return false;
    if (state.max !== "" && property.price > Number(state.max)) return false;

    if (state.beds !== "" && property.bedrooms < Number(state.beds)) return false;
    if (state.baths !== "" && property.bathrooms < Number(state.baths)) return false;
    if (state.size !== "" && property.size < Number(state.size)) return false;

    return true;
  }

  var SORTERS = {
    newest: function (a, b) { return a.addedDaysAgo - b.addedDaysAgo; },
    "price-asc": function (a, b) { return a.price - b.price; },
    "price-desc": function (a, b) { return b.price - a.price; },
    "size-desc": function (a, b) { return b.size - a.size; },
    popular: function (a, b) { return b.views - a.views; }
  };

  function results() {
    return Data.properties
      .filter(matches)
      .sort(SORTERS[state.sort] || SORTERS.newest);
  }

  /* ---------------------------------------------------------------------
     Rendering
     --------------------------------------------------------------------- */
  function renderGrid(list) {
    var total = list.length;
    var pages = Math.max(1, Math.ceil(total / PER_PAGE));
    if (state.page > pages) state.page = pages;

    var start = (state.page - 1) * PER_PAGE;
    var pageItems = list.slice(start, start + PER_PAGE);

    els.grid.innerHTML = pageItems.map(function (property) {
      return Data.propertyCard(property);
    }).join("");

    // Count / summary
    els.count.innerHTML = "<b>" + total + "</b> " + (total === 1 ? "Property" : "Properties") + " Found";
    if (els.summary) {
      els.summary.textContent = total
        ? "Showing " + (start + 1) + "–" + (start + pageItems.length) + " of " + total
        : "";
    }

    // Empty state
    var isEmpty = total === 0;
    els.empty.hidden = !isEmpty;
    els.grid.hidden = isEmpty;
    if (els.emptyQuery) {
      els.emptyQuery.textContent = state.q ? ' for “' + state.q + '”' : "";
    }

    renderPagination(pages);
    renderActiveChips();
    els.results.classList.remove("is-loading");

    document.dispatchEvent(new CustomEvent("nestora:content-rendered", { detail: { root: els.grid } }));
  }

  function renderPagination(pages) {
    if (!els.pagination) return;
    if (pages <= 1) {
      els.pagination.innerHTML = "";
      return;
    }
    var buttons = ['<button type="button" data-page="' + (state.page - 1) + '"' +
      (state.page === 1 ? " disabled" : "") + ' aria-label="Previous page">Prev</button>'];

    for (var i = 1; i <= pages; i++) {
      buttons.push('<button type="button" data-page="' + i + '"' +
        (i === state.page ? ' class="is-active" aria-current="page"' : "") + ">" + i + "</button>");
    }
    buttons.push('<button type="button" data-page="' + (state.page + 1) + '"' +
      (state.page === pages ? " disabled" : "") + ' aria-label="Next page">Next</button>');

    els.pagination.innerHTML = buttons.join("");
  }

  /* Labels for the removable chips */
  var CHIP_LABELS = {
    q: function (v) { return "Search: " + v; },
    status: function (v) { return "For " + v; },
    type: function (v) { return v; },
    min: function (v) { return "From " + Data.formatNairaShort(Number(v)); },
    max: function (v) { return "Up to " + Data.formatNairaShort(Number(v)); },
    beds: function (v) { return v + "+ beds"; },
    baths: function (v) { return v + "+ baths"; },
    size: function (v) { return v + "+ m²"; }
  };

  function activeKeys() {
    return Object.keys(CHIP_LABELS).filter(function (key) {
      return state[key] !== "" && state[key] !== "Any";
    });
  }

  function renderActiveChips() {
    var keys = activeKeys();
    if (!els.activeFilters) return;

    if (!keys.length && state.sort === "newest") {
      els.activeFilters.innerHTML = "";
      return;
    }

    els.activeFilters.innerHTML =
      '<span class="active-filters__label">Active</span>' +
      keys.map(function (key) {
        return '<button class="chip is-active" type="button" data-clear-filter="' + key + '">' +
          CHIP_LABELS[key](state[key]) +
          '<span class="chip__x" aria-hidden="true">' + window.icon("close", "icon--sm") + "</span></button>";
      }).join("") +
      (keys.length ? '<button class="btn btn--ghost btn--sm" type="button" data-clear-all>Clear all</button>' : "");
  }

  /* ---------------------------------------------------------------------
     Filter <-> form wiring
     --------------------------------------------------------------------- */
  function syncFormFromState() {
    if (!els.form) return;
    els.form.querySelectorAll("input, select").forEach(function (field) {
      var name = field.name;
      if (!name || !(name in state)) return;
      if (field.type === "radio") {
        field.checked = String(state[name]) === field.value;
      } else if (field.type === "checkbox") {
        field.checked = !!state[name];
      } else {
        field.value = state[name];
      }
    });
    if (els.searchInput) els.searchInput.value = state.q;
    if (els.sortSelect) els.sortSelect.value = state.sort;
    updateFilterBadge();
  }

  function updateFilterBadge() {
    if (!els.filterToggleBadge) return;
    var count = activeKeys().length;
    els.filterToggleBadge.textContent = count;
    els.filterToggleBadge.hidden = count === 0;
  }

  function clearAll() {
    state.q = "";
    state.status = "Any";
    state.type = "Any";
    state.min = "";
    state.max = "";
    state.beds = "";
    state.baths = "";
    state.size = "";
    state.sort = "newest";
    state.page = 1;
    syncFormFromState();
    apply(true);
    window.NestoraToast.show({
      title: "Filters cleared",
      text: "Showing every available listing.",
      variant: "info",
      timeout: 2600
    });
  }

  function apply(immediate) {
    writeUrl();
    els.results.classList.add("is-loading");
    window.clearTimeout(apply.timer);
    apply.timer = window.setTimeout(function () {
      renderGrid(results());
    }, immediate ? 0 : 160); // tiny delay keeps transitions feeling smooth, not laggy
  }

  function bindEvents() {
    // Search bar (location / property name)
    if (els.searchInput) {
      els.searchInput.addEventListener("input", function () {
        state.q = els.searchInput.value;
        state.page = 1;
        apply();
      });
      els.searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          state.q = els.searchInput.value;
          apply(true);
        }
      });
    }
    if (els.searchClear) {
      els.searchClear.addEventListener("click", function () {
        els.searchInput.value = "";
        state.q = "";
        state.page = 1;
        apply(true);
      });
    }

    // Every control inside the filter panel maps to a state key by name
    if (els.form) {
      els.form.addEventListener("change", function (event) {
        var field = event.target;
        if (!field.name || !(field.name in state)) return;
        if (field.type === "radio") {
          if (!field.checked) return;
          state[field.name] = field.value;
        } else {
          state[field.name] = field.value;
        }
        if (field.name === "beds" || field.name === "baths") {
          // pill radios behave like a toggle when re-clicked
        }
        state.page = 1;
        updateFilterBadge();
        apply();
      });

      els.form.addEventListener("submit", function (event) { event.preventDefault(); });

      els.form.addEventListener("reset", function (event) {
        event.preventDefault();
        clearAll();
      });
    }

    // Sorting
    if (els.sortSelect) {
      els.sortSelect.addEventListener("change", function () {
        state.sort = els.sortSelect.value;
        state.page = 1;
        apply(true);
      });
    }

    // Quick chips above the grid (All / For Sale / Apartments …)
    document.querySelectorAll("[data-preset]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var preset = chip.getAttribute("data-preset");
        state.status = "Any";
        state.type = "Any";
        if (preset === "sale" || preset === "rent") state.status = preset === "sale" ? "Sale" : "Rent";
        else if (preset !== "all") state.type = preset;
        state.page = 1;

        document.querySelectorAll("[data-preset]").forEach(function (other) {
          other.classList.toggle("is-active", other === chip);
        });

        syncFormFromState();
        apply(true);
      });
    });

    // Pagination + chip removal (delegated)
    if (els.pagination) {
      els.pagination.addEventListener("click", function (event) {
        var button = event.target.closest("button[data-page]");
        if (!button || button.disabled) return;
        state.page = Math.max(1, Number(button.getAttribute("data-page")));
        renderGrid(results());
        var top = els.results.getBoundingClientRect().top + window.pageYOffset - 140;
        window.scrollTo({ top: top, behavior: "smooth" });
      });
    }

    document.addEventListener("click", function (event) {
      var chip = event.target.closest("[data-clear-filter]");
      if (chip) {
        var key = chip.getAttribute("data-clear-filter");
        state[key] = key === "status" ? "Any" : "";
        state.page = 1;
        syncFormFromState();
        apply(true);
        return;
      }
      if (event.target.closest("[data-clear-all]")) clearAll();
    });

    // Mobile: show / hide the filter panel
    if (els.filterToggle) {
      els.filterToggle.addEventListener("click", function () {
        var open = els.panel.classList.toggle("is-open");
        els.filterToggle.setAttribute("aria-expanded", String(open));
        els.panel.setAttribute("aria-hidden", String(!open));
        if (open) {
          var top = els.panel.getBoundingClientRect().top + window.pageYOffset - 100;
          window.scrollTo({ top: top, behavior: "smooth" });
        }
      });
    }
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    els.grid = document.getElementById("results-grid");
    if (!els.grid) return; // not the listings page

    els.results = document.getElementById("results");
    els.count = document.getElementById("results-count");
    els.summary = document.getElementById("results-summary");
    els.empty = document.getElementById("results-empty");
    els.emptyQuery = document.getElementById("results-empty-query");
    els.pagination = document.getElementById("results-pagination");
    els.activeFilters = document.getElementById("active-filters");
    els.form = document.getElementById("filters-form");
    els.panel = document.getElementById("filters-panel");
    els.filterToggle = document.getElementById("filters-toggle");
    els.filterToggleBadge = document.getElementById("filters-toggle-badge");
    els.sortSelect = document.getElementById("sort-select");
    els.searchInput = document.getElementById("search-input");
    els.searchClear = document.getElementById("search-clear");

    // location suggestions for the search field
    var datalist = document.getElementById("listings-areas");
    if (datalist) {
      datalist.innerHTML = Data.getAreas().map(function (area) {
        return "<option value='" + area + "'></option>";
      }).join("");
    }

    readUrl();
    syncFormFromState();
    bindEvents();
    renderGrid(results());

    // Reflect URL-driven presets on the quick chips
    document.querySelectorAll("[data-preset]").forEach(function (chip) {
      var preset = chip.getAttribute("data-preset");
      var active = (preset === "all" && state.status === "Any" && state.type === "Any") ||
        (preset === "sale" && state.status === "Sale") ||
        (preset === "rent" && state.status === "Rent") ||
        (preset === state.type);
      chip.classList.toggle("is-active", active);
    });
  });
})(window, document);
