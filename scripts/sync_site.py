#!/usr/bin/env python3
"""Keeps the site registry in step with the pages. Only ADDS missing entries and removes dead ones;
existing entries and wording are never rewritten.

Updates: sitemap.xml, rss.xml, assets/search-index.json, archive.html, category index cards,
and the piece counts on index.html, research/index.html and blog/index.html.

Usage:  python scripts/sync_site.py            (dry run: lists what would change)
        python scripts/sync_site.py --write    (applies the changes)
"""
import html, json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
import sitelib as L


def main():
    root = L.find_root(sys.argv[sys.argv.index('--root') + 1] if '--root' in sys.argv else None)
    do_write = '--write' in sys.argv
    base = L.base_url(root)
    files = set(L.all_files(root))
    content = sorted(p for p in files if L.is_content(p))
    tools = sorted(p for p in files if L.is_tool(p))
    M = {p: L.meta(root, p) for p in content + tools}
    log = []
    pending = {}

    def get(p):
        if p not in pending:
            pending[p] = L.read(root, p)
        return pending[p]

    def put(p, text):
        pending[p] = text

    # sitemap
    s = get('sitemap.xml')
    for p in content + tools:
        if base + p not in s:
            pr = '0.8' if p.startswith('research/') else ('0.7' if p.startswith('blog/') else '0.6')
            ent = '  <url>\n    <loc>%s</loc>\n    <changefreq>monthly</changefreq>\n    <priority>%s</priority>\n  </url>\n' % (base + p, pr)
            s = s.replace('</urlset>', ent + '</urlset>')
            log.append('sitemap: add %s' % p)
    for m in list(re.finditer(r'  <url>\s*<loc>([^<]+)</loc>.*?</url>\n', s, flags=re.S)):
        loc = m.group(1)
        q = loc[len(base):] if loc.startswith(base) else None
        if q and q not in files and (q.rstrip('/') + '/index.html') not in files:
            s = s.replace(m.group(0), '')
            log.append('sitemap: remove dead %s' % loc)
    put('sitemap.xml', s)

    # rss
    s = get('rss.xml')
    for p in content:
        if base + p not in s:
            m = M[p]
            item = ('  <item>\n    <title>%s</title>\n    <link>%s</link>\n    <guid>%s</guid>\n    <description>%s</description>\n'
                    '    <category>%s</category>\n    <pubDate>%s</pubDate>\n  </item>\n\n') % (
                html.escape(m['title'], quote=False), base + p, base + p, html.escape(m['description'], quote=False), m['category'], L.rfc822(m['date']))
            k = s.find('  <item>')
            s = s[:k] + item + s[k:] if k >= 0 else s.replace('</channel>', item + '</channel>')
            log.append('rss: add %s' % p)
    for m in list(re.finditer(r'  <item>.*?</item>\n\n?', s, flags=re.S)):
        lk = re.search(r'<link>([^<]+)</link>', m.group(0))
        if lk and lk.group(1).startswith(base):
            q = lk.group(1)[len(base):]
            if q not in files:
                s = s.replace(m.group(0), '')
                log.append('rss: remove dead %s' % q)
    put('rss.xml', s)

    # search index
    arr = json.loads(get('assets/search-index.json'))
    urls = {e.get('url') for e in arr}
    for p in content + tools:
        if '/' + p not in urls:
            m = M[p]
            arr.append({'title': m['title'], 'url': '/' + p, 'section': m['section'], 'category': m['category'],
                        'description': m['description'], 'tags': m['tags'] or [m['category']]})
            log.append('search index: add %s' % p)
    kept = [e for e in arr if e.get('url', '').lstrip('/') in files]
    for e in arr:
        if e not in kept:
            log.append('search index: remove dead %s' % e.get('url'))
    put('assets/search-index.json', json.dumps(kept, indent=2, ensure_ascii=False) + '\n')

    # archive
    s = get('archive.html')
    for p in content:
        if p not in s:
            m = M[p]
            head = '<h2 class="archive-group-title">%s · %s</h2>\n' % (m['section'], m['category'])
            if head not in s:
                log.append('archive: NO GROUP "%s · %s" for %s (add it by hand)' % (m['section'], m['category'], p))
                continue
            row = '    <a class="archive-row" href="%s">\n      <span class="archive-row-title">%s</span>\n      <span class="archive-row-meta">%s%s</span>\n    </a>\n' % (
                p, html.escape(m['title'], quote=False), L.month_label(m['date'], True), (' · ~%d min' % m['mins']) if m['mins'] else '')
            s = s.replace(head, head + row, 1)
            log.append('archive: add %s' % p)
    put('archive.html', s)

    # category index cards
    for p in content:
        parts = p.split('/')
        ci = '/'.join(parts[:2]) + '/index.html'
        if ci not in files:
            continue
        s = get(ci)
        if 'href="%s"' % parts[2] in s:
            continue
        m = M[p]
        k = s.find('<a class="article-card')
        if k < 0:
            log.append('card: no card grid found in %s for %s (add by hand)' % (ci, p))
            continue
        spans = '        <span>%s</span>\n' % L.month_label(m['date']) if m['date'] else ''
        if m['mins']:
            spans += '        <span>~%d min read</span>\n' % m['mins']
        spans += '        <span class="read-link">%s</span>\n' % ('Read the paper →' if m['section'] == 'Research' else 'Read →')
        card = ('<a class="article-card" href="%s">\n      <p class="article-kicker">%s</p>\n      <h3>%s</h3>\n      <p>%s</p>\n'
                '      <div class="article-meta">\n%s      </div>\n    </a>\n    ') % (parts[2], m['section'], html.escape(m['title'], quote=False), html.escape(m['description'], quote=False), spans)
        put(ci, s[:k] + card + s[k:])
        log.append('card: add %s to %s' % (parts[2], ci))

    # piece counts
    cnt = L.counts(root)
    def fix_counts(page, sections):
        s = get(page)
        its = list(re.finditer(r'(<h3>(Science|History|Gaming)</h3>.*?<span>)(\d+) pieces?(</span>)', s, flags=re.S))
        if len(its) != len(sections):
            log.append('counts: %s has %d category blocks, expected %d (skipped)' % (page, len(its), len(sections)))
            return
        for m, sec in reversed(list(zip(its, sections))):
            n = cnt.get((sec, m.group(2).lower()), 0)
            new = m.group(1) + '%d piece%s' % (n, '' if n == 1 else 's') + m.group(4)
            if new != m.group(0)[:len(new)] or int(m.group(3)) != n:
                if int(m.group(3)) != n:
                    log.append('counts: %s %s %s %s -> %d' % (page, sec, m.group(2), m.group(3), n))
                s = s[:m.start()] + new + s[m.end():]
        put(page, s)
    fix_counts('index.html', ['research'] * 3 + ['blog'] * 3)
    fix_counts('research/index.html', ['research'] * 3)
    fix_counts('blog/index.html', ['blog'] * 3)

    changed = [p for p in pending if pending[p] != L.read(root, p)]
    if not log and not changed:
        print('Everything is in sync. Nothing to do.')
        return
    for l in log:
        print(l)
    if do_write:
        for p in changed:
            L.write(root, p, pending[p])
        print('\nWrote %d file(s): %s' % (len(changed), ', '.join(changed)))
    else:
        print('\nDry run. Re-run with --write to apply (%d file(s) would change).' % len(changed))


if __name__ == '__main__':
    main()
