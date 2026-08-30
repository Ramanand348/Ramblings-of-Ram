# Snippets to paste into your existing pages

I don't have your current `index.html` or `blog/index.html` in this
project, so here are the two card snippets to drop in by hand — they use
only classes already defined in your `style.css`, so they'll match the
site automatically.

## 1. In `index.html`, inside the Research section's `.card-grid`

```html
<a class="article-card" href="research/rajendra-chola-srivijaya-campaign.html">
  <p class="article-kicker">Meta-analysis</p>
  <h3>The Fleet That History Forgot</h3>
  <p>Rajendra Chola I's 1025 CE naval raid on Srivijaya, and why the
  popular "blue-water navy," conquest, and royal-marriage version of the
  story doesn't survive contact with the inscriptions.</p>
  <div class="article-meta">
    <span>August 2026</span>
    <span>~18 min read</span>
  </div>
  <span class="read-link">Read the paper →</span>
</a>
```

## 2. In `blog/index.html`, inside the Notebook listing's `.card-grid`

```html
<a class="article-card" href="the-navy-nobody-talks-about.html">
  <p class="article-kicker">Notebook</p>
  <h3>The Navy Nobody Talks About</h3>
  <p>A fleet of repurposed merchant ships, a captured king, and a story
  that's been oversold in almost every retelling since. The short-form
  companion to the Chola–Srivijaya research piece, with an interactive
  campaign map.</p>
  <div class="article-meta">
    <span>August 2026</span>
    <span>~6 min read</span>
  </div>
  <span class="read-link">Read →</span>
</a>
```

If `index.html` also has a short teaser card for the Notebook section
(pointing at whatever the latest post is), update that link to
`blog/the-navy-nobody-talks-about.html` too.

## Upload checklist

Upload these directly into the matching subfolders on GitHub — drag the
*contents*, not the folders themselves:

- `research/rajendra-chola-srivijaya-campaign.html` → into your `research/` folder
- `blog/the-navy-nobody-talks-about.html` → into your `blog/` folder
- `assets/interactive/chola-srivijaya-campaign-map.html` → into a **new**
  `assets/interactive/` folder (create it on GitHub if it doesn't exist yet)

Then paste the two snippets above into `index.html` and `blog/index.html`.

## One thing I couldn't verify

Your project notes mention a reading-progress bar, scroll-to-top button,
citation box with APA/BibTeX toggle, related-articles strip, drop caps,
and ghost chapter numerals as shipped features — but the `style.css` I
have on hand doesn't define classes for most of these, and I don't have
`assets/site.js` in this project. I referenced `../assets/site.js` in the
research article (for TOC scroll-spy) on the assumption it exists at that
path on your live site. If any of those other features are driven by
site.js hooks with specific markup/class contracts, send me that file (or
just tell me the class/id names) and I'll wire the two new pages into
them properly — right now they'll render correctly but without those
extra flourishes.
