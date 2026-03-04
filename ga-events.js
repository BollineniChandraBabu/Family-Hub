/**
 * ga-events.js
 * Global Google Analytics event tracking for all Family-Hub HTML pages.
 */

(function () {
  'use strict';

  var GA_ID = 'G-7X8J9M550J';
  var PAGE = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var PAGE_KEY = PAGE.replace('.html', '') || 'index';

  window.dataLayer = window.dataLayer || [];

  function ensureGtag() {
    if (typeof window.gtag !== 'function') {
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', GA_ID);
    }
  }

  ensureGtag();

  function pushEvent(eventName, params) {
    var payload = Object.assign({
      page_name: PAGE,
      page_key: PAGE_KEY,
      event_timestamp: new Date().toISOString()
    }, params || {});

    window.dataLayer.push({
      event: eventName,
      event_params: payload
    });

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }
  }

  // Capture every GA event called through gtag('event', ...)
  if (!window.__gaEventsWrapped) {
    var rawGtag = window.gtag;
    window.gtag = function wrappedGtag() {
      var args = Array.prototype.slice.call(arguments);
      if (args[0] === 'event' && typeof args[1] === 'string') {
        window.dataLayer.push({
          event: 'captured_event',
          captured_name: args[1],
          captured_params: args[2] || {},
          captured_page: PAGE,
          captured_at: new Date().toISOString()
        });
      }
      return rawGtag.apply(this, args);
    };
    window.__gaEventsWrapped = true;
  }

  window.trackFamilyHubEvent = pushEvent;

  document.addEventListener('DOMContentLoaded', function () {
    pushEvent('page_ready', { title: document.title });

    document.addEventListener('click', function (event) {
      var el = event.target.closest('a,button,[onclick]');
      if (!el) return;
      var text = (el.textContent || '').trim().slice(0, 80);
      pushEvent('ui_click', {
        element_tag: el.tagName.toLowerCase(),
        element_text: text,
        element_id: el.id || '',
        element_class: (el.className || '').toString().slice(0, 120)
      });
      if (el.classList && el.classList.contains('yn-btn')) {
        pushEvent('year_navigate', { button: text });
      }
    }, true);

    document.addEventListener('submit', function (event) {
      var form = event.target;
      pushEvent('form_submit', {
        form_id: form.id || '',
        form_action: form.getAttribute('action') || ''
      });
    }, true);

    // Existing page-specific hooks
    var isSindhu = PAGE === 'sindhu.html';
    var isYokshith = PAGE === 'yokshith.html';

    if (isSindhu && typeof window.renderWaiting === 'function') {
      var oldSindhuWaiting = window.renderWaiting;
      window.renderWaiting = function () {
        pushEvent('waiting_page_view', { person: 'Sindhu' });
        return oldSindhuWaiting.apply(this, arguments);
      };

      if (typeof window.renderBirthday === 'function') {
        var oldSindhuBirthday = window.renderBirthday;
        window.renderBirthday = function (year, fromWaiting) {
          pushEvent('birthday_page_view', {
            person: 'Sindhu',
            year: year,
            from_memory: !!fromWaiting
          });
          return oldSindhuBirthday.apply(this, arguments);
        };
      }

      if (typeof window.renderAnniversary === 'function') {
        var oldSindhuAnniversary = window.renderAnniversary;
        window.renderAnniversary = function (year, fromWaiting) {
          pushEvent('anniversary_page_view', {
            person: 'Sindhu',
            year: year,
            from_memory: !!fromWaiting
          });
          return oldSindhuAnniversary.apply(this, arguments);
        };
      }

      if (typeof window.openMemory === 'function') {
        var oldSindhuMemory = window.openMemory;
        window.openMemory = function (type, year) {
          pushEvent('memory_open', {
            person: 'Sindhu',
            memory_type: type,
            memory_year: year
          });
          return oldSindhuMemory.apply(this, arguments);
        };
      }
    }

    if (isYokshith && typeof window.renderWaiting === 'function') {
      var oldYokshithWaiting = window.renderWaiting;
      window.renderWaiting = function () {
        pushEvent('waiting_page_view', { person: 'Yokshith' });
        return oldYokshithWaiting.apply(this, arguments);
      };

      if (typeof window.renderBirthday === 'function') {
        var oldYokshithBirthday = window.renderBirthday;
        window.renderBirthday = function (year, fromWaiting) {
          pushEvent('birthday_page_view', {
            person: 'Yokshith',
            year: year,
            from_memory: !!fromWaiting
          });
          return oldYokshithBirthday.apply(this, arguments);
        };
      }

      if (typeof window.burst === 'function') {
        var oldBurst = window.burst;
        window.burst = function (count) {
          pushEvent('confetti_burst', { particles_count: count || 140 });
          return oldBurst.apply(this, arguments);
        };
      }

      document.addEventListener('click', function (event) {
        var card = event.target.closest('.memory-card');
        if (!card) return;
        var year = card.querySelector('.mc-year');
        pushEvent('memory_open', {
          person: 'Yokshith',
          memory_year: year ? year.textContent.trim() : 'unknown'
        });
      });
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      pushEvent('page_hidden');
    }
  });
})();
