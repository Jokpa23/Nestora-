/* ==========================================================================
   NESTORA — js/favorites.js
   --------------------------------------------------------------------------
   A tiny favourites store built on localStorage.

   Responsibilities
     • persist saved property ids between visits
     • keep every heart button on the page in sync
     • render the favourites.html collection page

   Other modules read/write favourites through window.NestoraFavorites and
   listen for the "nestora:favorites-changed" event.
   ========================================================================== */

(function (window, document) {
  "use strict";

  var STORAGE_KEY = "nestora:favorites:v1";

  /* ---------------------------------------------------------------------
     Storage helpers (defensive: localStorage may be blocked in private mode)
     --------------------------------------------------------------------- */
  function read() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map(Number).filter(function (n) { return !isNaN(n); }) : [];
    } catch (error) {
      return [];
    }
  }

  function write(ids) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
      /* storage unavailable — the UI still works for the current session */
    }
  }

  var ids = read();

  function emit(detail) {
    document.dispatchEvent(new CustomEvent("nestora:favorites-changed", { detail: detail || {} }));
  }

  /* ---------------------------------------------------------------------
     Public store
     --------------------------------------------------------------------- */
  var Favorites = {
    KEY: STORAGE_KEY,

    all: function () {
      return ids.slice();
    },

    count: function () {
      return ids.length;
    },

    has: function (id) {
      return ids.indexOf(Number(id)) !== -1;
    },

    add: function (id) {
      id = Number(id);
      if (isNaN(id) || Favorites.has(id)) return false;
      ids.unshift(id); // most recently saved first
      write(ids);
      emit({ id: id, action: "added", count: ids.length });
      return true;
    },

    remove: function (id) {
      id = Number(id);
      var index = ids.indexOf(id);
      if (index === -1) return false;
      ids.splice(index, 1);
      write(ids);
      emit({ id: id, action: "removed", count: ids.length });
      return true;
    },

    toggle: function (id) {
      return Favorites.has(id) ? (Favorites.remove(id), false) : (Favorites.add(id), true);
    },

    clear: function () {
      ids = [];
      write(ids);
      emit({ action: "cleared", count: 0 });
    },

    /** Force a repaint of every heart + counter (used after dynamic rendering). */
    sync: function () {
      syncHeartButtons();
      syncCounters();
    }
  };

  /* ---------------------------------------------------------------------
     Keep every heart + counter on the page in sync
     --------------------------------------------------------------------- */
  function syncHeartButtons() {
    var buttons = document.querySelectorAll("[data-fav]");
    Array.prototype.forEach.call(buttons, function (button) {
      var id = Number(button.getAttribute("data-fav"));
      var active = Favorites.has(id);
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
      var label = button.getAttribute("aria-label") || "property";
      button.setAttribute("aria-label", (active ? "Remove " : "Save ") + label.replace(/^(Remove|Save) /, ""));
    });
  }

  function syncCounters() {
    var count = Favorites.count();
    var counters = document.querySelectorAll("[data-favorites-count]");
    Array.prototype.forEach.call(counters, function (el) {
      el.textContent = count;
      el.hidden = count === 0;
    });
  }

  document.addEventListener("nestora:favorites-changed", function () {
    syncHeartButtons();
    syncCounters();
  });

  /* ---------------------------------------------------------------------
     favourites.html — render the saved collection
     --------------------------------------------------------------------- */
  function renderFavoritesPage() {
    var grid = document.getElementById("favorites-grid");
    if (!grid) return; // not on the favourites page

    var empty = document.getElementById("favorites-empty");
    var summary = document.getElementById("favorites-summary");
    var clearBtn = document.getElementById("favorites-clear");
    var saved = Favorites.all()
      .map(function (id) { return window.NestoraData.getProperty(id); })
      .filter(Boolean);

    grid.innerHTML = saved.map(function (p) {
      return window.NestoraData.propertyCard(p, { eager: false });
    }).join("");

    var hasItems = saved.length > 0;
    grid.hidden = !hasItems;
    if (empty) empty.hidden = hasItems;
    if (clearBtn) clearBtn.hidden = !hasItems;

    if (summary) {
      var total = saved.reduce(function (sum, p) {
        return sum + (p.status === "Rent" ? p.price * 3 : p.price); // rough indicative mix
      }, 0);
      summary.textContent = hasItems
        ? saved.length + (saved.length === 1 ? " saved property · from " : " saved properties · combined value ") +
          window.NestoraData.formatNaira(saved.reduce(function (s, p) { return s + p.price; }, 0))
        : "No saved properties yet";
      summary.hidden = !hasItems;
      void total;
    }

    // Re-run the reveal observer for freshly injected cards
    document.dispatchEvent(new CustomEvent("nestora:content-rendered", { detail: { root: grid } }));
  }

  document.addEventListener("nestora:favorites-changed", function () {
    if (document.getElementById("favorites-grid")) renderFavoritesPage();
  });

  document.addEventListener("DOMContentLoaded", function () {
    syncHeartButtons();
    syncCounters();

    var clearBtn = document.getElementById("favorites-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (!Favorites.count()) return;
        Favorites.clear();
        window.NestoraToast && window.NestoraToast.show({
          title: "Favourites cleared",
          text: "All saved properties were removed from this browser.",
          variant: "info"
        });
      });
    }

    renderFavoritesPage();
  });

  window.NestoraFavorites = Favorites;
})(window, document);
