/* ============================================================
   admin.js — פאנל הניהול של הישיבה.
   התחברות (Supabase Auth) + ניהול עדכונים + צפייה בלידים.
   ההרשאות נאכפות בשרת (RLS): רק מייל שברשימת admins יכול לכתוב.
   ============================================================ */
(function () {
  'use strict';

  var sb = null;
  var $ = function (id) { return document.getElementById(id); };

  function show(el, on) { el.classList[on ? 'remove' : 'add']('hidden'); }
  function setMsg(el, text, ok) {
    el.textContent = text || '';
    el.className = 'msg ' + (text ? (ok ? 'ok' : 'err') : '');
  }
  function fmtDate(d) {
    if (!d) return '';
    var dt = new Date(d);
    return isNaN(dt) ? d : dt.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  function esc(s) {
    return (s || '').replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---------- Auth ---------- */
  function refreshSession() {
    sb.auth.getSession().then(function (res) {
      var session = res.data && res.data.session;
      if (session) enterPanel(session.user);
      else showLogin();
    });
  }

  function showLogin() {
    show($('auth'), true);
    show($('panel'), false);
  }

  function enterPanel(user) {
    show($('auth'), false);
    show($('panel'), true);
    $('who').textContent = user.email;
    loadUpdates();
    loadLeads();
  }

  function login() {
    var email = $('email').value.trim();
    var password = $('password').value;
    if (!email || !password) { setMsg($('authMsg'), 'נא למלא אימייל וסיסמה.', false); return; }
    $('loginBtn').disabled = true;
    setMsg($('authMsg'), 'מתחבר…', true);
    sb.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
      $('loginBtn').disabled = false;
      if (res.error) { setMsg($('authMsg'), 'התחברות נכשלה: ' + res.error.message, false); return; }
      setMsg($('authMsg'), '', true);
      enterPanel(res.data.user);
    });
  }

  function logout() {
    sb.auth.signOut().then(showLogin);
  }

  function changePassword() {
    var np = prompt('סיסמה חדשה (לפחות 8 תווים):');
    if (np == null) return;
    if (np.length < 8) { alert('הסיסמה קצרה מדי — לפחות 8 תווים.'); return; }
    sb.auth.updateUser({ password: np }).then(function (res) {
      alert(res.error ? ('החלפה נכשלה: ' + res.error.message) : 'הסיסמה הוחלפה בהצלחה ✓');
    });
  }

  /* ---------- Updates CRUD ---------- */
  function bodyToArray(text) {
    return (text || '').split(/\n{1,}/).map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function arrayToBody(arr) {
    return (Array.isArray(arr) ? arr : []).join('\n\n');
  }

  function clearEditor() {
    $('u-id').value = '';
    $('u-title').value = '';
    $('u-date').value = new Date().toISOString().slice(0, 10);
    $('u-video').value = '';
    $('u-image').value = '';
    $('u-excerpt').value = '';
    $('u-body').value = '';
    $('u-order').value = '0';
    $('u-pub').checked = true;
    $('editorTitle').textContent = 'עדכון חדש';
    setMsg($('editMsg'), '', true);
  }

  function fillEditor(row) {
    $('u-id').value = row.id;
    $('u-title').value = row.title || '';
    $('u-date').value = (row.date || '').slice(0, 10);
    $('u-video').value = row.video_id || '';
    $('u-image').value = row.image || '';
    $('u-excerpt').value = row.excerpt || '';
    $('u-body').value = arrayToBody(row.body);
    $('u-order').value = row.sort_order != null ? row.sort_order : 0;
    $('u-pub').checked = !!row.published;
    $('editorTitle').textContent = 'עריכת עדכון';
    setMsg($('editMsg'), '', true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function save() {
    var title = $('u-title').value.trim();
    if (!title) { setMsg($('editMsg'), 'צריך כותרת.', false); return; }
    var payload = {
      title: title,
      date: $('u-date').value || new Date().toISOString().slice(0, 10),
      video_id: $('u-video').value.trim() || null,
      image: $('u-image').value.trim() || null,
      excerpt: $('u-excerpt').value.trim() || null,
      body: bodyToArray($('u-body').value),
      sort_order: parseInt($('u-order').value, 10) || 0,
      published: $('u-pub').checked
    };
    var id = $('u-id').value;
    $('saveBtn').disabled = true;
    setMsg($('editMsg'), 'שומר…', true);

    var q = id
      ? sb.from('updates').update(payload).eq('id', id)
      : sb.from('updates').insert(payload);

    q.then(function (res) {
      $('saveBtn').disabled = false;
      if (res.error) { setMsg($('editMsg'), 'שמירה נכשלה: ' + res.error.message, false); return; }
      setMsg($('editMsg'), 'נשמר בהצלחה ✓', true);
      clearEditor();
      loadUpdates();
    });
  }

  function del(id) {
    if (!confirm('למחוק את העדכון? הפעולה בלתי הפיכה.')) return;
    sb.from('updates').delete().eq('id', id).then(function (res) {
      if (res.error) { alert('מחיקה נכשלה: ' + res.error.message); return; }
      loadUpdates();
    });
  }

  function loadUpdates() {
    sb.from('updates')
      .select('id,title,date,video_id,image,excerpt,body,sort_order,published')
      .order('sort_order', { ascending: false })
      .order('date', { ascending: false })
      .then(function (res) {
        var box = $('updatesList');
        if (res.error) { box.innerHTML = '<p class="msg err">שגיאה בטעינה: ' + esc(res.error.message) + '</p>'; return; }
        var rows = res.data || [];
        if (!rows.length) { box.innerHTML = '<p class="muted">אין עדיין עדכונים. הוסיפו את הראשון למעלה.</p>'; return; }
        box.innerHTML = '';
        rows.forEach(function (r) {
          var el = document.createElement('div');
          el.className = 'item';
          el.innerHTML =
            '<div><span class="t">' + esc(r.title) + '</span>' +
            ' <span class="pill ' + (r.published ? 'pub">מפורסם' : 'dr">טיוטה') + '</span>' +
            '<div class="d">' + fmtDate(r.date) + '</div></div>' +
            '<div style="display:flex;gap:.4rem"><button class="btn btn-ghost" data-edit>עריכה</button>' +
            '<button class="btn btn-danger" data-del>מחיקה</button></div>';
          el.querySelector('[data-edit]').addEventListener('click', function () { fillEditor(r); });
          el.querySelector('[data-del]').addEventListener('click', function () { del(r.id); });
          box.appendChild(el);
        });
      });
  }

  /* ---------- Leads ---------- */
  function loadLeads() {
    sb.from('leads')
      .select('id,name,phone,email,message,source,handled,created_at')
      .order('created_at', { ascending: false })
      .then(function (res) {
        var box = $('leadsList');
        if (res.error) { box.innerHTML = '<p class="msg err">שגיאה בטעינה: ' + esc(res.error.message) + '</p>'; return; }
        var rows = res.data || [];
        if (!rows.length) { box.innerHTML = '<p class="muted">עדיין לא הגיעו פניות.</p>'; return; }
        box.innerHTML = '';
        rows.forEach(function (r) {
          var el = document.createElement('div');
          el.className = 'item';
          var contact = [r.phone, r.email].filter(Boolean).join(' · ');
          el.innerHTML =
            '<div><span class="t">' + esc(r.name || 'ללא שם') + '</span>' +
            ' <span class="d">' + esc(contact) + '</span>' +
            (r.message ? '<div class="d">“' + esc(r.message) + '”</div>' : '') +
            '<div class="d">' + fmtDate(r.created_at) + ' · מקור: ' + esc(r.source || '-') + '</div></div>' +
            (r.phone ? '<a class="btn btn-ghost" target="_blank" rel="noopener" href="https://wa.me/972' + esc(r.phone.replace(/[^0-9]/g, '').replace(/^0/, '')) + '">וואטסאפ</a>' : '');
          box.appendChild(el);
        });
      });
  }

  /* ---------- Tabs ---------- */
  function initTabs() {
    document.querySelectorAll('.tab').forEach(function (t) {
      t.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('on'); });
        t.classList.add('on');
        var name = t.dataset.tab;
        show($('tab-updates'), name === 'updates');
        show($('tab-leads'), name === 'leads');
      });
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    window.whenSB(function (client) {
      if (!client) {
        setMsg($('authMsg'), 'שגיאת חיבור למסד. רעננו את העמוד.', false);
        return;
      }
      sb = client;
      $('loginBtn').addEventListener('click', login);
      $('password').addEventListener('keydown', function (e) { if (e.key === 'Enter') login(); });
      $('logoutBtn').addEventListener('click', logout);
      $('pwBtn').addEventListener('click', changePassword);
      $('saveBtn').addEventListener('click', save);
      $('newBtn').addEventListener('click', clearEditor);
      clearEditor();
      initTabs();
      refreshSession();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
