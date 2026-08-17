/* ============================================================
   archive.js — "שנה בישיבה": ציר הזמן השנתי של הישיבה.

   קורא את אותה טבלת `updates` שאליה נכתב כל סיכום שבועי, ולכן
   כל עדכון חדש מופיע כאן לבד, בלי שום פעולה ידנית. כל מה שהעמוד
   צריך נגזר מהשדות הקיימים:
     · פרשה        — מחולצת מהכותרת ("פרשת X"), אלא אם מולא שדה parasha
     · תאריך עברי  — מחושב מהתאריך הלועזי בלוח השנה העברי של הדפדפן
     · שנת לימודים — נגזרת מהתאריך (ספטמבר עד אוגוסט)
     · סוג         — מזוהה מהכותרת, אלא אם מולא שדה kind
   השדות kind ו-parasha הם עקיפה ידנית בלבד. NULL = אוטומטי.
   ============================================================ */
(function () {
  'use strict';

  var GRID = document.getElementById('arc-grid');
  if (!GRID) return;

  var YEAR_BAR = document.getElementById('arc-years');
  var KIND_BAR = document.getElementById('arc-kinds');
  var STATS    = document.getElementById('arc-stats');
  var COUNT_EL = document.getElementById('arc-count');

  var KINDS = {
    week:    { label: 'שבוע רגיל',     badge: 'השבוע בישיבה' },
    event:   { label: 'אירוע מיוחד',   badge: 'אירוע מיוחד' },
    holiday: { label: 'חגים ומועדים',  badge: 'חג ומועד' }
  };

  var HOLIDAY_WORDS = [
    'חנוכה','פורים','פסח','שבועות','סוכות','ראש השנה','יום כיפור','יום הכיפורים',
    'שמחת תורה','הושענא רבה','סליחות','אלול','אושפיזין','ל״ג בעומר','ל"ג בעומר','לג בעומר',
    'ט״ו בשבט','ט"ו בשבט','טו בשבט','ט״ו באב','ט"ו באב','יום העצמאות','יום ירושלים',
    'יום הזיכרון','יום השואה','עשרה בטבת','תשעה באב','צום','ספירת העומר','פסח שני','ראש חודש'
  ];

  /* ---------- עזרי טקסט ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---------- גימטריה ---------- */
  var GEM = [[400,'ת'],[300,'ש'],[200,'ר'],[100,'ק'],[90,'צ'],[80,'פ'],[70,'ע'],[60,'ס'],
             [50,'נ'],[40,'מ'],[30,'ל'],[20,'כ'],[10,'י'],[9,'ט'],[8,'ח'],[7,'ז'],
             [6,'ו'],[5,'ה'],[4,'ד'],[3,'ג'],[2,'ב'],[1,'א']];

  // 786 → תשפ״ו · 22 → כ״ב · 15 → ט״ו (ולא י״ה)
  function gematria(n) {
    var v = n % 1000, s = '';
    for (var i = 0; i < GEM.length; i++) {
      while (v >= GEM[i][0]) { s += GEM[i][1]; v -= GEM[i][0]; }
    }
    s = s.replace(/יה$/, 'טו').replace(/יו$/, 'טז');
    if (s.length > 1) return s.slice(0, -1) + '״' + s.slice(-1);
    return s + '׳';
  }

  /* ---------- לוח שנה עברי (מובנה בדפדפן, בלי ספריות) ---------- */
  var heFmt = null;
  function hebParts(date) {
    if (!heFmt) {
      try {
        heFmt = new Intl.DateTimeFormat('he-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch (e) { heFmt = false; }
    }
    if (!heFmt) return null;
    var out = {};
    heFmt.formatToParts(date).forEach(function (p) {
      if (p.type === 'day' || p.type === 'year') out[p.type] = parseInt(p.value.replace(/\D/g, ''), 10);
      else if (p.type === 'month') out.month = p.value;
    });
    return (out.day && out.year && out.month) ? out : null;
  }

  function hebDateLabel(date) {
    var p = hebParts(date);
    if (!p) return '';
    return gematria(p.day) + ' ב' + p.month + ' ' + gematria(p.year);
  }

  function hebMonthLabel(date) {
    var p = hebParts(date);
    return p ? p.month + ' ' + gematria(p.year) : '';
  }

  // שנת לימודים: ספטמבר עד אוגוסט. העוגן הוא ט"ו בדצמבר של אותה שנת לימודים,
  // שתמיד נופל בתוך השנה העברית הנכונה.
  function schoolYear(date) {
    var anchorYear = date.getFullYear() + (date.getMonth() >= 7 ? 0 : -1);
    var p = hebParts(new Date(Date.UTC(anchorYear, 11, 15, 12)));
    return p ? gematria(p.year) : String(date.getFullYear());
  }

  /* ---------- גזירת שדות ---------- */
  function parashaOf(row) {
    if (row.parasha) return row.parasha.trim();
    var m = String(row.title || '').match(/פרשת\s+([^,|#\n]+)/);
    return m ? m[1].trim().replace(/\s+/g, ' ') : '';
  }

  function kindOf(row) {
    if (row.kind) return row.kind;
    var t = String(row.title || '');
    if (t.indexOf('השבוע בישיבה') !== -1) return 'week';
    for (var i = 0; i < HOLIDAY_WORDS.length; i++) {
      if (t.indexOf(HOLIDAY_WORDS[i]) !== -1) return 'holiday';
    }
    if (/פרשת\s/.test(t)) return 'week';
    return 'event';
  }

  function toItem(row) {
    var d = new Date(String(row.date) + 'T12:00:00');
    if (isNaN(d)) d = new Date();
    return {
      title:   row.title || '',
      videoId: row.video_id || null,
      image:   row.image || null,
      excerpt: row.excerpt || '',
      body:    Array.isArray(row.body) ? row.body : [],
      date:    d,
      kind:    kindOf(row),
      parasha: parashaOf(row),
      he:      hebDateLabel(d),
      month:   hebMonthLabel(d),
      year:    schoolYear(d),
      greg:    d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' })
    };
  }

  /* ---------- כרטיס ---------- */
  var PLAY_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  // בשבוע רגיל התג הוא שם הפרשה, שזה המידע שההורה באמת מחפש
  function badgeOf(it) {
    return it.kind === 'week' && it.parasha ? 'פרשת ' + it.parasha : KINDS[it.kind].badge;
  }

  function coverHtml(it) {
    var alt = esc(it.title);
    var inner;
    if (it.image) {
      inner = '<img loading="lazy" decoding="async" src="' + esc(it.image) + '" alt="' + alt + '">';
    } else if (it.videoId) {
      // oar2 הוא הפריים המלא של שורטס (אנכי). אם הוא לא קיים, זה סרטון רגיל
      // ואז נופלים ל-maxresdefault ואחריו ל-hqdefault. אותה טעינה גם מסמנת
      // לנו את כיוון הסרטון, כדי לפתוח את הנגן בפרופורציה הנכונה.
      inner = '<img loading="lazy" decoding="async" data-vid="' + esc(it.videoId) + '" data-step="0"' +
              ' src="https://i.ytimg.com/vi/' + esc(it.videoId) + '/oar2.jpg" alt="' + alt + '">';
    } else {
      return '';
    }
    if (!it.videoId) return '<div class="arc-cover">' + inner + '<span class="arc-badge">' + esc(badgeOf(it)) + '</span></div>';
    return '<button type="button" class="arc-cover" data-play="' + esc(it.videoId) + '" aria-label="צפייה בסרטון: ' + alt + '">' +
             inner +
             '<span class="arc-badge">' + esc(badgeOf(it)) + '</span>' +
             '<span class="arc-play" aria-hidden="true">' + PLAY_SVG + '</span>' +
           '</button>';
  }

  function cardHtml(it, idx) {
    var hasBody = it.body.length > 0;
    var bodyId = 'arc-full-' + idx;
    var cover = coverHtml(it);
    return '<article class="arc-card arc-reveal">' +
      cover +
      '<div class="arc-body">' +
        // בלי תמונה אין איפה להניח את התג, ולכן הוא עולה לגוף הכרטיס
        (cover ? '' : '<span class="arc-badge arc-badge--inline">' + esc(badgeOf(it)) + '</span>') +
        '<div class="arc-dates">' +
          (it.he ? '<span class="arc-he">' + esc(it.he) + '</span>' : '') +
          '<span class="arc-greg">' + esc(it.greg) + '</span>' +
        '</div>' +
        '<h2>' + esc(it.title) + '</h2>' +
        (it.excerpt ? '<p class="arc-ex">' + esc(it.excerpt) + '</p>' : '') +
        (hasBody ? '<div class="arc-full" id="' + bodyId + '" hidden>' +
            it.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' : '') +
        '<div class="arc-acts">' +
          (it.videoId ? '<button type="button" class="arc-watch" data-play="' + esc(it.videoId) + '">' +
              PLAY_SVG + ' לצפייה בסרטון</button>' : '') +
          (hasBody ? '<button type="button" class="arc-read" aria-expanded="false" aria-controls="' + bodyId + '">' +
              '<span class="lbl">קראו את הסיכום</span> <span class="arr">⌄</span></button>' : '') +
        '</div>' +
      '</div>' +
    '</article>';
  }

  /* ---------- רינדור ---------- */
  var ALL = [];
  var state = { year: null, kind: 'all' };

  function visible() {
    return ALL.filter(function (it) {
      return it.year === state.year && (state.kind === 'all' || it.kind === state.kind);
    });
  }

  function renderStats() {
    var ofYear = ALL.filter(function (it) { return it.year === state.year; });
    var weeks  = ofYear.filter(function (it) { return it.kind === 'week'; }).length;
    var videos = ofYear.filter(function (it) { return !!it.videoId; }).length;
    var events = ofYear.filter(function (it) { return it.kind !== 'week'; }).length;
    STATS.innerHTML =
      '<div class="arc-stat"><div class="n">' + weeks  + '</div><div class="l">שבועות מתועדים</div></div>' +
      '<div class="arc-stat"><div class="n">' + videos + '</div><div class="l">סרטונים</div></div>' +
      '<div class="arc-stat"><div class="n">' + events + '</div><div class="l">אירועים ומועדים</div></div>';
  }

  function renderKinds() {
    var ofYear = ALL.filter(function (it) { return it.year === state.year; });
    function n(k) { return k === 'all' ? ofYear.length : ofYear.filter(function (i) { return i.kind === k; }).length; }
    var opts = [['all', 'הכול']].concat(Object.keys(KINDS).map(function (k) { return [k, KINDS[k].label]; }));
    KIND_BAR.innerHTML = opts.map(function (o) {
      return '<button type="button" class="arc-chip" data-kind="' + o[0] + '"' +
             ' aria-pressed="' + (state.kind === o[0]) + '">' + esc(o[1]) +
             ' <span class="cnt">' + n(o[0]) + '</span></button>';
    }).join('');
  }

  function renderTimeline() {
    var list = visible();
    if (COUNT_EL) {
      COUNT_EL.textContent = list.length === 1 ? 'רשומה אחת' : list.length + ' רשומות';
    }
    if (!list.length) {
      GRID.innerHTML = '<li class="arc-empty">אין רשומות בקטגוריה הזו לשנה הזו.</li>';
      return;
    }
    var html = '', lastMonth = '';
    list.forEach(function (it, i) {
      if (it.month && it.month !== lastMonth) {
        lastMonth = it.month;
        html += '<li class="arc-month" aria-hidden="true"><span>' + esc(it.month) + '</span></li>';
      }
      // הצד נקבע לפי מספור הכרטיסים בלבד. אי אפשר להישען על nth-child,
      // כי מפרידי החודשים הם גם הם פריטים ברשימה ושוברים את הספירה.
      html += '<li class="arc-row" data-side="' + (i % 2 ? 'b' : 'a') + '" data-kind="' + it.kind + '">' +
                '<span class="arc-dot" aria-hidden="true"></span>' +
                '<div class="arc-side">' + cardHtml(it, i) + '</div>' +
              '</li>';
    });
    GRID.innerHTML = html;
    wire();
  }

  function renderYears() {
    var years = [];
    ALL.forEach(function (it) { if (years.indexOf(it.year) === -1) years.push(it.year); });
    years.sort().reverse();
    if (!state.year || years.indexOf(state.year) === -1) state.year = years[0];
    YEAR_BAR.innerHTML = years.map(function (y) {
      return '<button type="button" class="arc-chip arc-chip--year" data-year="' + esc(y) + '"' +
             ' aria-pressed="' + (state.year === y) + '">' + esc(y) + '</button>';
    }).join('');
  }

  function renderAll() {
    renderYears();
    renderKinds();
    renderStats();
    renderTimeline();
  }

  /* ---------- חיווט אירועים ---------- */
  function playVideo(id, vertical) {
    if (window.YTGallery && window.YTGallery.open) window.YTGallery.open(id, vertical);
    else window.open('https://www.youtube.com/watch?v=' + id, '_blank', 'noopener');
  }

  function wire() {
    // נפילה מדורגת של התמונה, ובדרך גם זיהוי כיוון הסרטון.
    // יוטיוב לא מחזיר שגיאה על גרסה חסרה אלא תמונת חלופה אפורה 120x90,
    // ולכן בודקים גם את הרוחב בפועל ולא רק את אירוע ה-error.
    GRID.querySelectorAll('img[data-vid]').forEach(function (img) {
      function next() {
        var step = parseInt(img.dataset.step || '0', 10) + 1;
        img.dataset.step = String(step);
        if (step === 1) img.src = 'https://i.ytimg.com/vi/' + img.dataset.vid + '/maxresdefault.jpg';
        else if (step === 2) img.src = 'https://i.ytimg.com/vi/' + img.dataset.vid + '/hqdefault.jpg';
      }
      function check() { if (img.naturalWidth && img.naturalWidth <= 120) next(); }
      img.addEventListener('error', next);
      img.addEventListener('load', check);
      if (img.complete) check();
    });

    GRID.querySelectorAll('[data-play]').forEach(function (el) {
      el.addEventListener('click', function () {
        var id = el.dataset.play;
        var img = GRID.querySelector('img[data-vid="' + id + '"]');
        // step 0 פירושו ש-oar2 נטען בהצלחה, כלומר שורט אנכי
        var vertical = !img || (img.dataset.step || '0') === '0';
        playVideo(id, vertical);
      });
    });

    GRID.querySelectorAll('.arc-read').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        btn.setAttribute('aria-expanded', String(!open));
        btn.querySelector('.lbl').textContent = open ? 'קראו את הסיכום' : 'סגירת הסיכום';
        if (panel) panel.hidden = open;
      });
    });

    reveal();
  }

  function reveal() {
    var els = GRID.querySelectorAll('.arc-reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (el) { io.observe(el); });
    // רשת ביטחון אם ה-observer לא ירה
    setTimeout(function () {
      GRID.querySelectorAll('.arc-reveal:not(.in)').forEach(function (el) { el.classList.add('in'); });
    }, 2400);
  }

  YEAR_BAR.addEventListener('click', function (e) {
    var b = e.target.closest('[data-year]');
    if (!b || b.dataset.year === state.year) return;
    state.year = b.dataset.year;
    renderAll();
  });

  KIND_BAR.addEventListener('click', function (e) {
    var b = e.target.closest('[data-kind]');
    if (!b || b.dataset.kind === state.kind) return;
    state.kind = b.dataset.kind;
    renderKinds();
    renderTimeline();
  });

  /* ---------- טעינת נתונים ---------- */
  function boot(rows) {
    ALL = rows
      .filter(function (r) { return r && r.date && (r.kind || '') !== 'hidden'; })
      .map(toItem)
      .sort(function (a, b) { return b.date - a.date; });
    if (!ALL.length) {
      GRID.innerHTML = '<li class="arc-empty">הארכיון יתמלא כאן עם הסיכום השבועי הראשון.</li>';
      return;
    }
    renderAll();
  }

  function fromJSON() {
    fetch('content/updates.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        boot(((d && d.posts) || []).map(function (p) {
          return { title: p.title, date: p.date, video_id: p.videoId, image: p.image,
                   excerpt: p.excerpt, body: p.body, kind: null, parasha: null };
        }));
      })
      .catch(function () {
        GRID.innerHTML = '<li class="arc-empty">לא הצלחנו לטעון את הארכיון כרגע. נסו לרענן את העמוד.</li>';
      });
  }

  function load() {
    if (typeof window.whenSB !== 'function') return fromJSON();
    window.whenSB(function (sb) {
      if (!sb) return fromJSON();
      sb.from('updates')
        .select('title,date,video_id,image,excerpt,body,kind,parasha')
        .eq('published', true)
        .order('date', { ascending: false })
        .then(function (res) {
          if (res.error || !res.data || !res.data.length) return fromJSON();
          boot(res.data);
        });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
