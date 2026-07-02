/* ============================================================
   supabase-config.js — חיבור האתר למסד הנתונים (Supabase)
   נטען אחרי ספריית supabase-js מה-CDN, לפני שאר הסקריפטים.
   המפתח כאן הוא "publishable" — ציבורי ומיועד לצד-לקוח.
   כל ההגנה על הנתונים נעשית ב-RLS בצד השרת.
   ============================================================ */
(function () {
  'use strict';

  window.YESHIVA_SB = {
    url: 'https://zgbrrstgujigzhniycfc.supabase.co',
    key: 'sb_publishable_omiJveUZdL96FtXPkkRbQQ_6osyZUJo'
  };

  // יוצר (פעם אחת) ומחזיר את לקוח ה-Supabase, או null אם הספרייה לא נטענה
  window.sbClient = function () {
    if (!window.supabase || !window.supabase.createClient) return null;
    if (!window._sbClient) {
      window._sbClient = window.supabase.createClient(
        window.YESHIVA_SB.url,
        window.YESHIVA_SB.key,
        { auth: { persistSession: true, autoRefreshToken: true } }
      );
    }
    return window._sbClient;
  };

  // מריץ cb(client) ברגע שהלקוח מוכן. אם לא נטען תוך timeout — cb(null).
  window.whenSB = function (cb, timeout) {
    var waited = 0, step = 40, max = timeout || 4000;
    (function tick() {
      var c = window.sbClient();
      if (c) return cb(c);
      waited += step;
      if (waited >= max) return cb(null);
      setTimeout(tick, step);
    })();
  };
})();
