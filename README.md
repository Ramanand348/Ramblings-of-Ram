# Retrocalculated

A small static website for research articles and blog posts. Plain HTML/CSS/JS —
no build step, no framework, free to host forever on GitHub Pages.

## What's in here

```
index.html                          Homepage (hero timeline + research + notebook sections)
research/
  the-mahabharata-war.html          The Mahabharata dating meta-analysis (full paper)
blog/
  index.html                        Notebook (blog) listing page — currently empty
  _template.html                    Copy this to start a new blog post
assets/
  style.css                         All site styling
  site.js                           Small script (table-of-contents highlighting)
  images/                           Figures used in the research article
```

## 1. Put it on GitHub Pages (free)

You'll need a free GitHub account if you don't already have one: https://github.com/join

1. Go to https://github.com/new and create a new repository.
   - Name it anything, e.g. `retrocalculated`. Public repos are free (and required
     for free GitHub Pages on a personal account).
   - Don't add a README/gitignore — leave it empty.
2. Upload these files: on the new repo's page, click **"uploading an existing file"**,
   drag the entire contents of this folder in (not the folder itself — its *contents*:
   `index.html`, `research/`, `blog/`, `assets/`), and commit.
3. Go to the repo's **Settings → Pages**.
4. Under "Build and deployment", set **Source** to "Deploy from a branch", branch
   `main`, folder `/ (root)`. Save.
5. GitHub will give you a URL like `https://yourusername.github.io/retrocalculated/`.
   It takes a minute or two to go live the first time.

That's it — the whole site is free, and stays free. If you ever want a custom
domain (like `yourname.com`) instead of the github.io address, you can add one
later for just the cost of the domain itself (Settings → Pages → Custom domain).

### Making changes later

Any time you want to edit a file or add a new page: on GitHub, open the file
and click the pencil (edit) icon, or drag-and-drop new files in through
"Add file → Upload files". Every save automatically re-publishes the live site
within a minute or two. No command line needed unless you want one.

## 2. Adding a new blog post

1. Duplicate `blog/_template.html` and rename it, e.g. `blog/why-i-liked-this-book.html`.
2. Open it and replace the placeholder text:
   - `<title>` and the `<meta name="description">` line
   - The `<h1>` (post title) and the `<p class="subtitle">` (one-line summary)
   - The month/year in `.reading-meta`
   - The body content inside `<article class="article-body">` — plain `<p>`,
     `<h2>`, `<ul>` tags work fine, styled to match the rest of the site
3. Add a card for it on `blog/index.html`: copy one of the `.article-card` blocks
   from `index.html`'s Research section as a pattern, or just ask me to do it —
   paste me the post text and I'll build and wire up the page for you.

## 3. Adding a new research article

Same idea as a blog post, but as a new file under `research/`, and add a new
`.article-card` linking to it from the Research section on `index.html`.

## Notes

- The homepage timeline is a hand-built SVG reflecting the actual 19-entry
  dataset from the Mahabharata paper — it's not decorative, so if that dataset
  changes, the timeline would need regenerating too (ask me if that happens).
- Fonts (Fraunces, Source Serif 4, IBM Plex Mono) load from Google Fonts via
  the `<link>` tags in each page's `<head>` — no local font files to manage.
- Everything is plain static HTML. If this ever needs a database, comments,
  or a contact form, that's a bigger step up (different hosting) — not needed
  for what's here now.
