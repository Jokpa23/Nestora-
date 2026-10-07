/* ==========================================================================
   NESTORA — js/home.js
   --------------------------------------------------------------------------
   Home page only:
     • renders the "Featured Properties" grid from the shared data source
     • wires the All / For Sale / For Rent tabs with a soft cross-fade
   ========================================================================== */

(function (window, document) {
  "use strict";

  var Data = window.NestoraData;

  var state = { tab: "all" };

  /**
   * The rail always leads with our featured listings, then falls back to the
   * most viewed ones — so every tab (including "For Rent") has content.
   */
  function featuredList() {
    return Data.properties
      .filter(function (property) {
        if (state.tab === "sale") return property.status === "Sale";
        if (state.tab === "rent") return property.status === "Rent";
        return true;
      })
      .sort(function (a, b) {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.views - a.views;
      })
      .slice(0, 6);
  }

  function render(grid) {
    grid.style.opacity = "0";
    grid.style.transition = "opacity .28s ease";

    window.setTimeout(function () {
      grid.innerHTML = featuredList().map(function (property) {
        return Data.propertyCard(property, { eager: grid.dataset.eager === "true" });
      }).join("");
      grid.style.opacity = "1";
      window.NestoraFavorites.sync();
      document.dispatchEvent(new CustomEvent("nestora:content-rendered", { detail: { root: grid } }));
    }, 190);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.getElementById("featured-grid");
    if (!grid) return; // not the home page

    var tabs = document.querySelectorAll("[data-featured-tab]");

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        state.tab = tab.getAttribute("data-featured-tab");
        tabs.forEach(function (other) {
          var active = other === tab;
          other.classList.toggle("is-active", active);
          other.setAttribute("aria-selected", String(active));
        });
        render(grid);
      });
    });

    render(grid);
  });
})(window, document);
