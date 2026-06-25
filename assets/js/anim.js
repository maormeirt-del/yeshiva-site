/* ============================================================
   anim.js — מושן קליל (T1, CSS בלבד + IntersectionObserver)
   בלי ספריות, בלי גלילה חלקה — מהיר ונייטיב. סגירת loader + reveals.
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Loader (קצר ומהיר) ----------
  function dismissLoader() {
    var l = document.getElementById('loader');
    if (l && !l.classList.contains('done')) l.classList.add('done');
  }
  var loaderEl = document.getElementById('loader');
  if (loaderEl) {
    var skip = loaderEl.querySelector('.loader-skip');
    if (skip) skip.addEventListener('click', dismissLoader);
    var minDelay = reduce ? 0 : 650;
    if (document.readyState === 'complete') setTimeout(dismissLoader, minDelay);
    else window.addEventListener('load', function () { setTimeout(dismissLoader, minDelay); });
    setTimeout(dismissLoader, 2600); // גיבוי קשיח (תמונות חיצוניות לא יעכבו)
  }

  // ---------- Reveal-on-scroll (IntersectionObserver, פעם אחת) ----------
  function setupReveals() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
    // רשת ביטחון — אם IO לא ירה (טאב מוסתר/דפדפן חריג), לחשוף הכול
    setTimeout(function () {
      document.querySelectorAll('.reveal:not(.in)').forEach(function (el) { el.classList.add('in'); });
    }, 2400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupReveals);
  else setupReveals();
})();
