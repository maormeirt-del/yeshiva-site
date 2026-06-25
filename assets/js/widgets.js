/* ============================================================
   widgets.js — כפתור וואטסאפ צף + רכיב נגישות (תפריט + מנוע)
   מוזרק לכל עמוד. שומר העדפות ב-localStorage.
   ============================================================ */
(function () {
  'use strict';
  var WA = 'https://wa.me/972542390375';
  var FONTS = ['100%', '113%', '126%'];
  var root = document.documentElement;

  var WA_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 .9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.2.1.4.1.6-.1l.7-.9c.2-.2.4-.2.6-.1l1.9.9c.3.1.4.2.5.3.1.2.1.7-.1 1.2Z"/></svg>';
  var A11Y_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="3.8" r="2"/><path d="M21 8.5c0 .7-.6 1.2-1.3 1.1L15 9v3l1.9 6.4a1.2 1.2 0 0 1-2.3.7L13 14h-2l-1.6 5.1a1.2 1.2 0 0 1-2.3-.7L9 12V9l-4.7.6A1.2 1.2 0 0 1 3 8.5C3 7.8 3.6 7.3 4.3 7.4L12 8.4l7.7-1c.7-.1 1.3.4 1.3 1.1Z"/></svg>';

  var state = { font: 0, contrast: false, links: false, nomotion: false };
  try { state = Object.assign(state, JSON.parse(localStorage.getItem('a11y') || '{}')); } catch (e) {}

  function apply() {
    root.style.fontSize = FONTS[state.font] || FONTS[0];
    root.classList.toggle('a11y-contrast', !!state.contrast);
    root.classList.toggle('a11y-links', !!state.links);
    root.classList.toggle('a11y-nomotion', !!state.nomotion);
    try { localStorage.setItem('a11y', JSON.stringify(state)); } catch (e) {}
    syncButtons();
  }
  function syncButtons() {
    document.querySelectorAll('[data-font]').forEach(function (b) {
      b.classList.toggle('active', parseInt(b.dataset.font, 10) === state.font);
    });
    ['contrast', 'links', 'nomotion'].forEach(function (k) {
      var b = document.querySelector('[data-toggle="' + k + '"]');
      if (b) b.classList.toggle('active', !!state[k]);
    });
  }

  function build() {
    // WhatsApp FAB
    var wa = document.createElement('a');
    wa.className = 'wa-float'; wa.href = WA; wa.target = '_blank'; wa.rel = 'noopener';
    wa.setAttribute('aria-label', 'שיחת וואטסאפ עם הישיבה'); wa.innerHTML = WA_SVG;
    document.body.appendChild(wa);

    // Accessibility FAB + panel
    var fab = document.createElement('button');
    fab.className = 'a11y-fab'; fab.type = 'button';
    fab.setAttribute('aria-label', 'פתיחת תפריט נגישות'); fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = A11Y_SVG;
    document.body.appendChild(fab);

    var panel = document.createElement('div');
    panel.className = 'a11y-panel'; panel.id = 'a11y-panel'; panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'הגדרות נגישות');
    panel.innerHTML =
      '<h4>תפריט נגישות</h4>' +
      '<div class="a11y-row"><button class="a11y-btn" data-font="0" type="button">רגיל</button>' +
      '<button class="a11y-btn" data-font="1" type="button">טקסט גדול</button>' +
      '<button class="a11y-btn" data-font="2" type="button">ענק</button></div>' +
      '<div class="a11y-row"><button class="a11y-btn" data-toggle="contrast" type="button">ניגודיות גבוהה</button>' +
      '<button class="a11y-btn" data-toggle="links" type="button">הדגשת קישורים</button></div>' +
      '<div class="a11y-row"><button class="a11y-btn" data-toggle="nomotion" type="button">עצירת אנימציות</button>' +
      '<a class="a11y-btn" href="accessibility.html" style="text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center">הצהרת נגישות</a></div>' +
      '<button class="a11y-reset" type="button">איפוס הגדרות</button>';
    document.body.appendChild(panel);

    fab.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!panel.contains(e.target) && e.target !== fab && !fab.contains(e.target)) panel.classList.remove('open');
    });
    panel.querySelectorAll('[data-font]').forEach(function (b) {
      b.addEventListener('click', function () { state.font = parseInt(b.dataset.font, 10); apply(); });
    });
    panel.querySelectorAll('[data-toggle]').forEach(function (b) {
      b.addEventListener('click', function () { var k = b.dataset.toggle; state[k] = !state[k]; apply(); });
    });
    panel.querySelector('.a11y-reset').addEventListener('click', function () {
      state = { font: 0, contrast: false, links: false, nomotion: false }; apply(); panel.classList.remove('open');
    });
    syncButtons();
  }

  apply(); // apply saved prefs ASAP (font-size before paint where possible)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
