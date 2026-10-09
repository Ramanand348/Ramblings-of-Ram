// Private session tally for EA FC problems. Everything is stored in this browser only.
(function () {
  var KEY_S = 'rc-tally-sessions', KEY_C = 'rc-tally-current';
  var TYPES = [
    ['server_drop', 'Teammates dropped by a server problem'],
    ['live_join', 'Live-join or substitution hang'],
    ['kickoff', 'Kick-off glitch'],
    ['fault_loss', 'Loss logged from a server fault or forced quit'],
    ['other', 'Other problem']
  ];
  var store = {
    get: function (k) { try { return JSON.parse(window.localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { window.localStorage.removeItem(k); } catch (e) {} }
  };
  function blank() { var c = { mode: 'Clubs', matches: 0, note: '' }; TYPES.forEach(function (t) { c[t[0]] = 0; }); return c; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function stamp(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function issuesOf(s) { return TYPES.reduce(function (a, t) { return a + (+s[t[0]] || 0); }, 0); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('tally');
    if (!root) return;
    var cur = Object.assign(blank(), store.get(KEY_C) || {});
    var sessions = store.get(KEY_S) || [];
    var status = document.getElementById('t-status');
    var counters = document.getElementById('t-counters');

    function say(msg) { status.textContent = msg; }
    function persist() { if (!store.set(KEY_C, cur)) say('Storage is unavailable in this browser, so counts will not persist.'); }

    // build counters
    function counterRow(key, label) {
      return '<div class="counter" data-key="' + key + '"><span class="c-label">' + label + '</span>' +
        '<span class="c-ctrl"><button type="button" class="c-minus" aria-label="One fewer: ' + label + '">-</button>' +
        '<output aria-live="off">0</output>' +
        '<button type="button" class="c-plus" aria-label="One more: ' + label + '">+</button></span></div>';
    }
    document.getElementById('t-matches').innerHTML = counterRow('matches', 'Matches played');
    counters.innerHTML = TYPES.map(function (t) { return counterRow(t[0], t[1]); }).join('');

    function renderCurrent() {
      root.querySelectorAll('.counter').forEach(function (c) { c.querySelector('output').textContent = cur[c.getAttribute('data-key')]; });
      document.getElementById('t-mode').value = cur.mode;
      document.getElementById('t-note').value = cur.note;
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var c = b.closest('.counter');
      if (c) {
        var k = c.getAttribute('data-key');
        cur[k] = Math.max(0, (+cur[k] || 0) + (b.classList.contains('c-plus') ? 1 : -1));
        persist(); renderCurrent(); say('');
      }
    });
    document.getElementById('t-mode').addEventListener('change', function (e) { cur.mode = e.target.value; persist(); });
    document.getElementById('t-note').addEventListener('input', function (e) { cur.note = e.target.value.slice(0, 300); persist(); });

    document.getElementById('t-save').addEventListener('click', function () {
      if (!cur.matches && !issuesOf(cur)) { say('Add at least one match or one problem before saving.'); return; }
      var rec = Object.assign({}, cur, { id: Date.now(), date: stamp(new Date()) });
      sessions.unshift(rec);
      store.set(KEY_S, sessions);
      cur = blank(); persist(); renderCurrent(); renderAll();
      say('Session saved to this device.');
    });
    document.getElementById('t-discard').addEventListener('click', function () {
      cur = blank(); persist(); renderCurrent(); say('Current session cleared.');
    });

    function renderSummary() {
      var box = document.getElementById('t-summary');
      if (!sessions.length) { box.innerHTML = '<p class="tool-empty">No saved sessions yet. Log a session above and save it to see totals here.</p>'; return; }
      var n = sessions.length, withIssue = sessions.filter(function (s) { return issuesOf(s) > 0; }).length;
      var total = sessions.reduce(function (a, s) { return a + issuesOf(s); }, 0);
      var matches = sessions.reduce(function (a, s) { return a + (+s.matches || 0); }, 0);
      var html = '<dl class="tool-stats">' +
        '<div><dt>Sessions saved</dt><dd>' + n + '</dd></div>' +
        '<div><dt>Sessions with a problem</dt><dd>' + withIssue + ' (' + Math.round(100 * withIssue / n) + '%)</dd></div>' +
        '<div><dt>Problems logged</dt><dd>' + total + '</dd></div>' +
        '<div><dt>Problems per session</dt><dd>' + (total / n).toFixed(1) + '</dd></div>' +
        '<div><dt>Matches logged</dt><dd>' + matches + '</dd></div>' +
        '<div><dt>Problems per 10 matches</dt><dd>' + (matches ? (10 * total / matches).toFixed(1) : 'n/a') + '</dd></div></dl>';
      html += '<div class="table-scroll"><table class="dataset-table"><thead><tr><th>Problem</th><th>Total</th><th>Sessions affected</th></tr></thead><tbody>';
      TYPES.forEach(function (t) {
        var tot = sessions.reduce(function (a, s) { return a + (+s[t[0]] || 0); }, 0);
        var aff = sessions.filter(function (s) { return (+s[t[0]] || 0) > 0; }).length;
        html += '<tr><td>' + esc(t[1]) + '</td><td>' + tot + '</td><td>' + aff + ' of ' + n + ' (' + Math.round(100 * aff / n) + '%)</td></tr>';
      });
      box.innerHTML = html + '</tbody></table></div>';
    }
    function renderHistory() {
      var body = document.getElementById('t-history');
      body.innerHTML = '';
      sessions.forEach(function (s, i) {
        var tr = document.createElement('tr');
        var cells = [s.date, s.mode, s.matches, issuesOf(s), s.note || ''];
        cells.forEach(function (v) { var td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
        var td = document.createElement('td'), b = document.createElement('button');
        b.type = 'button'; b.className = 'btn-small'; b.textContent = 'Delete';
        b.setAttribute('aria-label', 'Delete the session from ' + s.date);
        b.addEventListener('click', function () { sessions.splice(i, 1); store.set(KEY_S, sessions); renderAll(); say('Session deleted.'); });
        td.appendChild(b); tr.appendChild(td); body.appendChild(tr);
      });
      document.getElementById('t-history-wrap').hidden = !sessions.length;
    }
    function renderAll() { renderSummary(); renderHistory(); }

    function csvCell(v) {
      var s = String(v == null ? '' : v);
      if (/^[=+\-@]/.test(s) && isNaN(Number(s))) s = "'" + s;
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }
    function csv() {
      var head = ['date', 'mode', 'matches'].concat(TYPES.map(function (t) { return t[0]; }), ['note']);
      var rows = sessions.slice().reverse().map(function (s) {
        return [s.date, s.mode, s.matches].concat(TYPES.map(function (t) { return s[t[0]] || 0; }), [s.note || '']).map(csvCell).join(',');
      });
      return [head.join(',')].concat(rows).join('\n') + '\n';
    }
    document.getElementById('t-download').addEventListener('click', function () {
      if (!sessions.length) { say('Nothing to export yet.'); return; }
      var blob = new Blob([csv()], { type: 'text/csv' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'ea-fc-session-tally.csv';
      document.body.appendChild(a); a.click(); a.remove();
      say('CSV downloaded.');
    });
    document.getElementById('t-copy').addEventListener('click', function () {
      if (!sessions.length) { say('Nothing to copy yet.'); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(csv()).then(function () { say('CSV copied to the clipboard.'); }, function () { say('Copy failed. Use Download instead.'); });
      else say('Copy is not available here. Use Download instead.');
    });
    document.getElementById('t-clear').addEventListener('click', function () {
      if (!sessions.length && !issuesOf(cur) && !cur.matches) { say('There is nothing to clear.'); return; }
      if (window.confirm('Delete every saved session and the current count from this device? This cannot be undone.')) {
        sessions = []; store.del(KEY_S); cur = blank(); store.del(KEY_C); renderCurrent(); renderAll(); say('All data cleared.');
      }
    });

    renderCurrent(); renderAll();
  });
})();
