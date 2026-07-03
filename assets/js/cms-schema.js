/* ============================================================
   cms-schema.js — הגדרת התוכן הניתן לעריכה של האתר.
   קובץ אחד שמשמש גם את דף הבית (content.js מזריק) וגם את פאנל
   הניהול (admin.js בונה טפסים). כל שדה = key ב-site_content.
   sel = בורר CSS בדף הבית · mode = איך מיישמים (text/html/textarea).
   ============================================================ */
window.CMS_SCHEMA = [
  {
    group: '📞 פרטי יצירת קשר', hint: 'מתעדכן בכל מקום באתר — סקשן צור קשר, פוטר, כפתורי וואטסאפ/חיוג.',
    fields: [
      { key: 'contact.phone',    label: 'טלפון מזכירות',  type: 'text', sel: '#contact .contact-list li:nth-child(1) a[href^="tel:"]', special: 'phone' },
      { key: 'contact.email',    label: 'אימייל',          type: 'text', sel: '#contact .contact-list li:nth-child(2) a[href^="mailto:"]', special: 'email' },
      { key: 'contact.address',  label: 'כתובת',           type: 'text', sel: '#contact .contact-list li:nth-child(3) a', special: 'address' },
      { key: 'contact.hours',    label: 'שעות מענה',       type: 'text', sel: '#contact .contact-list li:nth-child(4) div span' },
      { key: 'contact.whatsapp', label: 'מספר וואטסאפ (בינלאומי, למשל 972542390375)', type: 'text', sel: null, special: 'whatsapp' }
    ]
  },
  {
    group: '🏠 מסך פתיחה (Hero)',
    fields: [
      { key: 'hero.title1',   label: 'כותרת — שורה 1',              type: 'text',     sel: '.hero h1 .line-mask:nth-child(1) .line-inner' },
      { key: 'hero.title2',   label: 'כותרת — שורה 2 (בכתום)',      type: 'text',     sel: '.hero h1 .line-mask:nth-child(2) .line-inner' },
      { key: 'hero.tagline',  label: 'שורת סלוגן עליונה',           type: 'text',     sel: '.hero .tagline', mode: 'html' },
      { key: 'hero.intro',    label: 'משפט פתיחה',                  type: 'textarea', sel: '.hero p.intro' },
      { key: 'hero.badgeNum', label: 'מספר בתג הצף',                type: 'text',     sel: '.hero-badge .num' },
      { key: 'hero.badgeLbl', label: 'תווית בתג הצף',               type: 'text',     sel: '.hero-badge .lbl', mode: 'html' }
    ]
  },
  {
    group: 'ℹ️ אודות',
    fields: [
      { key: 'about.kicker',  label: 'עינית',    type: 'text',     sel: '#about .kicker' },
      { key: 'about.heading', label: 'כותרת',    type: 'text',     sel: '#about .h-sec' },
      { key: 'about.p1',      label: 'פסקה 1',   type: 'textarea', sel: '#about .prose p:nth-of-type(1)' },
      { key: 'about.p2',      label: 'פסקה 2',   type: 'textarea', sel: '#about .prose p:nth-of-type(2)' },
      { key: 'about.p3',      label: 'פסקה 3',   type: 'textarea', sel: '#about .prose p:nth-of-type(3)' }
    ]
  },
  {
    group: '📑 כותרות הסקשנים', hint: 'העינית, הכותרת ותת-הכותרת של כל אזור בדף הבית.',
    fields: [
      { key: 'pillars.kicker',  label: 'עמודי תווך — עינית',   type: 'text',     sel: '#pillars .kicker' },
      { key: 'pillars.heading', label: 'עמודי תווך — כותרת',   type: 'text',     sel: '#pillars .h-sec' },
      { key: 'pillars.lead',    label: 'עמודי תווך — תת-כותרת', type: 'textarea', sel: '#pillars .lead' },

      { key: 'day.kicker',  label: 'סדר יום — עינית',   type: 'text',     sel: '#day .kicker' },
      { key: 'day.heading', label: 'סדר יום — כותרת',   type: 'text',     sel: '#day .h-sec' },
      { key: 'day.lead',    label: 'סדר יום — תת-כותרת', type: 'textarea', sel: '#day .lead' },

      { key: 'tracks.kicker',  label: 'מסלולים — עינית',   type: 'text',     sel: '#tracks .kicker' },
      { key: 'tracks.heading', label: 'מסלולים — כותרת',   type: 'text',     sel: '#tracks .h-sec' },
      { key: 'tracks.lead',    label: 'מסלולים — תת-כותרת', type: 'textarea', sel: '#tracks .lead' },

      { key: 'team.kicker',  label: 'צוות — עינית',   type: 'text',     sel: '#team .kicker' },
      { key: 'team.heading', label: 'צוות — כותרת',   type: 'text',     sel: '#team .h-sec' },
      { key: 'team.lead',    label: 'צוות — תת-כותרת', type: 'textarea', sel: '#team .lead' },

      { key: 'tst.kicker',  label: 'המלצות — עינית',   type: 'text',     sel: '#testimonials .kicker' },
      { key: 'tst.heading', label: 'המלצות — כותרת',   type: 'text',     sel: '#testimonials .h-sec' },
      { key: 'tst.lead',    label: 'המלצות — תת-כותרת', type: 'textarea', sel: '#testimonials .lead' },

      { key: 'moments.kicker',  label: 'רגעים — עינית',   type: 'text',     sel: '#beitmidrash .kicker' },
      { key: 'moments.heading', label: 'רגעים — כותרת',   type: 'text',     sel: '#beitmidrash .h-sec' },
      { key: 'moments.lead',    label: 'רגעים — תת-כותרת', type: 'textarea', sel: '#beitmidrash .lead' },

      { key: 'news.kicker',  label: 'עדכונים — עינית',   type: 'text',     sel: '#news .kicker' },
      { key: 'news.heading', label: 'עדכונים — כותרת',   type: 'text',     sel: '#news .h-sec' },
      { key: 'news.lead',    label: 'עדכונים — תת-כותרת', type: 'textarea', sel: '#news .lead' },

      { key: 'articles.kicker',  label: 'מאמרים — עינית',   type: 'text',     sel: '#articles .kicker' },
      { key: 'articles.heading', label: 'מאמרים — כותרת',   type: 'text',     sel: '#articles .h-sec' },
      { key: 'articles.lead',    label: 'מאמרים — תת-כותרת', type: 'textarea', sel: '#articles .lead' },

      { key: 'contact.kicker',  label: 'צור קשר — עינית',   type: 'text',     sel: '#contact .kicker' },
      { key: 'contact.heading', label: 'צור קשר — כותרת',   type: 'text',     sel: '#contact .h-sec' },
      { key: 'contact.lead',    label: 'צור קשר — תת-כותרת', type: 'textarea', sel: '#contact .lead' }
    ]
  },
  {
    group: '✍️ הרשמה',
    fields: [
      { key: 'signup.kicker',  label: 'עינית',        type: 'text',     sel: '#signup .kicker' },
      { key: 'signup.heading', label: 'כותרת',        type: 'text',     sel: '#signup .h-sec' },
      { key: 'signup.lead',    label: 'תת-כותרת',      type: 'textarea', sel: '#signup .lead' }
    ]
  }
];
