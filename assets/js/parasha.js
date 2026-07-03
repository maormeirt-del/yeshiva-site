/* ============================================================
   parasha.js — פינת "פרשה ופירשה": דברי תורה של תלמידים.
   טוען מ-Supabase (divrei_torah), מציג את האחרון במלואו + קודמים.
   נופל בשקט אם אין חיבור/תוכן.
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

  function byline(p) {
    return '<div class="dt-byline">' +
      '<span class="dt-quill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 4S9 5 5 12c-1.5 2.5-2 6-2 6s3.5-.5 6-2c7-4 8-15 8-15Z"/><path d="M5 19c2-4 5-7 9-9"/></svg></span>' +
      '<div><b>' + esc(p.author || 'תלמיד הישיבה') + '</b>' +
      (p.grade ? '<span>' + esc(p.grade) + '</span>' : '') + '</div>' +
      (p.date ? '<span class="dt-date">' + fmt(p.date) + '</span>' : '') +
      '</div>';
  }

  function featured(p) {
    return '<article class="dt-featured reveal">' +
      '<div class="dt-ribbon"><span class="dt-tag">פרשת ' + esc(p.parasha || '') + '</span><span class="dt-kicker">דבר תורה לפרשה</span></div>' +
      '<h3 class="dt-title">' + esc(p.title) + '</h3>' +
      (p.verse ? '<div class="dt-verse">״' + esc(p.verse) + '״</div>' : '') +
      '<div class="dt-body">' + blocksHtml(p.body) + '</div>' +
      byline(p) +
    '</article>';
  }

  function miniCard(p) {
    return '<button class="dt-mini" type="button" data-dt-open="' + esc(p.slug || p.id) + '">' +
      '<span class="dt-mini-tag">פרשת ' + esc(p.parasha || '') + '</span>' +
      '<span class="dt-mini-title">' + esc(p.title) + '</span>' +
      '<span class="dt-mini-by">' + esc(p.author || '') + (p.grade ? ' · ' + esc(p.grade) : '') + '</span>' +
    '</button>';
  }

  function render(el, list) {
    if (!list.length) { el.innerHTML = '<p class="lead center">בקרוב — דבר התורה הראשון של התלמידים.</p>'; return; }
    var top = list[0], rest = list.slice(1);
    var html = featured(top);
    if (rest.length) {
      html += '<div class="dt-prev"><h4 class="dt-prev-h">דברי תורה קודמים</h4><div class="dt-grid">' +
        rest.map(miniCard).join('') + '</div></div>';
    }
    el.innerHTML = html;

    // מודאל לדברי תורה קודמים
    el.querySelectorAll('[data-dt-open]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = list.filter(function (x) { return (x.slug || x.id) === btn.getAttribute('data-dt-open'); })[0];
        if (p) openModal(p);
      });
    });
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
    m.querySelector('.dt-modal-body').innerHTML = featured(p);
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
    var el = document.querySelector('[data-divrei]');
    if (!el || !window.whenSB) return;
    window.whenSB(function (sb) {
      if (!sb) return;
      sb.from('divrei_torah')
        .select('id,slug,parasha,title,author,grade,verse,body,date,sort_order,published')
        .eq('published', true)
        .order('sort_order', { ascending: false })
        .order('date', { ascending: false })
        .then(function (res) {
          if (res.error) { return; }
          render(el, res.data || []);
        });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
