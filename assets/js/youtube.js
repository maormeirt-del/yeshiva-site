/* ============================================================
   מנוע יוטיוב — שואב את סרטוני הערוץ מ-RSS (קליינט-סייד) ובונה
   גלריות שורטס + שיעורים. נופל ל-content/videos.json אם ה-RSS
   חסום. לחיצה פותחת מודאל נגן.
   ============================================================ */
(function () {
  'use strict';

  var CHANNEL_ID = 'UCbnUimIt6pHJghjJrf4ZWTQ';
  var FEED = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + CHANNEL_ID;
  // פרוקסי CORS — מנסה לפי הסדר עד שאחד מחזיר תשובה תקינה
  var PROXIES = [
    function (u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
    function (u) { return 'https://corsproxy.io/?url=' + encodeURIComponent(u); },
    function (u) { return 'https://thingproxy.freeboard.io/fetch/' + u; }
  ];

  var cache = null; // רשימת הסרטונים אחרי טעינה ראשונה

  function thumb(id, hq) {
    return 'https://i.ytimg.com/vi/' + id + '/' + (hq ? 'hqdefault' : 'mqdefault') + '.jpg';
  }

  function fetchText(url) {
    return new Promise(function (resolve, reject) {
      var i = 0;
      function attempt() {
        if (i >= PROXIES.length) { reject(new Error('all proxies failed')); return; }
        var p = PROXIES[i++](url);
        fetch(p, { cache: 'no-store' })
          .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.text(); })
          .then(function (t) { if (t && t.indexOf('<feed') !== -1 || t.indexOf('<entry') !== -1) resolve(t); else throw new Error('bad body'); })
          .catch(function () { attempt(); });
      }
      attempt();
    });
  }

  function parseFeed(xmlText) {
    var doc = new DOMParser().parseFromString(xmlText, 'text/xml');
    var entries = doc.getElementsByTagName('entry');
    var out = [];
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var idNode = e.getElementsByTagName('yt:videoId')[0] || e.getElementsByTagName('videoId')[0];
      var id = idNode ? idNode.textContent : '';
      if (!id) {
        var link = e.getElementsByTagName('link')[0];
        var href = link ? link.getAttribute('href') : '';
        var m = href && href.match(/[?&]v=([^&]+)/);
        id = m ? m[1] : '';
      }
      var titleNode = e.getElementsByTagName('title')[0];
      var pubNode = e.getElementsByTagName('published')[0];
      if (id) out.push({
        id: id,
        title: titleNode ? titleNode.textContent : '',
        published: pubNode ? pubNode.textContent : ''
      });
    }
    return out;
  }

  function loadFallback() {
    return fetch('content/videos.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (data) {
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.videos)) return data.videos;
        return [];
      })
      .catch(function () { return []; });
  }

  // מחזיר Promise לרשימת סרטונים (RSS → fallback)
  function getVideos() {
    if (cache) return Promise.resolve(cache);
    return fetchText(FEED)
      .then(function (xml) {
        var list = parseFeed(xml);
        if (!list.length) throw new Error('empty');
        return list;
      })
      .catch(function () { return loadFallback(); })
      .then(function (list) { cache = list || []; return cache; });
  }

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  var PLAY_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  function shortCard(v) {
    var a = document.createElement('a');
    a.className = 'short-card';
    a.href = 'https://www.youtube.com/watch?v=' + v.id;
    a.setAttribute('role', 'button');
    a.setAttribute('aria-label', 'נגן: ' + (v.title || 'סרטון מהישיבה'));
    a.dataset.vid = v.id;
    a.dataset.vertical = '1';
    a.innerHTML =
      '<img loading="lazy" src="' + thumb(v.id, true) + '" alt="' + esc(v.title) + '"' +
      ' onerror="this.onerror=null;this.src=\'' + thumb(v.id, false) + '\'">' +
      '<span class="play">' + PLAY_SVG.replace('24 24', '24 24') + '</span>' +
      (v.title ? '<span class="cap">' + esc(v.title) + '</span>' : '');
    a.addEventListener('click', onPlay);
    return a;
  }

  function lessonCard(v) {
    var a = document.createElement('a');
    a.className = 'lesson-card';
    a.href = 'https://www.youtube.com/watch?v=' + v.id;
    a.setAttribute('role', 'button');
    a.dataset.vid = v.id;
    a.innerHTML =
      '<div class="thumb"><img loading="lazy" src="' + thumb(v.id, true) + '" alt="' + esc(v.title) + '"' +
      ' onerror="this.onerror=null;this.src=\'' + thumb(v.id, false) + '\'">' +
      '<span class="play"><span>' + PLAY_SVG + '</span></span></div>' +
      '<div class="body"><h3>' + esc(v.title || 'שיעור מהישיבה') + '</h3>' +
      '<span class="date"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' +
      fmtDate(v.published) + '</span></div>';
    a.addEventListener('click', onPlay);
    return a;
  }

  function esc(s) {
    return (s || '').replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // אריח-תמונה: פריים אמיתי מהסרטון (hqdefault/hq1/hq2/hq3). לחיצה פותחת את הסרטון.
  function photoTile(v, frame) {
    var a = document.createElement('a');
    a.className = 'photo-tile';
    a.href = 'https://www.youtube.com/watch?v=' + v.id;
    a.setAttribute('role', 'button');
    a.setAttribute('aria-label', 'רגע מהישיבה — ' + (v.title || ''));
    a.dataset.vid = v.id;
    a.innerHTML =
      '<img loading="lazy" src="https://i.ytimg.com/vi/' + v.id + '/' + frame + '.jpg" alt="' + esc(v.title) + '"' +
      ' onerror="this.onerror=null;this.src=\'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg\'">' +
      '<span class="ph-play"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span>';
    a.addEventListener('click', onPlay);
    return a;
  }

  function fillContainer(el) {
    var type = el.dataset.gallery; // 'shorts' | 'lessons' | 'photos'
    var limit = parseInt(el.dataset.limit || '6', 10);
    var skip = parseInt(el.dataset.skip || '0', 10);
    var filter = el.dataset.filter || ''; // מחרוזת לסינון לפי כותרת
    el.innerHTML = '<div class="yt-loading"><div class="spin"></div>טוען מהערוץ…</div>';
    getVideos().then(function (vids) {
      el.innerHTML = '';
      if (filter) {
        vids = vids.filter(function (v) { return (v.title || '').indexOf(filter) !== -1; });
      }
      if (type === 'photos') {
        var frames = (el.dataset.frames || 'hqdefault,hq1,hq2,hq3').split(',');
        var pool = vids.slice(skip, skip + limit);
        if (!pool.length) { el.innerHTML = '<div class="yt-loading">התמונות יתעדכנו בקרוב ישירות מהערוץ.</div>'; return; }
        // שזירה לפי פריים — כדי שלא יופיעו 4 תמונות דומות זו לצד זו
        frames.forEach(function (fr) {
          pool.forEach(function (v) { el.appendChild(photoTile(v, fr)); });
        });
        return;
      }
      var slice = vids.slice(skip, skip + limit);
      if (!slice.length) {
        el.innerHTML = '<div class="yt-loading">התוכן יתעדכן בקרוב ישירות מהערוץ.</div>';
        return;
      }
      slice.forEach(function (v) {
        el.appendChild(type === 'lessons' ? lessonCard(v) : shortCard(v));
      });
    });
  }

  // ---------- Modal ----------
  function ensureModal() {
    var m = document.getElementById('yt-modal');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'yt-modal';
    m.className = 'modal';
    m.innerHTML =
      '<div class="modal-inner"><button class="modal-close" aria-label="סגירה">×</button>' +
      '<div class="ratio"></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', function (e) { if (e.target === m) closeModal(); });
    m.querySelector('.modal-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
    return m;
  }

  function onPlay(e) {
    e.preventDefault();
    var el = e.currentTarget;
    openVideo(el.dataset.vid, el.dataset.vertical === '1');
  }

  function openVideo(id, vertical) {
    var m = ensureModal();
    var inner = m.querySelector('.modal-inner');
    inner.classList.toggle('vertical', !!vertical);
    inner.querySelector('.ratio').innerHTML =
      '<iframe src="https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0" title="נגן וידאו" ' +
      'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    var m = document.getElementById('yt-modal');
    if (!m) return;
    m.classList.remove('open');
    m.querySelector('.ratio').innerHTML = '';
    document.body.style.overflow = '';
  }

  // ---------- Public bg-image hook ----------
  // אלמנט עם data-yt-bg="N" יקבל תמונת רקע מהסרטון ה-N
  function applyBackgrounds() {
    var els = document.querySelectorAll('[data-yt-bg]');
    if (!els.length) return;
    getVideos().then(function (vids) {
      els.forEach(function (el) {
        var idx = parseInt(el.dataset.ytBg || '0', 10);
        var v = vids[idx];
        if (v) {
          var img = el.querySelector('img.yt-thumb');
          if (img) img.src = thumb(v.id, true);
          else el.style.backgroundImage = "url('" + thumb(v.id, true) + "')";
        }
      });
    });
  }

  function init() {
    document.querySelectorAll('[data-gallery]').forEach(fillContainer);
    applyBackgrounds();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.YTGallery = { open: openVideo, getVideos: getVideos };
})();
