// Highlights the active section in the sticky table of contents as the
// reader scrolls through a long-form article.
document.addEventListener('DOMContentLoaded', function () {
  var tocLinks = document.querySelectorAll('.toc a[href^="#"]');
  if (!tocLinks.length) return;

  var targets = [];
  tocLinks.forEach(function (link) {
    var id = link.getAttribute('href').slice(1);
    var el = document.getElementById(id);
    if (el) targets.push({ link: link, el: el });
  });

  if (!targets.length) return;

  var setActive = function (id) {
    tocLinks.forEach(function (l) {
      l.classList.toggle('active', l.getAttribute('href') === '#' + id);
    });
  };

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    { rootMargin: '-10% 0px -70% 0px', threshold: 0 }
  );

  targets.forEach(function (t) { observer.observe(t.el); });
});

// Instagram share-card generator: renders a branded, on-theme square or
// story-format image straight from an article card's own title, kicker,
// and description (no separate data source needed), previews it in a
// modal, and offers a PNG download for manual posting. Auto-posting isn't
// possible from a static site (Instagram requires a server-side app with
// OAuth token handling), so this covers the "generate the graphic" half.
document.addEventListener('DOMContentLoaded', function () {
  var BRAND = {
    inkNight: '#14182B',
    inkNight2: '#1C2140',
    inkNight3: '#262C52',
    brass: '#B8863F',
    brassLight: '#D8B570',
    cream: '#F4EEDD',
    creamSoft: 'rgba(244, 238, 221, 0.72)'
  };

  function wrapLines(ctx, text, maxWidth) {
    var words = text.split(/\s+/);
    var lines = [];
    var current = '';
    words.forEach(function (word) {
      var test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    });
    if (current) lines.push(current);
    return lines;
  }

  function fitTitle(ctx, text, maxWidth, maxLines, maxSize, minSize, weight) {
    var size = maxSize;
    var lines;
    while (size > minSize) {
      ctx.font = weight + ' ' + size + 'px Fraunces, Georgia, serif';
      lines = wrapLines(ctx, text, maxWidth);
      if (lines.length <= maxLines) break;
      size -= 2;
    }
    return { size: size, lines: lines };
  }

  function drawSpacedText(ctx, text, x, y, spacing) {
    var cx = x;
    for (var i = 0; i < text.length; i++) {
      ctx.fillText(text[i], cx, y);
      cx += ctx.measureText(text[i]).width + spacing;
    }
    return cx - spacing;
  }

  function drawPost(canvas, data, format) {
    var W = format === 'story' ? 1080 : 1080;
    var H = format === 'story' ? 1920 : 1080;
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    var grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, BRAND.inkNight);
    grad.addColorStop(1, BRAND.inkNight2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    var margin = 88;
    var contentW = W - margin * 2;

    // Corner accent: a thin brass frame in the top-right, purely decorative
    ctx.strokeStyle = BRAND.brass;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W - margin, margin - 24);
    ctx.lineTo(W - margin, margin);
    ctx.lineTo(W - margin - 90, margin);
    ctx.stroke();

    var topY = format === 'story' ? margin + 140 : margin + 20;

    // Kicker
    ctx.fillStyle = BRAND.brassLight;
    ctx.font = '600 26px "IBM Plex Mono", ui-monospace, monospace';
    var kickerText = (data.kicker || 'RETROCALCULATED').toUpperCase();
    drawSpacedText(ctx, kickerText, margin, topY, 2.2);

    ctx.strokeStyle = 'rgba(216, 181, 112, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, topY + 26);
    ctx.lineTo(margin + 64, topY + 26);
    ctx.stroke();

    // Title, auto-fit
    var titleMaxSize = format === 'story' ? 84 : 72;
    var titleMinSize = 40;
    var titleMaxLines = format === 'story' ? 7 : 5;
    var fit = fitTitle(ctx, data.title || '', contentW, titleMaxLines, titleMaxSize, titleMinSize, '600');
    ctx.font = '600 ' + fit.size + 'px Fraunces, Georgia, serif';
    ctx.fillStyle = BRAND.cream;
    var lineHeight = fit.size * 1.18;
    var titleStartY = topY + 90;
    fit.lines.forEach(function (line, i) {
      ctx.fillText(line, margin, titleStartY + i * lineHeight);
    });
    var afterTitleY = titleStartY + fit.lines.length * lineHeight + 20;

    // Description
    if (data.description) {
      ctx.font = '400 32px "Source Serif 4", Georgia, serif';
      ctx.fillStyle = BRAND.creamSoft;
      var descLines = wrapLines(ctx, data.description, contentW).slice(0, 4);
      descLines.forEach(function (line, i) {
        ctx.fillText(line, margin, afterTitleY + 46 + i * 44);
      });
    }

    // Footer: brand wordmark + url
    var footerY = H - margin - 8;
    ctx.strokeStyle = 'rgba(216, 181, 112, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, footerY - 46);
    ctx.lineTo(W - margin, footerY - 46);
    ctx.stroke();

    ctx.font = '600 34px Fraunces, Georgia, serif';
    ctx.fillStyle = BRAND.cream;
    var wm = 'Retro';
    ctx.fillText(wm, margin, footerY);
    var wmWidth = ctx.measureText(wm).width;
    ctx.font = 'italic 600 34px Fraunces, Georgia, serif';
    ctx.fillStyle = BRAND.brassLight;
    ctx.fillText('calculated', margin + wmWidth, footerY);

    ctx.font = '400 22px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillStyle = 'rgba(244, 238, 221, 0.55)';
    ctx.textAlign = 'right';
    ctx.fillText('ramanand348.github.io/Ramblings-of-Ram', W - margin, footerY);
    ctx.textAlign = 'left';
  }

  function buildModal() {
    var overlay = document.createElement('div');
    overlay.className = 'ig-modal-overlay';
    overlay.innerHTML =
      '<div class="ig-modal">' +
      '  <button type="button" class="ig-modal-close" aria-label="Close">&times;</button>' +
      '  <div class="ig-modal-canvas-wrap"><canvas class="ig-modal-canvas"></canvas></div>' +
      '  <div class="ig-modal-controls">' +
      '    <div class="ig-format-toggle">' +
      '      <button type="button" class="ig-format-btn active" data-format="square">Square</button>' +
      '      <button type="button" class="ig-format-btn" data-format="story">Story</button>' +
      '    </div>' +
      '    <button type="button" class="ig-download-btn">Download PNG</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function openShareModal(data) {
    var overlay = buildModal();
    var canvas = overlay.querySelector('.ig-modal-canvas');
    var closeBtn = overlay.querySelector('.ig-modal-close');
    var downloadBtn = overlay.querySelector('.ig-download-btn');
    var formatBtns = overlay.querySelectorAll('.ig-format-btn');
    var currentFormat = 'square';

    // Label reflects what will actually happen on this device: a share
    // sheet on phones that support it, a direct file download elsewhere.
    var canUseShare = !!(navigator.canShare && (function () {
      try { return navigator.canShare({ files: [new File([], 'test.png', { type: 'image/png' })] }); }
      catch (e) { return false; }
    })());
    downloadBtn.textContent = canUseShare ? 'Save / Share' : 'Download PNG';

    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(function () { drawPost(canvas, data, currentFormat); });

    formatBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        formatBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentFormat = btn.getAttribute('data-format');
        drawPost(canvas, data, currentFormat);
      });
    });

    function close() { overlay.remove(); }
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });

    downloadBtn.addEventListener('click', function () {
      var slug = (data.title || 'retrocalculated').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      var filename = 'retrocalculated-' + slug + '-' + currentFormat + '.png';

      canvas.toBlob(function (blob) {
        if (!blob) return;

        // Prefer the native share sheet where available (this is what
        // actually lets a phone save straight to Photos or hand the image
        // to the Instagram app directly, and it's the only reliable path
        // on iOS Safari, which does not support the <a download> trick
        // for data URLs).
        var file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: data.title || 'Retrocalculated'
          }).catch(function () { /* user cancelled the share sheet; not an error */ });
          return;
        }

        // Desktop-browser fallback: the <a download> trick, which works
        // fine everywhere except iOS Safari.
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      }, 'image/png');
    });
  }

  function shareIconSVG() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>';
  }

  // Inject a share button onto each real content card in a listing (skips
  // navigational "Browse"/"Category" cards, which aren't articles).
  document.querySelectorAll('.article-card').forEach(function (card) {
    var kickerEl = card.querySelector('.article-kicker');
    var titleEl = card.querySelector('h3');
    if (!titleEl || !kickerEl) return;
    var kickerText = kickerEl.textContent.trim();
    if (/^(Browse|Category)$/i.test(kickerText)) return;

    var descEl = card.querySelector('p:not(.article-kicker)');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ig-share-btn';
    btn.setAttribute('aria-label', 'Generate Instagram post for this article');
    btn.innerHTML = shareIconSVG();
    card.style.position = card.style.position || 'relative';
    card.appendChild(btn);

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openShareModal({
        kicker: kickerText,
        title: titleEl.textContent.trim(),
        description: descEl ? descEl.textContent.trim() : ''
      });
    });
  });

  // Inject a share button into an individual article's reading header, if
  // this page is one (has a .reading-header with an h1 and reading-meta).
  var readingHeader = document.querySelector('.reading-header');
  if (readingHeader) {
    var h1 = readingHeader.querySelector('h1');
    var subtitle = readingHeader.querySelector('.subtitle');
    var metaSpans = readingHeader.querySelectorAll('.reading-meta span');
    if (h1 && metaSpans.length) {
      var kicker = metaSpans[0].textContent.trim();
      var shareBtn = document.createElement('button');
      shareBtn.type = 'button';
      shareBtn.className = 'ig-share-btn ig-share-btn-inline';
      shareBtn.innerHTML = shareIconSVG() + '<span>Instagram post</span>';
      readingHeader.querySelector('.reading-header-inner').appendChild(shareBtn);
      shareBtn.addEventListener('click', function () {
        openShareModal({
          kicker: kicker,
          title: h1.textContent.trim(),
          description: subtitle ? subtitle.textContent.trim() : ''
        });
      });
    }
  }
});

// Mobile TOC collapse: turns the static "Contents" title into a tap target
// that expands/collapses the chapter list, so a long research piece's table
// of contents doesn't push the reader past a screenful before any actual
// article text appears. Desktop is untouched (sticky sidebar, always open);
// this only takes effect within the site's existing 880px mobile breakpoint.
document.addEventListener('DOMContentLoaded', function () {
  var toc = document.querySelector('.toc');
  if (!toc) return;
  var title = toc.querySelector('.toc-title');
  var list = toc.querySelector('ol');
  if (!title || !list) return;

  list.id = list.id || 'toc-list';

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'toc-mobile-toggle';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', list.id);
  btn.innerHTML =
    '<span>' + title.textContent + '</span>' +
    '<svg class="toc-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';

  title.replaceWith(btn);

  btn.addEventListener('click', function () {
    var isOpen = toc.classList.toggle('toc-open');
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  list.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      if (window.innerWidth <= 880) {
        toc.classList.remove('toc-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  });
});

// Scroll-to-top button: fades in once the reader has scrolled past one
// viewport height, smooth-scrolls back to top on click.
document.addEventListener('DOMContentLoaded', function () {
  var btn = document.createElement('button');
  btn.className = 'scroll-top-btn';
  btn.setAttribute('aria-label', 'Scroll to top');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';
  document.body.appendChild(btn);

  var toggleVisibility = function () {
    if (window.scrollY > window.innerHeight * 0.8) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  };

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', toggleVisibility, { passive: true });
  toggleVisibility();
});

// Reading progress bar: only added on long-form article pages (those with
// an .article-body), fills as the reader scrolls through the piece.
document.addEventListener('DOMContentLoaded', function () {
  var articleBody = document.querySelector('.article-body');
  if (!articleBody) return;

  var wrap = document.createElement('div');
  wrap.className = 'reading-progress';
  var bar = document.createElement('div');
  bar.className = 'reading-progress-bar';
  wrap.appendChild(bar);
  document.body.appendChild(wrap);

  var updateProgress = function () {
    var rect = articleBody.getBoundingClientRect();
    var articleTop = rect.top + window.scrollY;
    var articleHeight = articleBody.offsetHeight;
    var viewportHeight = window.innerHeight;
    var scrolled = window.scrollY - articleTop + viewportHeight * 0.5;
    var pct = Math.min(100, Math.max(0, (scrolled / articleHeight) * 100));
    bar.style.width = pct + '%';
  };

  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();
});

// Citation box: tab switching between APA/BibTeX and copy-to-clipboard.
document.addEventListener('DOMContentLoaded', function () {
  var box = document.querySelector('.citation-box');
  if (!box) return;

  var tabs = box.querySelectorAll('.citation-tab');
  var textEl = box.querySelector('.citation-text');
  var copyBtn = box.querySelector('.citation-copy-btn');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      textEl.textContent = tab.getAttribute('data-citation');
    });
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = textEl.textContent;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () {
          var original = copyBtn.textContent;
          copyBtn.textContent = 'Copied';
          copyBtn.classList.add('copied');
          setTimeout(function () {
            copyBtn.textContent = original;
            copyBtn.classList.remove('copied');
          }, 1800);
        });
      }
    });
  }
});

// Scroll-reveal: cards and section headers gently fade/slide in as they
// enter the viewport. The 'js-reveal' class is added synchronously in
// <head> (before paint) so there's no flash of visible-then-hidden content;
// if JS never runs, that class is absent and everything just displays
// normally (progressive enhancement).
document.addEventListener('DOMContentLoaded', function () {
  if (!document.documentElement.classList.contains('js-reveal')) return;

  var items = document.querySelectorAll('.article-card, .section-head, .empty-state, .thesis-figure, .table-scroll');
  if (!items.length) return;

  items.forEach(function (el) { el.classList.add('reveal-item'); });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );

  items.forEach(function (el) { observer.observe(el); });
});

// Theme toggle: persists preference to localStorage. The actual dark/light
// class is applied synchronously by an inline script in <head> on every
// page (before paint, to avoid a flash of the wrong theme); this handler
// just reacts to clicks and updates that same stored preference.
document.addEventListener('DOMContentLoaded', function () {
  var btn = document.querySelector('.theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      try { localStorage.setItem('theme', 'light'); } catch (e) {}
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      try { localStorage.setItem('theme', 'dark'); } catch (e) {}
    }
  });
});

// Site search: fetches a small JSON index of every article on first open,
// then filters client-side as the person types. No server, no build step.
document.addEventListener('DOMContentLoaded', function () {
  var openBtn = document.querySelector('.search-toggle');
  var overlay = document.querySelector('.search-overlay');
  if (!openBtn || !overlay) return;

  var input = overlay.querySelector('.search-input');
  var resultsEl = overlay.querySelector('.search-results');
  var closeBtn = overlay.querySelector('.search-close-btn');
  var indexData = null;
  var indexPromise = null;

  var SITE_ROOT = '/Ramblings-of-Ram';

  function loadIndex() {
    if (indexPromise) return indexPromise;
    indexPromise = fetch(SITE_ROOT + '/assets/search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { indexData = data; return data; })
      .catch(function () { indexData = []; return []; });
    return indexPromise;
  }

  function render(query) {
    if (!indexData) return;
    var q = query.trim().toLowerCase();
    var matches = !q ? indexData : indexData.filter(function (item) {
      return (item.title + ' ' + item.description + ' ' + item.section + ' ' + item.category + ' ' + (item.tags || []).join(' '))
        .toLowerCase().indexOf(q) !== -1;
    });
    if (!matches.length) {
      resultsEl.innerHTML = '<p class="search-empty-state">No results for "' + escapeHtml(query) + '".</p>';
      return;
    }
    resultsEl.innerHTML = matches.map(function (item) {
      return '<a class="search-result" href="' + SITE_ROOT + item.url + '">' +
        '<p class="search-result-kicker">' + escapeHtml(item.section) + ' \u00b7 ' + escapeHtml(item.category) + '</p>' +
        '<h3 class="search-result-title">' + escapeHtml(item.title) + '</h3>' +
        '<p class="search-result-desc">' + escapeHtml(item.description) + '</p>' +
        '</a>';
    }).join('');
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function openOverlay() {
    overlay.classList.add('open');
    loadIndex().then(function () { render(input.value); });
    setTimeout(function () { input.focus(); }, 30);
    document.body.style.overflow = 'hidden';
  }

  function closeOverlay() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', openOverlay);
  closeBtn.addEventListener('click', closeOverlay);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeOverlay();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeOverlay();
    if ((e.key === '/' || (e.metaKey && e.key === 'k')) && !overlay.classList.contains('open') &&
        document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      openOverlay();
    }
  });
  input.addEventListener('input', function () { render(input.value); });
});

// Footnote jump highlight: briefly flashes the target when a footnote
// number or its back-arrow is clicked, so the reader's eye finds the new
// spot immediately instead of scanning the page after the scroll jump.
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('a[href^="#fn"]').forEach(function (link) {
    link.addEventListener('click', function () {
      var id = link.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      target.classList.remove('footnote-highlight');
      void target.offsetWidth; // restart animation if clicked repeatedly
      target.classList.add('footnote-highlight');
    });
  });
});

// Automatic related-articles: replaces the hand-picked related-grid cards
// with ones computed from shared topic tags in search-index.json, so new
// articles automatically surface as related to existing ones without
// needing to hand-edit every past piece's related-articles block.
document.addEventListener('DOMContentLoaded', function () {
  var grid = document.querySelector('.related-articles .related-grid');
  if (!grid) return;

  var canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) return;
  var currentPath = canonical.href.replace(/^https?:\/\/[^/]+\/Ramblings-of-Ram/, '');

  fetch('../../assets/search-index.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var current = data.find(function (item) { return item.url === currentPath; });
      if (!current || !current.tags || !current.tags.length) return;

      var scored = data
        .filter(function (item) { return item.url !== currentPath; })
        .map(function (item) {
          var shared = (item.tags || []).filter(function (t) { return current.tags.indexOf(t) !== -1; });
          return { item: item, score: shared.length };
        })
        .filter(function (x) { return x.score > 0; })
        .sort(function (a, b) { return b.score - a.score; });

      if (!scored.length) return;

      var top = scored.slice(0, 2);
      var sectionLabel = current.section === 'Research' ? 'All research' : 'All notebook posts';
      var sectionHref = current.section === 'Research' ? '../index.html' : '../index.html';

      var html = top.map(function (entry) {
        var it = entry.item;
        var href = '../../' + it.url.replace(/^\//, '');
        var readLabel = it.section === 'Research' ? 'Read the paper →' : 'Read →';
        return (
          '<a class="article-card" href="' + href + '">' +
          '<p class="article-kicker">' + it.section + '</p>' +
          '<h3 style="font-size: 1.2rem;">' + it.title + '</h3>' +
          '<p>' + it.description + '</p>' +
          '<div class="article-meta"><span class="read-link">' + readLabel + '</span></div>' +
          '</a>'
        );
      }).join('') + (
        '<a class="article-card" href="' + sectionHref + '">' +
        '<p class="article-kicker">Browse</p>' +
        '<h3 style="font-size: 1.2rem;">' + sectionLabel + '</h3>' +
        '<p>Every long-form piece, organized by category.</p>' +
        '<div class="article-meta"><span class="read-link">See all →</span></div>' +
        '</a>'
      );

      grid.innerHTML = html;
    })
    .catch(function () { /* leave the hand-picked fallback cards in place on failure */ });
});

// Count-up animation for clean single-value statistics in data tables.
// The real, final value always sits in the markup as plain text (correct
// for no-JS, SEO, and screen readers); JS only overwrites it temporarily
// to animate from 0, then restores the exact original text at the end.
document.addEventListener('DOMContentLoaded', function () {
  var counters = document.querySelectorAll('.count-up[data-count-to]');
  if (!counters.length) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  var animate = function (el) {
    var target = parseFloat(el.getAttribute('data-count-to'));
    if (isNaN(target)) return;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 0;
    var original = el.textContent;
    var duration = 900;
    var start = null;

    function format(n) {
      return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = prefix + format(target * eased) + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = original;
      }
    }
    requestAnimationFrame(step);
  };

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  counters.forEach(function (el) { observer.observe(el); });
});

// ============================================================
// Reader enhancements: tap-to-preview citations, reader controls,
// resume reading, correction link, table fades, figure zoom, mobile
// bottom bar, follow box. All progressive: pages work without JS.
// ============================================================
(function () {
  // Paste your Buttondown (or similar) embed-subscribe URL here to turn on
  // the email box, e.g. 'https://buttondown.com/api/emails/embed-subscribe/USERNAME'
  var SUBSCRIBE_URL = '';
  var ISSUES_URL = 'https://github.com/Ramanand348/Ramblings-of-Ram/issues/new';

  var mem = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  };
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function siteRoot() {
    var s = document.querySelector('script[src$="assets/site.js"]');
    return s ? s.getAttribute('src').replace('assets/site.js', '') : '';
  }
  function articleProgress(article) {
    var rect = article.getBoundingClientRect();
    var top = rect.top + window.scrollY;
    var scrolled = window.scrollY - top + window.innerHeight * 0.5;
    return Math.min(1, Math.max(0, scrolled / article.offsetHeight));
  }

  /* ---------- Follow box (RSS, optional email) ---------- */
  function initFollow() {
    var footer = document.querySelector('.site-footer');
    if (!footer) return;
    var box = el('section', 'follow-box');
    var html = '<div class="follow-inner"><p class="follow-title">Follow along</p>' +
      '<p class="follow-text">New research and notes are posted as they are finished.</p>' +
      '<div class="follow-actions"><a class="follow-link" href="' + siteRoot() + 'rss.xml">RSS feed</a></div>';
    if (SUBSCRIBE_URL) {
      html += '<form class="follow-form" action="' + SUBSCRIBE_URL + '" method="post" target="_blank">' +
        '<label class="visually-hidden" for="follow-email">Email address</label>' +
        '<input id="follow-email" type="email" name="email" placeholder="you@example.com" required>' +
        '<button type="submit">Subscribe by email</button></form>';
    }
    html += '</div>';
    box.innerHTML = html;
    footer.parentNode.insertBefore(box, footer);
  }

  /* ---------- Reader controls (text size, spacing, width) ---------- */
  function initReader() {
    var SIZES = [0.9, 1, 1.1, 1.2, 1.35], LH = [1.55, 1.75, 2.0], WIDTH = [600, 700, 820];
    var st = { s: 1, l: 1, w: 1 };
    try { var sv = JSON.parse(mem.get('rc-read') || 'null'); if (sv) { st.s = +sv.s; st.l = +sv.l; st.w = +sv.w; } } catch (e) {}
    var root = document.documentElement;
    function apply() {
      var def = st.s === 1 && st.l === 1 && st.w === 1;
      if (def) { root.removeAttribute('data-read'); }
      else {
        root.setAttribute('data-read', '1');
        root.style.setProperty('--read-scale', SIZES[st.s]);
        root.style.setProperty('--read-lh', LH[st.l]);
        root.style.setProperty('--read-width', WIDTH[st.w] + 'px');
      }
      mem.set('rc-read', JSON.stringify(st));
      panel.querySelectorAll('[data-group]').forEach(function (g) {
        var k = g.getAttribute('data-group');
        g.querySelectorAll('button').forEach(function (b) {
          b.classList.toggle('on', +b.getAttribute('data-v') === st[k]);
        });
      });
    }
    var panel = el('div', 'reader-panel',
      '<div class="rp-row"><span>Text size</span><div class="rp-seg"><button type="button" data-act="s-">A-</button><button type="button" data-act="s+">A+</button></div></div>' +
      '<div class="rp-row"><span>Spacing</span><div class="rp-seg" data-group="l"><button type="button" data-v="0">Tight</button><button type="button" data-v="1">Normal</button><button type="button" data-v="2">Roomy</button></div></div>' +
      '<div class="rp-row"><span>Width</span><div class="rp-seg" data-group="w"><button type="button" data-v="0">Narrow</button><button type="button" data-v="1">Normal</button><button type="button" data-v="2">Wide</button></div></div>' +
      '<button type="button" class="rp-reset">Reset</button>');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Reading settings');
    panel.hidden = true;
    document.body.appendChild(panel);

    var btn = el('button', 'header-icon-btn reader-btn', 'Aa');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Reading settings');
    btn.setAttribute('aria-expanded', 'false');
    var right = document.querySelector('.site-header-right');
    var theme = right && right.querySelector('.theme-toggle');
    if (right) right.insertBefore(btn, theme || right.firstChild);
    else { var hi = document.querySelector('.site-header-inner'); if (hi) hi.appendChild(btn); }

    function toggle(open) {
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); toggle(panel.hidden); });
    panel.addEventListener('click', function (e) {
      e.stopPropagation();
      var b = e.target.closest('button');
      if (!b) return;
      if (b.classList.contains('rp-reset')) { st = { s: 1, l: 1, w: 1 }; }
      else if (b.getAttribute('data-act') === 's+') { st.s = Math.min(SIZES.length - 1, st.s + 1); }
      else if (b.getAttribute('data-act') === 's-') { st.s = Math.max(0, st.s - 1); }
      else if (b.hasAttribute('data-v')) { st[b.parentNode.getAttribute('data-group')] = +b.getAttribute('data-v'); }
      apply();
    });
    document.addEventListener('click', function () { if (!panel.hidden) toggle(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) toggle(false); });
    apply();
  }

  /* ---------- Tap-to-preview citations ---------- */
  function initCitations(article) {
    var pop = el('div', 'cite-pop');
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Source preview');
    pop.hidden = true;
    document.body.appendChild(pop);
    function close() { pop.hidden = true; }
    function refText(node) {
      var c = node.cloneNode(true);
      c.querySelectorAll('a').forEach(function (a) {
        if (/^[\s\u21a9\u2191\u21a5]*$/.test(a.textContent) || /back|return/i.test(a.className)) a.remove();
      });
      return c.textContent.replace(/[\u21a9\u2191]/g, '').replace(/\s+/g, ' ').replace(/^\s*\[?\d+\.?\]?\s*/, '').trim();
    }
    function show(anchor, target) {
      var id = target.id;
      pop.innerHTML = '<button type="button" class="cp-close" aria-label="Close">\u00d7</button>' +
        '<p class="cp-num"></p><p class="cp-text"></p><a class="cp-jump" href="#' + id + '">Jump to reference</a>';
      pop.querySelector('.cp-num').textContent = 'Source ' + anchor.textContent.replace(/[\[\]]/g, '').trim();
      pop.querySelector('.cp-text').textContent = refText(target);
      pop.hidden = false;
      var rect = anchor.getBoundingClientRect();
      var w = Math.min(360, window.innerWidth - 24);
      pop.style.width = w + 'px';
      var left = Math.min(Math.max(rect.left - 20, 12), window.innerWidth - w - 12);
      var h = pop.offsetHeight;
      var top = rect.bottom + 8;
      if (top + h > window.innerHeight - 12) top = Math.max(12, rect.top - h - 8);
      pop.style.left = left + 'px';
      pop.style.top = top + 'px';
      pop.querySelector('.cp-close').addEventListener('click', close);
      pop.querySelector('.cp-jump').addEventListener('click', function () {
        close();
        setTimeout(function () {
          target.classList.remove('footnote-highlight');
          void target.offsetWidth;
          target.classList.add('footnote-highlight');
        }, 50);
      });
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (a && article.contains(a) && a.closest('sup') && /^#(ref|fn)/.test(a.getAttribute('href') || '')) {
        var t = document.getElementById(a.getAttribute('href').slice(1));
        if (t) { e.preventDefault(); e.stopPropagation(); show(a, t); return; }
      }
      if (!pop.hidden && !pop.contains(e.target)) close();
    }, true);
    window.addEventListener('scroll', function () { if (!pop.hidden && window.innerWidth > 600) close(); }, { passive: true });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---------- Resume reading ---------- */
  function initResume() {
    var key = 'rc-pos:' + location.pathname;
    var h1 = document.querySelector('.reading-header h1');
    var title = (h1 ? h1.textContent : document.title).trim();
    var saved = null;
    try { saved = JSON.parse(mem.get(key) || 'null'); } catch (e) {}
    function frac() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    }
    if (saved && saved.p > 0.04 && saved.p < 0.96 && !location.hash && window.scrollY < 200) {
      var toast = el('div', 'resume-toast',
        '<span>Pick up where you left off (' + Math.round(saved.p * 100) + '%)?</span>' +
        '<button type="button" class="rt-go">Resume</button><button type="button" class="rt-x">Start over</button>');
      document.body.appendChild(toast);
      var gone = setTimeout(function () { toast.remove(); }, 15000);
      toast.querySelector('.rt-go').addEventListener('click', function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: saved.p * max, behavior: 'smooth' });
        clearTimeout(gone); toast.remove();
      });
      toast.querySelector('.rt-x').addEventListener('click', function () {
        mem.set(key, JSON.stringify({ p: 0, t: title, h: location.pathname, ts: Date.now() }));
        clearTimeout(gone); toast.remove();
      });
    }
    var tm = null;
    window.addEventListener('scroll', function () {
      clearTimeout(tm);
      tm = setTimeout(function () {
        mem.set(key, JSON.stringify({ p: frac(), t: title, h: location.pathname, ts: Date.now() }));
      }, 350);
    }, { passive: true });
  }

  function initContinueStrip() {
    var main = document.querySelector('main');
    if (!main || !document.querySelector('.hero-compact')) return;
    var best = null;
    try {
      for (var i = 0; i < window.localStorage.length; i++) {
        var k = window.localStorage.key(i);
        if (k && k.indexOf('rc-pos:') === 0) {
          var v = JSON.parse(window.localStorage.getItem(k));
          if (v && v.p > 0.04 && v.p < 0.96 && v.h && v.t && (!best || v.ts > best.ts)) best = v;
        }
      }
    } catch (e) {}
    if (!best) return;
    var sec = el('section', 'section continue-section');
    var a = el('a', 'continue-strip');
    a.href = best.h;
    a.innerHTML = '<span class="cs-label">Continue reading</span><span class="cs-title"></span><span class="cs-pct">' + Math.round(best.p * 100) + '%</span>';
    a.querySelector('.cs-title').textContent = best.t;
    sec.appendChild(a);
    main.insertBefore(sec, main.firstChild);
  }

  /* ---------- Correction link (research pages) ---------- */
  function initCorrections(article) {
    if (location.pathname.indexOf('/research/') === -1) return;
    var h1 = document.querySelector('.reading-header h1');
    var title = (h1 ? h1.textContent : document.title).trim();
    var url = ISSUES_URL + '?title=' + encodeURIComponent('Correction: ' + title) +
      '&body=' + encodeURIComponent('Page: ' + location.href + '\n\nWhat is wrong or missing:\n\nBetter source (if any):\n');
    var box = el('aside', 'correction-box',
      '<p class="cb-title">Spot an error or a better source?</p>' +
      '<p>Research pieces here are sourced, and sources can be wrong or go out of date. If something looks off, tell me and I will check it.</p>' +
      '<a class="cb-link" href="' + url + '" target="_blank" rel="noopener">Send a correction</a>');
    article.appendChild(box);
  }

  /* ---------- Scrollable tables: edge fades ---------- */
  function initTables(article) {
    article.querySelectorAll('.table-scroll').forEach(function (sc) {
      var wrap = el('div', 'table-scroll-wrap');
      sc.parentNode.insertBefore(wrap, sc);
      wrap.appendChild(sc);
      function upd() {
        var max = sc.scrollWidth - sc.clientWidth;
        wrap.classList.toggle('can-left', sc.scrollLeft > 4);
        wrap.classList.toggle('can-right', sc.scrollLeft < max - 4);
      }
      sc.addEventListener('scroll', upd, { passive: true });
      window.addEventListener('resize', upd);
      upd();
    });
  }

  /* ---------- Figure zoom ---------- */
  function initZoom(article) {
    var targets = article.querySelectorAll('.thesis-figure img, figure img, .thesis-figure svg, figure svg');
    if (!targets.length) return;
    var box = el('div', 'lightbox',
      '<button type="button" class="lb-close" aria-label="Close image">\u00d7</button>' +
      '<div class="lb-stage"></div><p class="lb-hint">Tap the image to zoom, pinch for more</p>');
    box.hidden = true;
    document.body.appendChild(box);
    var stage = box.querySelector('.lb-stage');
    function close() {
      box.hidden = true; stage.innerHTML = '';
      box.classList.remove('zoomed'); document.body.classList.remove('lb-open');
    }
    function open(t) {
      var c = t.cloneNode(true);
      c.removeAttribute('width'); c.removeAttribute('height'); c.removeAttribute('class');
      stage.innerHTML = ''; stage.appendChild(c);
      box.classList.remove('zoomed'); box.hidden = false;
      document.body.classList.add('lb-open');
    }
    targets.forEach(function (t) {
      t.classList.add('zoomable');
      t.setAttribute('tabindex', '0');
      t.addEventListener('click', function () { open(t); });
      t.addEventListener('keydown', function (e) { if (e.key === 'Enter') open(t); });
    });
    stage.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('img, svg')) box.classList.toggle('zoomed');
      else close();
    });
    box.querySelector('.lb-close').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !box.hidden) close(); });
  }

  /* ---------- Mobile bottom bar ---------- */
  function initMobileBar(article) {
    var words = (article.textContent || '').split(/\s+/).length;
    var totalMin = words / 230;
    var tocLinks = document.querySelectorAll('.toc a[href^="#"]');
    var bar = el('div', 'mobile-bar',
      '<div class="mb-track"><div class="mb-fill"></div></div>' +
      '<div class="mb-row">' +
      (tocLinks.length ? '<button type="button" class="mb-contents">Contents</button>' : '<span></span>') +
      '<span class="mb-left"></span>' +
      '<button type="button" class="mb-top" aria-label="Back to top">\u2191</button></div>');
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Reading progress');
    document.body.appendChild(bar);
    document.body.classList.add('has-mobile-bar');
    var fill = bar.querySelector('.mb-fill'), left = bar.querySelector('.mb-left');

    function update() {
      var p = articleProgress(article);
      fill.style.width = (p * 100) + '%';
      var mins = Math.ceil(totalMin * (1 - p));
      left.textContent = p > 0.98 ? 'Finished' : (mins <= 1 ? 'Under 1 min left' : mins + ' min left');
      bar.classList.toggle('visible', window.scrollY > 300);
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    bar.querySelector('.mb-top').addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    if (tocLinks.length) {
      var sheet = el('div', 'toc-sheet', '<div class="ts-backdrop"></div><div class="ts-panel"><p class="ts-title">Contents</p><ol></ol></div>');
      sheet.hidden = true;
      var ol = sheet.querySelector('ol');
      tocLinks.forEach(function (a) {
        var li = document.createElement('li');
        var l = document.createElement('a');
        l.href = a.getAttribute('href'); l.textContent = a.textContent;
        l.addEventListener('click', function () { sheet.hidden = true; });
        li.appendChild(l); ol.appendChild(li);
      });
      document.body.appendChild(sheet);
      bar.querySelector('.mb-contents').addEventListener('click', function () { sheet.hidden = false; });
      sheet.querySelector('.ts-backdrop').addEventListener('click', function () { sheet.hidden = true; });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') sheet.hidden = true; });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var article = document.querySelector('.article-body');
    initFollow();
    if (article) {
      initReader();
      initCitations(article);
      initResume();
      initCorrections(article);
      initTables(article);
      initZoom(article);
      initMobileBar(article);
    } else {
      initContinueStrip();
    }
  });
})();

// ============================================================
// Tablet and desktop extras: sidebar reading meter and hover
// previews for citations (mouse only). Phones keep the bottom bar.
// ============================================================
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var article = document.querySelector('.article-body');
    if (!article) return;

    function progress() {
      var rect = article.getBoundingClientRect();
      var top = rect.top + window.scrollY;
      var scrolled = window.scrollY - top + window.innerHeight * 0.5;
      return Math.min(1, Math.max(0, scrolled / article.offsetHeight));
    }

    /* Sidebar meter: percent read and time left, under the contents list */
    var toc = document.querySelector('.toc');
    if (toc) {
      var totalMin = (article.textContent || '').split(/\s+/).length / 230;
      var meter = document.createElement('div');
      meter.className = 'toc-meter';
      meter.innerHTML = '<div class="tm-track"><div class="tm-fill"></div></div><p class="tm-text"></p>';
      toc.appendChild(meter);
      var fill = meter.querySelector('.tm-fill'), text = meter.querySelector('.tm-text');
      var update = function () {
        var p = progress();
        fill.style.width = (p * 100) + '%';
        var mins = Math.ceil(totalMin * (1 - p));
        text.textContent = p > 0.98 ? 'Finished' : Math.round(p * 100) + '% read, ' + (mins <= 1 ? 'under 1 min left' : mins + ' min left');
      };
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    }

    /* Hover previews for citations, only where a mouse is present */
    if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var pop = document.querySelector('.cite-pop');
    if (!pop) return;
    var openTimer = null, closeTimer = null, pinned = false;
    function isCite(a) {
      return a && article.contains(a) && a.closest('sup') && /^#(ref|fn)/.test(a.getAttribute('href') || '');
    }
    document.addEventListener('mouseover', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (isCite(a)) {
        clearTimeout(closeTimer);
        clearTimeout(openTimer);
        openTimer = setTimeout(function () {
          if (!pinned) a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        }, 220);
      } else if (pop.contains(e.target)) {
        clearTimeout(closeTimer);
      }
    });
    document.addEventListener('mouseout', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (isCite(a) || pop.contains(e.target)) {
        clearTimeout(openTimer);
        clearTimeout(closeTimer);
        closeTimer = setTimeout(function () { if (!pinned) pop.hidden = true; }, 350);
      }
    });
    document.addEventListener('click', function (e) {
      if (!e.isTrusted) return;
      var a = e.target.closest ? e.target.closest('a') : null;
      pinned = !!isCite(a);
    }, true);
  });
})();
