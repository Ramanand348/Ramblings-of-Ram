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
      var link = document.createElement('a');
      var slug = (data.title || 'retrocalculated').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      link.download = 'retrocalculated-' + slug + '-' + currentFormat + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
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

  var items = document.querySelectorAll('.article-card, .section-head, .empty-state');
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
      return (item.title + ' ' + item.description + ' ' + item.section + ' ' + item.category)
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


