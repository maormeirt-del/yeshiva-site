# אתר ישיבה תיכונית קריית אתא

אתר סטטי (HTML/CSS/JS, ללא build) — נפרס ל-Vercel / Netlify / כל אחסון סטטי.
RTL מלא, פלטה נגזרת מהלוגו (כחול `#2E86D4` · נייבי `#1A4E88` · כתום `#F08A1E`).

## מבנה
```
index.html        דף הבית (כל הבלוקים)
shiurim.html      שיעורי ראש הישיבה (נשאב מ-RSS, מסונן ל"ראש הישיבה")
updates.html      בלוג "מה חדש / סיכום שבועי"
assets/css        מערכת העיצוב
assets/js         youtube.js (RSS), updates.js (בלוג), main.js (ניווט/מושן)
assets/fonts      פונטים self-host (Heebo/Rubik/Frank Ruhl Libre/Assistant)
assets/img/logo.png  הלוגו
content/videos.json  גיבוי לרשימת סרטוני הערוץ
content/updates.json רשומות הבלוג
```

## מנגנון התמונות מהשורטס
`assets/js/youtube.js` שואב את פיד ה-RSS של הערוץ (קליינט-סייד דרך פרוקסי CORS),
שולף `videoId` + כותרת, ובונה תמונות מ-`https://i.ytimg.com/vi/{ID}/hqdefault.jpg`.
לחיצה פותחת את הסרטון במודאל. אם ה-RSS חסום — נופל ל-`content/videos.json`.

- כל אלמנט עם `data-gallery="shorts"` / `data-gallery="lessons"` מתמלא אוטומטית.
  תכונות: `data-limit`, `data-skip`, `data-filter="טקסט בכותרת"`.
- כל אלמנט עם `data-yt-bg="N"` מקבל תמונה מהסרטון ה-N.

## מה צריך להשלים (חיפוש "להשלמה" / `#`)
1. **לוגו חי** — שמרו את גרסת הלוגו החדה ל-`assets/img/logo.png` (דורס את ה-placeholder).
2. **טלפון/מייל/כתובת/שעות** — `index.html` סקשן `#contact` + הפוטר.
3. **וואטסאפ** — להחליף `972500000000` במספר האמיתי (חיפוש גלובלי).
4. **טופס הרשמה** — קישור Google Form ב-`#signup`, או חיבור ה-`<form>` ל-API ב-`main.js`.
5. **יומן גוגל** — להחליף את ה-iframe ב-`#calendar` בקוד ההטמעה של הישיבה.
6. **תרומה** — קישור הסליקה בכפתור התרומה (`#donate`).
7. **קבצים להורדה** — להחליף `href="#"` בקבצי PDF אמיתיים (`#downloads`).
8. **מספרי מונים** — שנות פעילות / בוגרים (`data-count` ב-`#counters`).
9. **המלצות וצוות** — שמות וציטוטים אמיתיים (`#testimonials`, `#team`).

## עדכון תוכן שוטף
- **סיכום שבועי חדש:** הוסיפו אובייקט בראש המערך ב-`content/updates.json`
  (`title`, `date`, `videoId` או `image`, `excerpt`, `body`).
- **סרטון נבחר:** מסודר אוטומטית מ-RSS; לקיבוע ידני ערכו את `content/videos.json`.

## פריסה
```
npm i -g vercel
cd yeshiva-site
vercel --prod
```
או גררו את התיקייה ל-Netlify Drop.
