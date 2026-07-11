/* ============================================================
   prerender.mjs — מייצר עמוד HTML סטטי מלא לכל מאמר (pre-rendering),
   כדי שגוגל (וסורקי שיתוף) יראו את תוכן המאמר כבר בקוד — לא מעטפת ריקה.
   מקור התוכן: טבלת articles ב-Supabase (published=true).
   פלט: article/<slug>.html  +  sitemap.xml
   הרצה:  node scripts/prerender.mjs
   ============================================================ */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://yeshiva-site.vercel.app';
const SB = 'https://zgbrrstgujigzhniycfc.supabase.co';
const KEY = 'sb_publishable_omiJveUZdL96FtXPkkRbQQ_6osyZUJo';

/* עמודים קבועים ל-sitemap (URL נקי, cleanUrls) */
const STATIC_PAGES = [
  { path: '/',              priority: '1.0', freq: 'weekly'  },
  { path: '/shiurim',       priority: '0.8', freq: 'weekly'  },
  { path: '/articles',      priority: '0.8', freq: 'weekly'  },
  { path: '/parasha',       priority: '0.7', freq: 'weekly'  },
  { path: '/updates',       priority: '0.7', freq: 'weekly'  },
  { path: '/accessibility', priority: '0.3', freq: 'yearly'  },
  { path: '/terms',         priority: '0.3', freq: 'yearly'  },
  { path: '/privacy',       priority: '0.3', freq: 'yearly'  },
];

const esc = (s) => (s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  try { return dt.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch { return d; }
}
function coverImg(a) {
  return a.video_id ? `https://i.ytimg.com/vi/${a.video_id}/hqdefault.jpg` : `${SITE}/assets/img/logo.png`;
}
function block(b) {
  switch (b.type) {
    case 'h2':     return `<h2>${esc(b.text)}</h2>`;
    case 'quote':  return `<blockquote>${esc(b.text)}</blockquote>`;
    case 'source': return `<div class="source"><b>מקור:</b> ${esc(b.text)}</div>`;
    default:       return `<p>${esc(b.text)}</p>`;
  }
}

async function fetchArticles() {
  const q = 'published=eq.true&select=slug,title,subtitle,parasha,author,date,read_min,excerpt,body,video_id&order=sort_order.desc,date.desc';
  const res = await fetch(`${SB}/rest/v1/articles?${q}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

/* בונה את ה-<head> הייחודי לכל מאמר */
function headFor(a) {
  const url = `${SITE}/article/${encodeURIComponent(a.slug)}`;
  const title = `${esc(a.title)} | ישיבה תיכונית קריית אתא`;
  const desc = esc(a.excerpt || a.subtitle || `${a.title} — מאמר תורני מבית המדרש של ישיבה תיכונית קריית אתא.`);
  const img = coverImg(a);
  const ld = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: a.title, description: a.excerpt || a.subtitle || a.title,
    image: img, author: { '@type': 'Person', name: a.author || 'ישיבה תיכונית קריית אתא' },
    datePublished: a.date || undefined, inLanguage: 'he',
    publisher: { '@type': 'Organization', name: 'ישיבה תיכונית קריית אתא', logo: { '@type': 'ImageObject', url: `${SITE}/assets/img/logo.png` } },
    mainEntityOfPage: url,
  };
  return `<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#1A4E88">
<meta property="og:type" content="article">
<meta property="og:site_name" content="ישיבה תיכונית קריית אתא">
<meta property="og:locale" content="he_IL">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${img}">
${a.author ? `<meta property="article:author" content="${esc(a.author)}">\n` : ''}${a.date ? `<meta property="article:published_time" content="${esc(a.date)}">\n` : ''}<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${img}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

/* בונה את התוכן ה-pre-rendered בתוך <main> (עקבי עם renderSingle ב-articles.js) */
function mainFor(a) {
  const url = `${SITE}/article/${encodeURIComponent(a.slug)}`;
  const shareText = encodeURIComponent(`${a.title} — מאמר מאת ${a.author || 'הישיבה'}\n${url}`);
  const body = Array.isArray(a.body) ? a.body.map(block).join('\n        ') : '';
  const video = a.video_id
    ? `\n  <div class="container"><div class="article-video">
    <div class="vid-frame"><iframe loading="lazy" src="https://www.youtube.com/embed/${esc(a.video_id)}" title="${esc(a.title)}" allowfullscreen></iframe></div>
    <p class="cap">המאמר מבוסס על שיחת ראש הישיבה — לצפייה בשיחה המלאה</p>
  </div></div>`
    : '';
  return `<main>
  <section class="article-hero">
    <div class="container">
      <p class="breadcrumb" style="color:#9db8d4"><a href="/">דף הבית</a> · <a href="/articles">מאמרים</a></p>
      ${a.parasha ? `<span class="parasha-tag">${esc(a.parasha)}</span>` : ''}
      <h1>${esc(a.title)}</h1>
      ${a.subtitle ? `<p class="sub">${esc(a.subtitle)}</p>` : ''}
      <div class="byline">
        <span>מאת <b>${esc(a.author || '')}</b></span>
        <span>${fmtDate(a.date)}</span>
        ${a.read_min ? `<span>${a.read_min} דק׳ קריאה</span>` : ''}
      </div>
    </div>
  </section>
  <div class="container"><div class="article-body">
        ${body}
        <div class="article-share">
          <a class="btn btn-primary" href="https://wa.me/?text=${shareText}" target="_blank" rel="noopener">שיתוף בוואטסאפ</a>
          <a class="btn btn-outline" href="/articles">לכל המאמרים <span class="arr">←</span></a>
        </div>
  </div></div>${video}
</main>`;
}

function buildPage(tpl, a) {
  let html = tpl;
  // כותרת
  html = html.replace('<title>מאמר | ישיבה תיכונית קריית אתא</title>',
    `<title>${esc(a.title)} | ישיבה תיכונית קריית אתא</title>`);
  // <base> כדי שנתיבים יחסיים (assets/…) יפתרו לשורש גם מ-/article/<slug>
  html = html.replace('<head>', '<head>\n<base href="/">');
  // בלוק ה-meta (מחליף את description+noindex+theme+og:image הזמניים)
  html = html.replace(
    `<meta name="description" content="מאמר תורני מבית המדרש של ישיבה תיכונית קריית אתא.">
<meta name="robots" content="noindex, follow">
<meta name="theme-color" content="#1A4E88">
<meta property="og:image" content="assets/img/logo.png">`,
    `<meta name="description" content="${esc(a.excerpt || a.subtitle || a.title)}">\n${headFor(a)}`);
  // תוכן ה-main (מחליף את מעטפת "טוען מאמר…")
  html = html.replace(
    `<main data-article-single>
  <section class="page-hero">
    <div class="container"><h1>טוען מאמר…</h1></div>
  </section>
</main>`, mainFor(a));
  // סקריפטים: מסיר supabase+articles (התוכן כבר מרונדר), מוסיף פס-קריאה
  html = html.replace(
    `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" defer></script>
<script src="assets/js/supabase-config.js" defer></script>
<script src="assets/js/articles.js" defer></script>
<script src="assets/js/main.js" defer></script>
<script src="assets/js/anim.js" defer></script>
<script src="assets/js/widgets.js" defer></script>`,
    `<script src="assets/js/main.js" defer></script>
<script src="assets/js/anim.js" defer></script>
<script src="assets/js/widgets.js" defer></script>
<script>(function(){var b=document.createElement('div');b.className='read-progress';document.body.appendChild(b);function u(){var h=document.documentElement,m=h.scrollHeight-h.clientHeight;b.style.width=(m>0?h.scrollTop/m*100:0)+'%';}addEventListener('scroll',u,{passive:true});u();})();</script>`);
  return html;
}

function sitemap(slugs) {
  const now = new Date().toISOString().slice(0, 10);
  const urls = [
    ...STATIC_PAGES.map((p) => ({ loc: SITE + p.path, freq: p.freq, pri: p.priority, mod: now })),
    ...slugs.map((s) => ({ loc: `${SITE}/article/${encodeURIComponent(s)}`, freq: 'monthly', pri: '0.6', mod: now })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.mod}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pri}</priority>
  </url>`).join('\n')}
</urlset>
`;
}

async function main() {
  const tpl = readFileSync(join(ROOT, 'article.html'), 'utf8');
  let articles = [];
  try {
    articles = await fetchArticles();
    console.log(`נמשכו ${articles.length} מאמרים מ-Supabase.`);
  } catch (e) {
    console.error('⚠ כשל במשיכה מ-Supabase:', e.message);
    console.error('  מייצר sitemap עם העמודים הקבועים בלבד; עמודי המאמר לא עודכנו.');
  }

  const dir = join(ROOT, 'article');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const slugs = [];
  for (const a of articles) {
    if (!a.slug) continue;
    writeFileSync(join(dir, `${a.slug}.html`), buildPage(tpl, a), 'utf8');
    slugs.push(a.slug);
    console.log(`  ✓ article/${a.slug}.html`);
  }

  writeFileSync(join(ROOT, 'sitemap.xml'), sitemap(slugs), 'utf8');
  console.log(`✓ sitemap.xml (${STATIC_PAGES.length} עמודים קבועים + ${slugs.length} מאמרים)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
