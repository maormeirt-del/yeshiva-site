/* ============================================================
   content.js — מזריק תוכן CMS מ-Supabase (site_content) לדף הבית.
   קורא את window.CMS_SCHEMA, ולכל שדה עם ערך שמור מחליף את התוכן
   באתר. אם אין ערך / אין חיבור — נשאר התוכן הקבוע ב-HTML (fallback).
   ============================================================ */
(function () {
  'use strict';

  function setText(sel, val, mode) {
    if (!sel) return;
    var el = document.querySelector(sel);
    if (!el) return;
    if (mode === 'html') el.innerHTML = val;
    else el.textContent = val;
  }

  function digits(s) { return (s || '').replace(/[^0-9]/g, ''); }

  // עדכון גלובלי של קישורי טלפון/מייל/וואטסאפ בכל האתר
  function applyContact(map) {
    var phone = map['contact.phone'], email = map['contact.email'],
        addr = map['contact.address'], wa = map['contact.whatsapp'];

    if (phone) {
      var tel = '+972' + digits(phone).replace(/^0/, '');
      document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
        // עדכון טקסט רק אם הטקסט הנוכחי הוא המספר עצמו (לא "חייגו · ...")
        if (/^[0-9\-\+\s]+$/.test(a.textContent.trim())) a.textContent = phone;
        a.href = 'tel:' + tel;
      });
      // פוטר (טקסט מספר גלוי)
      document.querySelectorAll('[data-cms-phone]').forEach(function (e) { e.textContent = phone; });
    }
    if (email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
        if (a.textContent.indexOf('@') > -1) a.textContent = email;
        a.href = 'mailto:' + email;
      });
    }
    if (addr) {
      document.querySelectorAll('[data-cms-address]').forEach(function (e) { e.textContent = addr; });
      var mapLink = document.querySelector('#contact a[href*="maps.google"]');
      if (mapLink) mapLink.href = 'https://maps.google.com/?q=' + encodeURIComponent(addr);
    }
    if (wa) {
      var num = digits(wa);
      document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) {
        a.href = a.href.replace(/wa\.me\/[0-9]+/, 'wa.me/' + num);
      });
    }
  }

  function apply(map) {
    var schema = window.CMS_SCHEMA || [];
    schema.forEach(function (grp) {
      grp.fields.forEach(function (f) {
        var val = map[f.key];
        if (val == null || val === '') return;
        if (f.special === 'whatsapp') return;    // מטופל ב-applyContact
        setText(f.sel, val, f.mode);
      });
    });
    applyContact(map);
  }

  function boot() {
    if (!window.whenSB) return;
    window.whenSB(function (sb) {
      if (!sb) return;
      sb.from('site_content').select('key,value').then(function (res) {
        if (res.error || !res.data) return;
        var map = {};
        res.data.forEach(function (r) {
          var v = r.value;
          if (v && typeof v === 'object' && 'v' in v) v = v.v; // תאימות לאחור
          map[r.key] = v;
        });
        apply(map);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
