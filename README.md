# Retrocalculated

A personal research and notes site. Plain HTML, CSS and JavaScript with no build step and no framework, hosted free on GitHub Pages.

## Layout

```
index.html                 Homepage: hero, featured piece, Research and Notebook sections
about.html                 About page
archive.html               Chronological list of every piece
tags.html                  Browse by topic (reads assets/search-index.json)
404.html                   Not-found page
research/                  Long-form research pieces
  science/  history/  gaming/      one folder per category, each with an index.html
blog/                      Notebook posts (shorter, informal)
  science/  history/  gaming/      same structure; blog/_template.html starts a new post
assets/
  style.css                All styling (design tokens at the top, dark theme included)
  site.js                  Shared scripts: contents highlighting, search, theme toggle,
                           reader controls, citation previews, resume reading, mobile bar
  search-index.json        Powers site search and the tags page
  images/                  Figures used in articles
  og-*.png                 Social preview images
rss.xml  sitemap.xml  robots.txt  site.webmanifest
```

## Adding a piece

1. Create the page in the right category folder, starting from a similar existing piece
   (or `blog/_template.html` for Notebook posts).
2. Add its card to the category `index.html`, and update the piece counts on `index.html`,
   `research/index.html` and `blog/index.html`.
3. Register it in `archive.html`, `sitemap.xml`, `rss.xml` and `assets/search-index.json`.
4. Optionally add a social image as `assets/og-<name>.png` and point the page's
   `og:image` and `twitter:image` at it (otherwise use `assets/og-default.png`).

## Conventions

- Headings inside articles: one `h1` per page (the title); chapter titles are `h2`,
  sections `h3`, subsections `h4`.
- Page titles use a short hyphen as the separator ("Title - Retrocalculated").
- No em dashes in prose.
