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
          setTimeout(function () { copyBtn.textContent = original; }, 1800);
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
