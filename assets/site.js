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


