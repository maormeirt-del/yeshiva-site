/* ============================================================
   updates.js — טוען את content/updates.json ומרנדר כרטיסי חדשות
   לכל אלמנט עם data-updates. limit אופציונלי. full=1 לעמוד מלא.
   ============================================================ */
(function () {
  'use strict';

  function esc(s) {
    return (s || '').replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function fmt(d) {
    if (!d) return '';
    var dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  function cover(p) {
    if (p.image) return p.image;
    if (p.videoId) return 'https://i.ytimg.com/vi/' + p.videoId + '/hqdefault.jpg';
    return '';
  }

  function card(p, full) {
    var c = cover(p);
    var bodyHtml = '';
    if (full && Array.isArray(p.body)) {
      bodyHtml = p.body.map(function (par) { return '<p>' + esc(par) + '</p>'; }).join('');
    }
    var art = document.createElement('article');
    art.className = 'news-card reveal';
    art.innerHTML =
      (c ? '<div class="cover">' + (p.videoId
            ? '<a href="https://www.youtube.com/watch?v=' + p.videoId + '" role="button" aria-label="צפייה בסרטון" data-yt-open="' + p.videoId + '"><img loading="lazy" src="' + c + '" alt="' + esc(p.title) + '"></a>'
            : '<img loading="lazy" src="' + c + '" alt="' + esc(p.title) + '">') + '</div>' : '') +
      '<div class="body">' +
        '<span class="meta"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' + fmt(p.date) + '</span>' +
        '<h3>' + esc(p.title) + '</h3>' +
        (full ? bodyHtml : '<p>' + esc(p.excerpt || '') + '</p>') +
        (!full ? '<a class="read link-more" href="updates.html">קראו עוד <span class="arr">←</span></a>' : '') +
      '</div>';
    return art;
  }

  function render(el, posts) {
    var limit = parseInt(el.dataset.limit || '0', 10);
    var full = el.dataset.full === '1';
    var list = limit ? posts.slice(0, limit) : posts;
    el.innerHTML = '';
    if (!list.length) { el.innerHTML = '<p class="lead">עדכונים יפורסמו כאן בקרוב.</p>'; return; }
    list.forEach(function (p) { el.appendChild(card(p, full)); });
    // חיבור פתיחת וידאו אם YTGallery זמין
    el.querySelectorAll('[data-yt-open]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (window.YTGallery) { e.preventDefault(); window.YTGallery.open(a.dataset.ytOpen, false); }
      });
    });
    // הפעלת reveal על הכרטיסים החדשים
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { threshold: 0.1 });
      el.querySelectorAll('.reveal').forEach(function (r) { io.observe(r); });
    } else {
      el.querySelectorAll('.reveal').forEach(function (r) { r.classList.add('in'); });
    }
  }

  // ממפה רשומת DB לצורת הפוסט שהרנדר מכיר
  function fromDB(row) {
    return {
      title: row.title,
      date: row.date,
      videoId: row.video_id || null,
      image: row.image || null,
      excerpt: row.excerpt || '',
      body: Array.isArray(row.body) ? row.body : []
    };
  }

  function renderAll(els, posts) {
    els.forEach(function (el) { render(el, posts); });
  }

  // גיבוי: קריאה מקובץ ה-JSON הסטטי
  function loadFromJSON(els) {
    fetch('content/updates.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (data) { renderAll(els, (data && data.posts) || []); })
      .catch(function () {
        els.forEach(function (el) { el.innerHTML = '<p class="lead">עדכונים יפורסמו כאן בקרוב.</p>'; });
      });
  }

  function init() {
    var els = document.querySelectorAll('[data-updates]');
    if (!els.length) return;

    // מקור ראשי: Supabase. אם לא זמין / נכשל — נופלים ל-JSON.
    if (typeof window.whenSB === 'function') {
      window.whenSB(function (sb) {
        if (!sb) return loadFromJSON(els);
        sb.from('updates')
          .select('title,date,video_id,image,excerpt,body,sort_order')
          .eq('published', true)
          .order('sort_order', { ascending: false })
          .order('date', { ascending: false })
          .then(function (res) {
            if (res.error || !res.data) return loadFromJSON(els);
            renderAll(els, res.data.map(fromDB));
          });
      });
    } else {
      loadFromJSON(els);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
