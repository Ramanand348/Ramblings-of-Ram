"""Shared helpers for the Retrocalculated site scripts (standard library only)."""
import html, json, os, re
from email.utils import format_datetime
from datetime import datetime, timezone

MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
SKIP_DIRS = {'.git', '.github', 'node_modules', 'scripts'}
CATEGORIES = ['science', 'history', 'gaming']


def find_root(start=None):
    d = os.path.abspath(start or os.path.join(os.path.dirname(__file__), '..'))
    return d


def read(root, p):
    with open(os.path.join(root, p), encoding='utf-8') as f:
        return f.read()


def write(root, p, text):
    with open(os.path.join(root, p), 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)


def all_files(root):
    out = []
    for dp, dn, fn in os.walk(root):
        dn[:] = [d for d in dn if d not in SKIP_DIRS and not d.startswith('.')]
        for f in fn:
            out.append(os.path.relpath(os.path.join(dp, f), root).replace(os.sep, '/'))
    return sorted(out)


def html_pages(root):
    return [p for p in all_files(root) if p.endswith('.html')]


def is_content(p):
    parts = p.split('/')
    return (len(parts) == 3 and parts[0] in ('research', 'blog') and parts[1] in CATEGORIES
            and p.endswith('.html') and parts[2] not in ('index.html', '_template.html'))


def is_tool(p):
    parts = p.split('/')
    return len(parts) == 2 and parts[0] == 'tools' and p.endswith('.html') and parts[1] != 'index.html'


def base_url(root):
    m = re.search(r'rel="canonical" href="([^"]*)"', read(root, 'index.html'))
    return (m.group(1).rstrip('/') + '/') if m else ''


def strip_noise(s):
    s = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', s, flags=re.S)
    return s


def meta(root, p):
    s = read(root, p)
    def attr(pat):
        m = re.search(pat, s, flags=re.S)
        return html.unescape(m.group(1)).strip() if m else ''
    h1 = re.search(r'<div class="reading-header">.*?<h1[^>]*>(.*?)</h1>', s, flags=re.S) or re.search(r'<h1[^>]*>(.*?)</h1>', s, flags=re.S)
    title = html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', h1.group(1)))).strip() if h1 else ''
    desc = attr(r'<meta name="description" content="([^"]*)"')
    date = None
    ld = re.search(r'"datePublished"\s*:\s*"(\d{4})-(\d{2})-(\d{2})', s)
    if ld:
        date = datetime(int(ld.group(1)), int(ld.group(2)), int(ld.group(3)), tzinfo=timezone.utc)
    else:
        m = re.search(r'(?:Published\s+)?(%s|%s)\s+(\d{4})' % ('|'.join(MONTHS), '|'.join(x[:3] for x in MONTHS)), re.sub(r'<[^>]+>', ' ', s[s.find('reading-meta'):s.find('reading-meta') + 600]))
        if m:
            mon = [x[:3] for x in MONTHS].index(m.group(1)[:3]) + 1
            date = datetime(int(m.group(2)), mon, 1, tzinfo=timezone.utc)
    rt = re.search(r'~(\d+) min read', s)
    about = []
    m = re.search(r'"about"\s*:\s*\[(.*?)\]', s, flags=re.S)
    if m:
        about = re.findall(r'"([^"]+)"', m.group(1))
    parts = p.split('/')
    cat = parts[1].capitalize() if len(parts) == 3 else 'Gaming'
    return {'path': p, 'slug': os.path.basename(p), 'title': title, 'description': desc, 'date': date,
            'mins': int(rt.group(1)) if rt else None, 'tags': about,
            'section': 'Research' if parts[0] == 'research' else ('Notebook' if parts[0] == 'blog' else 'Tools'),
            'category': cat}


def month_label(d, short=False):
    if not d:
        return ''
    name = MONTHS[d.month - 1]
    return '%s %d' % (name[:3] if short else name, d.year)


def rfc822(d):
    return format_datetime(d or datetime.now(timezone.utc))


def counts(root):
    c = {}
    for p in all_files(root):
        if is_content(p):
            parts = p.split('/')
            c[(parts[0], parts[1])] = c.get((parts[0], parts[1]), 0) + 1
    return c
