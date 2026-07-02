/* ============================================================
   articles.js — אזור המאמרים התורניים.
   [data-articles]        → רשימת כרטיסים (data-limit אופציונלי)
   [data-article-single]  → דף מאמר בודד לפי ?slug=
   הבלוקים ב-body: {type:'p'|'h2'|'quote'|'source', text}
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
    return isNaN(dt) ? d : dt.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  function cover(a) {
    if (a.video_id) return 'https://i.ytimg.com/vi/' + a.video_id + '/hqdefault.jpg';
    return '';
  }

  /* ---------- רשימת מאמרים ---------- */
  function card(a) {
    var el = document.createElement('article');
    el.className = 'article-card reveal';
    var c = cover(a);
    el.innerHTML =
      '<div class="cover">' +
        (a.parasha ? '<span class="parasha-tag">' + esc(a.parasha) + '</span>' : '') +
        (c ? '<img loading="lazy" src="' + c + '" alt="' + esc(a.title) + '">' : '') +
      '</div>' +
      '<div class="body">' +
        '<div class="meta"><span>' + fmt(a.date) + '</span>' + (a.read_min ? '<span>· ' + a.read_min + ' דק׳ קריאה</span>' : '') + '</div>' +
        '<h3>' + esc(a.title) + '</h3>' +
        (a.subtitle ? '<div class="sub">' + esc(a.subtitle) + '</div>' : '') +
        '<p>' + esc(a.excerpt || '') + '</p>' +
        '<a class="read stretch" href="article.html?slug=' + encodeURIComponent(a.slug) + '">לקריאת המאמר <span class="arr">←</span></a>' +
      '</div>';
    return el;
  }

  /* --- מצב מובלט לדף הבית: מאמר ראשי גדול + כרטיסים קטנים לצידו --- */
  function featMain(a) {
    var el = document.createElement('article');
    el.className = 'feat-main reveal';
    var c = cover(a);
    el.innerHTML =
      (c ? '<img loading="lazy" src="' + c + '" alt="">' : '') +
      '<div class="fm-body">' +
        (a.parasha ? '<span class="parasha-tag">' + esc(a.parasha) + '</span>' : '') +
        '<h3>' + esc(a.title) + '</h3>' +
        (a.subtitle ? '<div class="sub">' + esc(a.subtitle) + '</div>' : '') +
        '<p class="ex">' + esc(a.excerpt || '') + '</p>' +
        '<div class="meta"><span>' + fmt(a.date) + '</span>' + (a.read_min ? '<span>' + a.read_min + ' דק׳ קריאה</span>' : '') + '</div>' +
        '<a class="read stretch" href="article.html?slug=' + encodeURIComponent(a.slug) + '">לקריאת המאמר <span class="arr">←</span></a>' +
      '</div>';
    return el;
  }
  function featCard(a, delay) {
    var el = document.createElement('article');
    el.className = 'feat-card reveal' + (delay ? ' d' + delay : '');
    var c = cover(a);
    el.innerHTML =
      '<div class="thumb">' + (c ? '<img loading="lazy" src="' + c + '" alt="">' : '') + '</div>' +
      '<div class="fc-body">' +
        (a.parasha ? '<div class="parasha">' + esc(a.parasha) + '</div>' : '') +
        '<h4>' + esc(a.title) + '</h4>' +
        '<div class="meta">' + fmt(a.date) + (a.read_min ? ' · ' + a.read_min + ' דק׳' : '') + '</div>' +
      '</div>' +
      '<a class="stretch" href="article.html?slug=' + encodeURIComponent(a.slug) + '" aria-label="' + esc(a.title) + '"></a>';
    return el;
  }
  function renderFeatured(el, items) {
    el.innerHTML = '';
    if (!items.length) { el.innerHTML = '<p class="lead" style="color:#d6e4f3">מאמרים יפורסמו כאן בקרוב, בעזרת ה׳.</p>'; return; }
    el.appendChild(featMain(items[0]));
    if (items.length > 1) {
      var side = document.createElement('div');
      side.className = 'feat-side';
      items.slice(1).forEach(function (a, i) { side.appendChild(featCard(a, i + 1)); });
      el.appendChild(side);
    }
    revealAll(el);
  }

  function renderList(el, items) {
    var limit = parseInt(el.dataset.limit || '0', 10);
    var list = limit ? items.slice(0, limit) : items;
    if (el.dataset.featured === '1') { renderFeatured(el, list); return; }
    el.innerHTML = '';
    if (!list.length) { el.innerHTML = '<p class="lead">מאמרים יפורסמו כאן בקרוב, בעזרת ה׳.</p>'; return; }
    list.forEach(function (a) { el.appendChild(card(a)); });
    revealAll(el);
  }

  /* ---------- מאמר בודד ---------- */
  function block(b) {
    switch (b.type) {
      case 'h2':     return '<h2>' + esc(b.text) + '</h2>';
      case 'quote':  return '<blockquote>' + esc(b.text) + '</blockquote>';
      case 'source': return '<div class="source"><b>מקור:</b> ' + esc(b.text) + '</div>';
      default:       return '<p>' + esc(b.text) + '</p>';
    }
  }

  function renderSingle(root, a) {
    document.title = a.title + ' | ישיבה תיכונית קריית אתא';
    root.innerHTML =
      '<section class="article-hero">' +
        '<div class="container">' +
          '<p class="breadcrumb" style="color:#9db8d4"><a href="index.html">דף הבית</a> · <a href="articles.html">מאמרים</a></p>' +
          (a.parasha ? '<span class="parasha-tag">' + esc(a.parasha) + '</span>' : '') +
          '<h1>' + esc(a.title) + '</h1>' +
          (a.subtitle ? '<p class="sub">' + esc(a.subtitle) + '</p>' : '') +
          '<div class="byline">' +
            '<span>מאת <b>' + esc(a.author) + '</b></span>' +
            '<span>' + fmt(a.date) + '</span>' +
            (a.read_min ? '<span>' + a.read_min + ' דק׳ קריאה</span>' : '') +
          '</div>' +
        '</div>' +
      '</section>' +
      '<div class="container"><div class="article-body">' +
        (Array.isArray(a.body) ? a.body.map(block).join('') : '') +
        '<div class="article-share">' +
          '<a class="btn btn-primary" href="https://wa.me/?text=' + encodeURIComponent(a.title + ' — מאמר מאת ' + a.author + '\n' + location.href) + '" target="_blank" rel="noopener">שיתוף בוואטסאפ</a>' +
          '<a class="btn btn-outline" href="articles.html">לכל המאמרים <span class="arr">←</span></a>' +
        '</div>' +
      '</div></div>' +
      (a.video_id ?
        '<div class="container"><div class="article-video">' +
          '<div class="vid-frame"><iframe loading="lazy" src="https://www.youtube.com/embed/' + a.video_id + '" title="' + esc(a.title) + '" allowfullscreen></iframe></div>' +
          '<p class="cap">המאמר מבוסס על שיחת ראש הישיבה — לצפייה בשיחה המלאה</p>' +
        '</div></div>' : '');
    initProgress();
  }

  function renderNotFound(root) {
    root.innerHTML =
      '<section class="page-hero"><div class="container">' +
        '<h1>המאמר לא נמצא</h1>' +
        '<p><a class="btn btn-primary" style="margin-top:1.4rem" href="articles.html">לכל המאמרים <span class="arr">←</span></a></p>' +
      '</div></section>';
  }

  /* ---------- פס התקדמות קריאה ---------- */
  function initProgress() {
    var bar = document.querySelector('.read-progress');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'read-progress';
      document.body.appendChild(bar);
    }
    function upd() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    }
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }

  /* ---------- Reveal ---------- */
  function revealAll(scope) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { threshold: 0.1 });
      scope.querySelectorAll('.reveal').forEach(function (r) { io.observe(r); });
    } else {
      scope.querySelectorAll('.reveal').forEach(function (r) { r.classList.add('in'); });
    }
  }

  /* ---------- Init ---------- */
  function init() {
    var lists = document.querySelectorAll('[data-articles]');
    var single = document.querySelector('[data-article-single]');
    if (!lists.length && !single) return;

    window.whenSB(function (sb) {
      if (!sb) {
        lists.forEach(function (el) { el.innerHTML = '<p class="lead">לא ניתן לטעון מאמרים כעת.</p>'; });
        if (single) renderNotFound(single);
        return;
      }
      if (lists.length) {
        sb.from('articles')
          .select('slug,title,subtitle,parasha,date,read_min,excerpt,video_id')
          .eq('published', true)
          .order('sort_order', { ascending: false })
          .order('date', { ascending: false })
          .then(function (res) {
            lists.forEach(function (el) {
              if (res.error || !res.data) el.innerHTML = '<p class="lead">לא ניתן לטעון מאמרים כעת.</p>';
              else renderList(el, res.data);
            });
          });
      }
      if (single) {
        var slug = new URLSearchParams(location.search).get('slug') || '';
        sb.from('articles')
          .select('slug,title,subtitle,parasha,author,date,read_min,body,video_id')
          .eq('published', true)
          .eq('slug', slug)
          .maybeSingle()
          .then(function (res) {
            if (res.error || !res.data) renderNotFound(single);
            else renderSingle(single, res.data);
          });
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
