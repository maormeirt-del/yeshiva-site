(function () {
  'use strict';

  var isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !window.MSStream;

  /* ---------- רישום Service Worker + באנר עדכון גרסה ---------- */
  function initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').then(function (reg) {
      // כבר יש worker ממתין מרענון קודם (למשל נפתח טאב ישן)
      if (reg.waiting) showUpdateBanner(reg);

      reg.addEventListener('updatefound', function () {
        var newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', function () {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner(reg);
          }
        });
      });
    }).catch(function () {});

    // ברגע שה-SW החדש השתלט בפועל — לרענן פעם אחת בלבד
    var refreshed = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (refreshed) return;
      refreshed = true;
      window.location.reload();
    });
  }

  function showUpdateBanner(reg) {
    var banner = document.getElementById('pwa-update-banner');
    if (!banner) return;
    banner.hidden = false;
    banner.classList.add('is-visible');

    // הבאנר קבוע (fixed) כדי שיישאר גלוי גם אם המשתמש גלל למטה —
    // לכן דוחפים את שאר הדף למטה בגובה שלו (וגם את ה-sticky header, שלא ייתקע מתחת לבאנר).
    // נמדד ישירות (לא ב-requestAnimationFrame, שנתקע ללא הגבלה בטאבים ברקע) + ResizeObserver לסנכרון מתמשך.
    var header = document.querySelector('.site-header');
    function applyHeight(h) {
      document.body.style.paddingTop = h;
      if (header) header.style.top = h;
    }
    applyHeight(banner.getBoundingClientRect().height + 'px');
    var ro = new ResizeObserver(function (entries) {
      var height = entries[0] && entries[0].contentRect && entries[0].contentRect.height;
      if (height != null) applyHeight(height + 'px');
    });
    ro.observe(banner);

    var btn = document.getElementById('pwa-update-reload');
    if (btn) {
      btn.addEventListener('click', function () {
        var waiting = reg.waiting || (reg.installing);
        if (waiting) waiting.postMessage('SKIP_WAITING');
        banner.classList.remove('is-visible');
      }, { once: true });
    }
  }

  /* ---------- כפתור התקנה ---------- */
  var deferredPrompt = null;

  function initInstallButton() {
    var btn = document.getElementById('pwa-install-btn');
    if (!btn || isStandalone) return;

    if (isIOS) {
      // באייפון אין beforeinstallprompt — מציגים הוראה במקום
      btn.hidden = false;
      btn.addEventListener('click', openIOSInstructions);
      return;
    }

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      btn.hidden = false;
    });

    btn.addEventListener('click', function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        deferredPrompt = null;
        btn.hidden = true;
      });
    });

    window.addEventListener('appinstalled', function () {
      btn.hidden = true;
    });
  }

  function openIOSInstructions() {
    var modal = document.getElementById('pwa-ios-modal');
    if (!modal) return;
    modal.hidden = false;
    modal.classList.add('is-visible');
  }

  function initIOSModalClose() {
    var modal = document.getElementById('pwa-ios-modal');
    if (!modal) return;
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.closest('[data-pwa-close]')) {
        modal.classList.remove('is-visible');
        modal.hidden = true;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initServiceWorker();
    initInstallButton();
    initIOSModalClose();
  });
})();
