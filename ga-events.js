/**
 * ga-events.js
 * Google Analytics event tracking for Chandu & Family celebration pages.
 * Include this AFTER the GA base tag on sindhu.html and yokshith.html.
 *
 * Tracked events:
 *  sindhu.html  → waiting_page_view, birthday_page_view, anniversary_page_view, memory_open, year_navigate
 *  yokshith.html→ waiting_page_view, birthday_page_view, memory_open, year_navigate, confetti_burst
 */

(function() {
  'use strict';

  /* ── Safely call gtag (no-op if GA hasn't loaded yet) ── */
  function gtrack(eventName, params) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, params || {});
    }
  }

  /* ══════════════════════════════════════════
     PATCH sindhu.html functions
  ══════════════════════════════════════════ */
  window.addEventListener('DOMContentLoaded', function() {

    /* ── Detect which page we're on ── */
    const isSindhu   = document.title.toLowerCase().includes('sindhu');
    const isYokshith = document.title.toLowerCase().includes('yokshith');

    /* ─────────────────────────────────────
       SINDHU PAGE PATCHES
    ───────────────────────────────────── */
    if (isSindhu && typeof renderWaiting === 'function') {

      /* Patch renderWaiting */
      const _origWaiting = window.renderWaiting;
      window.renderWaiting = function() {
        gtrack('waiting_page_view', { page: 'sindhu' });
        return _origWaiting.apply(this, arguments);
      };

      /* Patch renderBirthday */
      const _origBirthday = window.renderBirthday;
      window.renderBirthday = function(year, fromWaiting) {
        var BDAY_BIRTH_YEAR = 1994; // Sindhu
        var age = year - BDAY_BIRTH_YEAR;
        gtrack('birthday_page_view', {
          person:       'Sindhu',
          year:         year,
          age:          age,
          from_memory:  !!fromWaiting
        });
        return _origBirthday.apply(this, arguments);
      };

      /* Patch renderAnniversary */
      const _origAnniversary = window.renderAnniversary;
      window.renderAnniversary = function(year, fromWaiting) {
        var ANNIV_START = 2023;
        var yearsMarried = year - ANNIV_START;
        gtrack('anniversary_page_view', {
          person:        'Sindhu',
          year:          year,
          years_married: yearsMarried,
          from_memory:   !!fromWaiting
        });
        return _origAnniversary.apply(this, arguments);
      };

      /* Patch openMemory */
      const _origMemory = window.openMemory;
      window.openMemory = function(type, year) {
        gtrack('memory_open', {
          page:        'sindhu',
          memory_type: type,
          memory_year: year
        });
        return _origMemory.apply(this, arguments);
      };

      /* Track year navigation buttons via event delegation */
      document.addEventListener('click', function(e) {
        var btn = e.target.closest('.yn-btn');
        if (!btn) return;
        var txt = btn.textContent.trim();
        gtrack('year_navigate', {
          page:   'sindhu',
          button: txt.substring(0, 40)
        });
      });
    }

    /* ─────────────────────────────────────
       YOKSHITH PAGE PATCHES
    ───────────────────────────────────── */
    if (isYokshith && typeof renderWaiting === 'function') {

      /* Patch renderWaiting */
      const _origWaiting = window.renderWaiting;
      window.renderWaiting = function() {
        gtrack('waiting_page_view', { page: 'yokshith' });
        return _origWaiting.apply(this, arguments);
      };

      /* Patch renderBirthday */
      const _origBirthday = window.renderBirthday;
      window.renderBirthday = function(year, fromWaiting) {
        var BIRTH_YEAR = 2025; // Yokshith
        var age = year - BIRTH_YEAR;
        gtrack('birthday_page_view', {
          person:      'Yokshith',
          year:        year,
          age:         age,
          from_memory: !!fromWaiting
        });
        return _origBirthday.apply(this, arguments);
      };

      /* Patch burst (confetti button) */
      const _origBurst = window.burst;
      window.burst = function(n) {
        gtrack('confetti_burst', {
          page:             'yokshith',
          particles_count:  n || 140
        });
        return _origBurst.apply(this, arguments);
      };

      /* Track year navigation */
      document.addEventListener('click', function(e) {
        var btn = e.target.closest('.yn-btn');
        if (!btn) return;
        var txt = btn.textContent.trim();
        gtrack('year_navigate', {
          page:   'yokshith',
          button: txt.substring(0, 40)
        });
      });

      /* Track memory card clicks */
      document.addEventListener('click', function(e) {
        var card = e.target.closest('.memory-card');
        if (!card) return;
        var year = card.querySelector('.mc-year');
        var lbl  = card.querySelector('.mc-lbl');
        gtrack('memory_open', {
          page:        'yokshith',
          memory_year: year ? year.textContent : 'unknown',
          memory_label: lbl ? lbl.textContent : ''
        });
      });
    }

  });
})();
