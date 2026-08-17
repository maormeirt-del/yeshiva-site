import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PAGES = {
    "index.html": "home",
    "article.html": "articles",
    "articles.html": "articles",
    "parasha.html": "parasha",
    "shiurim.html": "shiurim",
    "updates.html": "updates",
    "accessibility.html": None,
    "privacy.html": None,
    "terms.html": None,
    "article/avanim-shachaku-mayim.html": "articles",
    "article/lama-nigara.html": "articles",
    "article/mahi-kedusha.html": "articles",
}

HEAD_SNIPPET = (
    '<link rel="icon" href="assets/img/logo.png">\n'
    '<link rel="manifest" href="manifest.webmanifest">\n'
    '<link rel="apple-touch-icon" href="assets/img/icons/apple-touch-icon.png">\n'
    '<link rel="stylesheet" href="assets/css/pwa.css">'
)

INSTALL_BTN = (
    '<button id="pwa-install-btn" class="pwa-install-btn" type="button" hidden>'
    '📲 התקינו את האפליקציה</button>\n      '
    '<button class="nav-toggle" aria-label="תפריט" aria-expanded="false">☰</button>'
)

BODY_TOP_SNIPPET = '''<body>

<div id="pwa-update-banner" class="pwa-update-banner" hidden role="status">
  <span>יש גרסה חדשה של האתר</span>
  <button id="pwa-update-reload" type="button">רענון עכשיו</button>
</div>
<div id="pwa-ios-modal" class="pwa-ios-modal" hidden>
  <div class="pwa-ios-card">
    <h3>התקנת האפליקציה באייפון</h3>
    <p>כדי להוסיף את האתר למסך הבית:</p>
    <ol class="pwa-ios-steps">
      <li>הקישו על כפתור <b>שיתוף</b> ⬆️ בסרגל הכלים של Safari</li>
      <li>גללו ובחרו <b>"הוסף למסך הבית"</b></li>
      <li>אשרו בלחיצה על <b>"הוסף"</b></li>
    </ol>
    <button type="button" data-pwa-close>הבנתי</button>
  </div>
</div>'''

TABBAR_ITEMS = [
    ("home", "index.html", "בית",
     '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>'),
    ("shiurim", "shiurim.html", "שיעורים",
     '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16"/>'),
    ("articles", "articles.html", "מאמרים",
     '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h6M9 16h6"/>'),
    ("parasha", "parasha.html", "פרשה",
     '<path d="M7 4v16"/><path d="M17 4v16"/><path d="M7 4a2 2 0 1 0 0 4"/><path d="M17 20a2 2 0 1 0 0-4"/>'),
    ("updates", "updates.html", "עדכונים",
     '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'),
]


def build_tabbar(active_key):
    links = []
    for key, href, label, icon in TABBAR_ITEMS:
        active_cls = " active" if key == active_key else ""
        links.append(
            f'  <a href="{href}" class="{key}{active_cls}">'
            f'<svg viewBox="0 0 24 24">{icon}</svg><span>{label}</span></a>'
        )
    return '<nav class="pwa-tabbar" aria-label="ניווט מהיר">\n' + "\n".join(links) + "\n</nav>"


def inject(path: Path, active_key):
    text = path.read_text(encoding="utf-8")
    original = text

    if 'rel="manifest"' not in text:
        text = text.replace(
            '<link rel="icon" href="assets/img/logo.png">', HEAD_SNIPPET, 1
        )

    if 'id="pwa-install-btn"' not in text:
        text = text.replace(
            '<button class="nav-toggle" aria-label="תפריט" aria-expanded="false">☰</button>',
            INSTALL_BTN,
            1,
        )

    if 'id="pwa-update-banner"' not in text:
        text = text.replace("<body>", BODY_TOP_SNIPPET, 1)

    if 'class="pwa-tabbar"' not in text:
        tabbar = build_tabbar(active_key)
        # להכניס לפני </body> האחרון, יחד עם טעינת pwa.js
        text = re.sub(
            r"</body>\s*</html>\s*$",
            tabbar + '\n<script src="assets/js/pwa.js" defer></script>\n</body>\n</html>',
            text,
        )

    if text != original:
        path.write_text(text, encoding="utf-8")
        print(f"updated: {path.relative_to(ROOT)}")
    else:
        print(f"skipped (no change): {path.relative_to(ROOT)}")


for rel_path, active_key in PAGES.items():
    inject(ROOT / rel_path, active_key)
