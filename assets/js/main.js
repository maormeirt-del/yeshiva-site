/* ============================================================
   main.js — ניווט, חשיפה בגלילה, מונים מונפשים, תפריט מובייל, טופס
   ============================================================ */
(function () {
  'use strict';

  // ---- Header scrolled state ----
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 12);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- Mobile nav ----
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('mobile-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') links.classList.remove('mobile-open');
    });
  }

  // ---- Reveal on scroll: מנוהל ב-anim.js ----

  // ---- Animated counters ----
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setCounterFinal(el) {
    var target = parseFloat(el.dataset.count);
    el.childNodes[0].nodeValue = (el.dataset.prefix || '') + target.toLocaleString('he-IL');
    if (el.dataset.suffix) {
      var sp = el.querySelector('.plus') || el.appendChild(Object.assign(document.createElement('span'), { className: 'plus' }));
      sp.textContent = el.dataset.suffix;
    }
  }
  function animateCounter(el) {
    if (reduceMotion) { setCounterFinal(el); return; }
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    var prefix = el.dataset.prefix || '';
    var dur = 1500, start = null;
    // רשת ביטחון: אם rAF לא רץ, ודא ערך סופי
    var fallback = setTimeout(function () { setCounterFinal(el); }, 2200);
    el._cfb = fallback;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round(target * eased);
      el.firstChild ? (el.childNodes[0].nodeValue = prefix + val.toLocaleString('he-IL'))
                    : (el.textContent = prefix + val);
      if (suffix) {
        var sp = el.querySelector('.plus');
        if (!sp) { sp = document.createElement('span'); sp.className = 'plus'; el.appendChild(sp); }
        sp.textContent = suffix;
      }
      if (p < 1) requestAnimationFrame(step);
      else clearTimeout(el._cfb);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCounter(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
    // רשת ביטחון גלובלית: אם IO/rAF לא רצו (טאב מוסתר), ודא ערכים סופיים
    setTimeout(function () {
      counters.forEach(function (el) { if (el.childNodes[0] && /^\s*0\s*$/.test(el.childNodes[0].nodeValue)) setCounterFinal(el); });
    }, 3000);
  }

  // ---- Signup form (demo handler) ----
  var form = document.getElementById('signup-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = form.querySelector('.form-ok');
      form.querySelectorAll('input,select,button').forEach(function (i) { i.disabled = true; });
      if (ok) ok.classList.add('show');
      // לחיבור אמיתי: שליחה ל-Google Form / API כאן.
    });
  }

  // ---- Active nav link by section in view (home) ----
  var navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
  if (navAnchors.length && 'IntersectionObserver' in window) {
    var map = {};
    navAnchors.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = a;
    });
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navAnchors.forEach(function (a) { a.classList.remove('active'); });
          if (map[en.target.id]) map[en.target.id].classList.add('active');
        }
      });
    }, { threshold: 0.5 });
    Object.keys(map).forEach(function (id) { sio.observe(document.getElementById(id)); });
  }

  // ---- Hero video CTA → open modal with sound ----
  document.querySelectorAll('[data-hero-play]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (window.YTGallery) window.YTGallery.open(b.getAttribute('data-hero-play'), false);
    });
  });

  // ---- Footer year ----
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
