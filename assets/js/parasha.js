/* ============================================================
   parasha.js — פינת "פרשה ופירשה": דברי תורה של תלמידים.
   בסגנון פינת המאמרים: כרטיסים בדף הבית + דף מלא (parasha.html).
   לחיצה על כרטיס פותחת את דבר התורה המלא במודאל (כרטיס-מגילה).
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
    return isNaN(dt) ? '' : dt.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  function blocksHtml(body) {
    return (Array.isArray(body) ? body : []).map(function (b) {
      var t = esc(b.text);
      switch (b.type) {
        case 'h2':     return '<h3 class="dt-h">' + t + '</h3>';
        case 'quote':  return '<blockquote class="dt-quote">' + t + '</blockquote>';
        case 'source': return '<div class="dt-source"><b>מקורות:</b> ' + t + '</div>';
        default:       return '<p>' + t + '</p>';
      }
    }).join('');
  }

  // כרטיס בסגנון article-card (לדף הבית ולדף המלא)
  function card(p) {
    var key = esc(p.slug || p.id);
    return '<article class="article-card">' +
      '<a class="stretch" href="parasha.html" data-dt-open="' + key + '" aria-label="' + esc(p.title) + '"></a>' +
      '<div class="cover"><span class="parasha-tag">פרשת ' + esc(p.parasha || '') + '</span>' + (p.video_id ? '<span class="parasha-vid">▶ עם סרטון</span>' : '') + '</div>' +
      '<div class="body">' +
        '<div class="meta"><span>✍️ ' + esc(p.author || 'תלמיד הישיבה') + '</span>' + (p.grade ? '<span>' + esc(p.grade) + '</span>' : '') + '</div>' +
        '<h3>' + esc(p.title) + '</h3>' +
        (p.excerpt ? '<p>' + esc(p.excerpt) + '</p>' : '') +
        '<span class="read">קראו את דבר התורה <span class="arr">←</span></span>' +
      '</div>' +
    '</article>';
  }

  // תצוגה מלאה (מגילה) — למודאל ולדף פריט
  function full(p) {
    return '<article class="dt-featured">' +
      '<div class="dt-ribbon"><span class="dt-tag">פרשת ' + esc(p.parasha || '') + '</span><span class="dt-kicker">דבר תורה לפרשה</span></div>' +
      '<h3 class="dt-title">' + esc(p.title) + '</h3>' +
      (p.verse ? '<div class="dt-verse">״' + esc(p.verse) + '״</div>' : '') +
      (p.video_id ? '<div class="dt-vid"><iframe loading="lazy" src="https://www.youtube.com/embed/' + esc(p.video_id) + '" title="' + esc(p.title) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>' : '') +
      '<div class="dt-body">' + blocksHtml(p.body) + '</div>' +
      '<div class="dt-byline">' +
        '<span class="dt-quill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 4S9 5 5 12c-1.5 2.5-2 6-2 6s3.5-.5 6-2c7-4 8-15 8-15Z"/><path d="M5 19c2-4 5-7 9-9"/></svg></span>' +
        '<div><b>' + esc(p.author || 'תלמיד הישיבה') + '</b>' + (p.grade ? '<span>' + esc(p.grade) + '</span>' : '') + '</div>' +
        (p.date ? '<span class="dt-date">' + fmt(p.date) + '</span>' : '') +
      '</div>' +
    '</article>';
  }

  function wireCards(scope, list) {
    scope.querySelectorAll('[data-dt-open]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var p = list.filter(function (x) { return (x.slug || x.id) === a.getAttribute('data-dt-open'); })[0];
        if (p) openModal(p);
      });
    });
  }

  function renderCards(el, list) {
    if (!list.length) { el.innerHTML = '<p class="lead center">בקרוב — דבר התורה הראשון של התלמידים.</p>'; return; }
    el.innerHTML = '<div class="articles-grid">' + list.map(card).join('') + '</div>';
    wireCards(el, list);
  }

  function openModal(p) {
    var m = document.getElementById('dtModal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'dtModal'; m.className = 'dt-modal';
      m.innerHTML = '<div class="dt-modal-inner"><button class="dt-modal-close" aria-label="סגירה">×</button><div class="dt-modal-body"></div></div>';
      document.body.appendChild(m);
      m.addEventListener('click', function (e) { if (e.target === m) closeModal(); });
      m.querySelector('.dt-modal-close').addEventListener('click', closeModal);
    }
    m.querySelector('.dt-modal-body').innerHTML = full(p);
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    var m = document.getElementById('dtModal');
    if (m) m.classList.remove('open');
    document.body.style.overflow = '';
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  function boot() {
    var home = document.querySelector('[data-divrei]');       // דף הבית (עד 3)
    var all = document.querySelector('[data-divrei-all]');    // parasha.html (הכול)
    if ((!home && !all) || !window.whenSB) return;
    window.whenSB(function (sb) {
      if (!sb) return;
      sb.from('divrei_torah')
        .select('id,slug,parasha,title,author,grade,verse,video_id,excerpt,body,date,sort_order,published')
        .eq('published', true)
        .order('sort_order', { ascending: false })
        .order('date', { ascending: false })
        .then(function (res) {
          if (res.error) return;
          var list = res.data || [];
          if (home) renderCards(home, list.slice(0, 3));
          if (all) renderCards(all, list);
          // פתיחה ישירה לפי ?read=slug
          var m = location.search.match(/[?&]read=([^&]+)/);
          if (m) {
            var p = list.filter(function (x) { return (x.slug || x.id) === decodeURIComponent(m[1]); })[0];
            if (p) openModal(p);
          }
        });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
