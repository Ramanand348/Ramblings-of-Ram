#!/usr/bin/env python3
"""Checks the site for common problems. Exit code 1 if any error is found.

Usage:  python scripts/check_site.py [--root DIR] [--strict]
  --strict  also fail on warnings
"""
import html, json, os, re, sys
from urllib.parse import urlparse, unquote
import xml.dom.minidom
sys.path.insert(0, os.path.dirname(__file__))
import sitelib as L

SKIP_PAGES = {'google6b3c7029c6416ad3.html'}
NO_CANONICAL = {'404.html', 'blog/_template.html'}


def main():
    root = L.find_root(sys.argv[sys.argv.index('--root') + 1] if '--root' in sys.argv else None)
    strict = '--strict' in sys.argv
    errors, warns = [], []
    E = lambda k, m: errors.append((k, m))
    W = lambda k, m: warns.append((k, m))

    files = set(L.all_files(root))
    pages = [p for p in L.html_pages(root) if p not in SKIP_PAGES and not p.startswith('assets/interactive')]
    src = {p: L.read(root, p) for p in pages}
    ids = {p: set(re.findall(r'\bid="([^"]+)"', s)) for p, s in src.items()}
    base = L.base_url(root)

    # links, anchors, assets
    for p, s in src.items():
        d = os.path.dirname(p)
        for m in re.finditer(r'<a\b[^>]*?href="([^"]*)"', s):
            href = html.unescape(m.group(1)).strip()
            if not href or href.startswith(('mailto:', 'tel:', 'javascript:')) or '+' in href or '{' in href:
                continue
            if href.startswith('http'):
                if base and href.startswith(base):
                    href = href[len(base):]
                else:
                    continue
            u = urlparse(href)
            path = unquote(u.path)
            tgt = p if path == '' else (path.lstrip('/') if path.startswith('/') else os.path.normpath(os.path.join(d, path)).replace('\\', '/'))
            if tgt.endswith('/'):
                tgt += 'index.html'
            if tgt not in files:
                if (tgt.rstrip('/') + '/index.html') in files:
                    continue
                E('broken link', '%s -> %s' % (p, m.group(1)))
                continue
            if u.fragment and tgt.endswith('.html') and tgt in ids and u.fragment not in ids[tgt]:
                E('broken anchor', '%s -> %s' % (p, m.group(1)))
        for m in re.finditer(r'<(?:img|script|link)\b[^>]*?(?:src|href)="([^"#?]+)"', s):
            v = html.unescape(m.group(1))
            if v.startswith(('http', '//', 'data:', 'mailto')):
                continue
            tgt = v.lstrip('/') if v.startswith('/') else os.path.normpath(os.path.join(d, v)).replace('\\', '/')
            if tgt not in files:
                E('missing asset', '%s -> %s' % (p, v))

    # per-page structure
    for p, s in src.items():
        if '<title>' not in s:
            E('meta', '%s: no <title>' % p)
        if 'name="description"' not in s:
            W('meta', '%s: no meta description' % p)
        if p not in NO_CANONICAL and 'rel="canonical"' not in s:
            W('meta', '%s: no canonical link' % p)
        for m in re.finditer(r'<img\b(?![^>]*\balt=)[^>]*>', s):
            E('accessibility', '%s: image without alt: %s' % (p, m.group(0)[:70]))
        dup = sorted(i for i in set(re.findall(r'\bid="([^"]+)"', s)) if len(re.findall(r'\bid="%s"' % re.escape(i), s)) > 1)
        if dup:
            E('duplicate id', '%s: %s' % (p, dup[:5]))
        if not re.search(r'<html[^>]*\blang="', s[:300]):
            E('accessibility', '%s: <html> has no lang' % p)
        n1 = len(re.findall(r'<h1[\s>]', s))
        if n1 != 1 and p not in NO_CANONICAL:
            E('headings', '%s: %d h1 elements (expected 1)' % (p, n1))
        for ph in ('POST TITLE HERE', 'Lorem ipsum', 'ONE-SENTENCE DESCRIPTION'):
            if ph in s and p != 'blog/_template.html':
                E('placeholder', '%s: contains "%s"' % (p, ph))
        t = re.search(r'<title>(.*?)</title>', s, flags=re.S)
        if t and '\u2014' in t.group(1):
            E('title', '%s: em dash in <title> (use a short hyphen)' % p)
        body = re.sub(r'<svg.*?</svg>', '', L.strip_noise(s), flags=re.S)
        body = re.sub(r'<title>.*?</title>', '', body, flags=re.S)
        body = re.sub(r'<td>\s*\u2014\s*</td>', '', body)
        n = re.sub(r'<[^>]+>', ' ', body).count('\u2014')
        if n:
            W('em dash', '%s: %d em dash(es) in text' % (p, n))

    # registry coverage
    def load(p):
        try:
            return L.read(root, p)
        except OSError:
            return ''
    sitemap, rss = load('sitemap.xml'), load('rss.xml')
    try:
        index = json.loads(load('assets/search-index.json'))
    except ValueError as e:
        E('json', 'assets/search-index.json: %s' % e)
        index = []
    for f in ('sitemap.xml', 'rss.xml'):
        try:
            xml.dom.minidom.parseString(load(f).encode('utf-8'))
        except Exception as e:
            E('xml', '%s: %s' % (f, e))
    try:
        json.loads(load('site.webmanifest') or '{}')
    except ValueError as e:
        E('json', 'site.webmanifest: %s' % e)
    index_urls = {e.get('url') for e in index}
    archive = load('archive.html')
    for p in sorted(files):
        if L.is_content(p):
            if base + p not in sitemap:
                E('sitemap', 'missing %s' % p)
            if base + p not in rss:
                E('rss', 'missing %s' % p)
            if '/' + p not in index_urls:
                E('search index', 'missing %s' % p)
            if p not in archive:
                E('archive', 'missing %s' % p)
            parts = p.split('/')
            cat_index = '/'.join(parts[:2]) + '/index.html'
            if cat_index in files and 'href="%s"' % parts[2] not in L.read(root, cat_index):
                E('category page', '%s has no card for %s' % (cat_index, parts[2]))
        elif L.is_tool(p):
            if base + p not in sitemap:
                E('sitemap', 'missing %s' % p)
    for u in sorted(index_urls):
        if u and u.lstrip('/') not in files:
            E('search index', 'dead entry %s' % u)
    for loc in re.findall(r'<loc>([^<]+)</loc>', sitemap):
        q = loc[len(base):] if base and loc.startswith(base) else None
        if q and q not in files and (q.rstrip('/') + '/index.html') not in files:
            E('sitemap', 'dead url %s' % loc)

    # counts on listing pages
    cnt = L.counts(root)
    def check_counts(page, want):
        s = src.get(page, '')
        got = [(m.group(1), int(m.group(2))) for m in re.finditer(r'<h3>(Science|History|Gaming)</h3>.*?<span>(\d+) pieces?</span>', s, flags=re.S)]
        if len(got) != len(want):
            W('counts', '%s: found %d category counts, expected %d' % (page, len(got), len(want)))
            return
        for (name, n), (key, w) in zip(got, want):
            if n != w:
                E('counts', '%s: %s says %d, actual %d' % (page, name, n, w))
    cats = [c for c in L.CATEGORIES]
    check_counts('index.html', [(c, cnt.get(('research', c), 0)) for c in ['history', 'science', 'gaming']] if False else [(c, cnt.get(('research', c), 0)) for c in order_of(src.get('index.html', ''))[:3]] + [(c, cnt.get(('blog', c), 0)) for c in order_of(src.get('index.html', ''))[3:]])
    check_counts('research/index.html', [(c, cnt.get(('research', c), 0)) for c in order_of(src.get('research/index.html', ''))])
    check_counts('blog/index.html', [(c, cnt.get(('blog', c), 0)) for c in order_of(src.get('blog/index.html', ''))])

    def show(label, items):
        if not items:
            return
        print('\n%s (%d)' % (label, len(items)))
        for k, m in items:
            print('  [%s] %s' % (k, m))
    show('ERRORS', errors)
    show('WARNINGS', warns)
    print('\n%d pages checked: %d errors, %d warnings' % (len(pages), len(errors), len(warns)))
    sys.exit(1 if errors or (strict and warns) else 0)


def order_of(s):
    return [m.group(1).lower() for m in re.finditer(r'<h3>(Science|History|Gaming)</h3>.*?<span>\d+ pieces?</span>', s, flags=re.S)]


if __name__ == '__main__':
    main()
