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
      var on = parseInt(b.dataset.font, 10) === state.font;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    ['contrast', 'links', 'nomotion'].forEach(function (k) {
      var b = document.querySelector('[data-toggle="' + k + '"]');
      if (b) { b.classList.toggle('active', !!state[k]); b.setAttribute('aria-pressed', state[k] ? 'true' : 'false'); }
    });
  }

  // "דלג לתוכן הראשי" — קישור נגישות ראשון בעמוד (WCAG 2.4.1)
  function buildSkipLink() {
    var main = document.querySelector('main');
    var id = main ? (main.id || (main.id = 'main-content')) : 'main-content';
    var skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#' + id;
    skip.textContent = 'דלג לתוכן הראשי';
    skip.addEventListener('click', function (e) {
      var m = document.getElementById(id);
      if (m) { e.preventDefault(); m.setAttribute('tabindex', '-1'); m.focus(); m.scrollIntoView(); }
    });
    document.body.insertBefore(skip, document.body.firstChild);
  }

  function build() {
    buildSkipLink();

    // WhatsApp FAB
    var wa = document.createElement('a');
    wa.className = 'wa-float'; wa.href = WA; wa.target = '_blank'; wa.rel = 'noopener';
    wa.setAttribute('aria-label', 'שיחת וואטסאפ עם הישיבה'); wa.innerHTML = WA_SVG;
    document.body.appendChild(wa);

    // Accessibility FAB + panel
    var fab = document.createElement('button');
    fab.className = 'a11y-fab'; fab.type = 'button';
    fab.setAttribute('aria-label', 'פתיחת תפריט נגישות'); fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-haspopup', 'dialog'); fab.setAttribute('aria-controls', 'a11y-panel');
    fab.innerHTML = A11Y_SVG;
    document.body.appendChild(fab);

    var panel = document.createElement('div');
    panel.className = 'a11y-panel'; panel.id = 'a11y-panel'; panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-labelledby', 'a11y-title');
    panel.innerHTML =
      '<h4 id="a11y-title">תפריט נגישות</h4>' +
      '<div class="a11y-row" role="group" aria-label="גודל טקסט">' +
      '<button class="a11y-btn" data-font="0" type="button" aria-pressed="false">רגיל</button>' +
      '<button class="a11y-btn" data-font="1" type="button" aria-pressed="false">טקסט גדול</button>' +
      '<button class="a11y-btn" data-font="2" type="button" aria-pressed="false">ענק</button></div>' +
      '<div class="a11y-row"><button class="a11y-btn" data-toggle="contrast" type="button" aria-pressed="false">ניגודיות גבוהה</button>' +
      '<button class="a11y-btn" data-toggle="links" type="button" aria-pressed="false">הדגשת קישורים</button></div>' +
      '<div class="a11y-row"><button class="a11y-btn" data-toggle="nomotion" type="button" aria-pressed="false">עצירת אנימציות</button>' +
      '<a class="a11y-btn" href="accessibility.html" style="text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center">הצהרת נגישות</a></div>' +
      '<button class="a11y-reset" type="button">איפוס הגדרות</button>';
    document.body.appendChild(panel);

    function openPanel() {
      panel.classList.add('open');
      fab.setAttribute('aria-expanded', 'true');
      var first = panel.querySelector('button, a[href]');
      if (first) first.focus();
    }
    function closePanel(returnFocus) {
      if (!panel.classList.contains('open')) return;
      panel.classList.remove('open');
      fab.setAttribute('aria-expanded', 'false');
      if (returnFocus) fab.focus();
    }

    fab.addEventListener('click', function () {
      if (panel.classList.contains('open')) closePanel(false); else openPanel();
    });
    // סגירה בלחיצה מחוץ לפאנל
    document.addEventListener('click', function (e) {
      if (!panel.contains(e.target) && e.target !== fab && !fab.contains(e.target)) closePanel(false);
    });
    // מקלדת: Escape סוגר ומחזיר focus, Tab נלכד בתוך הפאנל
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); closePanel(true); return; }
      if (e.key === 'Tab') {
        var f = panel.querySelectorAll('button, a[href]');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    panel.querySelectorAll('[data-font]').forEach(function (b) {
      b.addEventListener('click', function () { state.font = parseInt(b.dataset.font, 10); apply(); });
    });
    panel.querySelectorAll('[data-toggle]').forEach(function (b) {
      b.addEventListener('click', function () { var k = b.dataset.toggle; state[k] = !state[k]; apply(); });
    });
    panel.querySelector('.a11y-reset').addEventListener('click', function () {
      state = { font: 0, contrast: false, links: false, nomotion: false }; apply(); closePanel(true);
    });
    syncButtons();
  }

  apply(); // apply saved prefs ASAP (font-size before paint where possible)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
