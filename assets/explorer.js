// Interactive storage balance for the Chembarambakkam article.
// Same constant-inflow model as the article: storage changes by (inflow - release) over the event;
// once the tank is full, the release has to match the inflow.
(function () {
  var CAPACITY = 3645;      // mcft
  var SUPPLY_MLD = 650;     // illustrative supply figure used in the article
  var CF = 0.0283168;

  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function el(id) { return document.getElementById(id); }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.querySelector('[data-explorer="flood"]');
    if (!root) return;
    var inp = { inflow: el('ex-inflow'), hours: el('ex-hours'), cap: el('ex-cap'), start: el('ex-start') };
    var out = { inflow: el('ex-inflow-out'), hours: el('ex-hours-out'), cap: el('ex-cap-out'), start: el('ex-start-out') };
    var res = el('ex-results'), chart = el('ex-chart');

    var PRESETS = {
      actual:  { inflow: 29000, hours: 25, cap: 29000, start: 3377 },
      audit:   { inflow: 29000, hours: 6,  cap: 12000, start: 3377 },
      cap12:   { inflow: 29000, hours: 25, cap: 12000, start: 3377 },
      room12:  { inflow: 29000, hours: 25, cap: 12000, start: 2112 },
      trigger: { inflow: 29000, hours: 25, cap: 23500, start: 3145 }
    };

    function model(v) {
      var T = v.hours * 3600;
      var net = v.inflow - v.cap;                         // cusecs
      var inflowVol = v.inflow * T / 1e6;                 // mcft
      var roomAvail = CAPACITY - v.start;
      var roomNeeded = Math.max(0, net * T / 1e6);
      var r = { inflowVol: inflowVol, roomAvail: roomAvail, roomNeeded: roomNeeded, net: net };
      r.shortfall = Math.max(0, roomNeeded - roomAvail);
      r.startNeeded = CAPACITY - roomNeeded;
      if (net <= 0) {
        r.fills = false;
        r.endStorage = Math.max(0, v.start + net * T / 1e6);
      } else {
        var tFill = roomAvail * 1e6 / (net * 3600);       // hours
        r.fills = tFill < v.hours;
        r.tFill = tFill;
        r.endStorage = r.fills ? CAPACITY : v.start + net * T / 1e6;
        r.excess = r.fills ? net * (v.hours - tFill) * 3600 / 1e6 : 0;
      }
      return r;
    }

    function drawChart(v, r) {
      var W = 640, H = 250, x0 = 60, x1 = 620, y0 = 215, y1 = 25;
      var maxS = CAPACITY * 1.05;
      var sx = function (h) { return x0 + (h / v.hours) * (x1 - x0); };
      var sy = function (s) { return y0 - (Math.max(0, Math.min(maxS, s)) / maxS) * (y0 - y1); };
      var pts = [[0, v.start]];
      if (r.net > 0 && r.fills) { pts.push([r.tFill, CAPACITY]); pts.push([v.hours, CAPACITY]); }
      else { pts.push([v.hours, r.endStorage]); }
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + sx(p[0]).toFixed(1) + ',' + sy(p[1]).toFixed(1); }).join(' ');
      var ticks = '';
      [0, 1000, 2000, 3000].forEach(function (s) {
        ticks += '<line x1="' + x0 + '" y1="' + sy(s).toFixed(1) + '" x2="' + x1 + '" y2="' + sy(s).toFixed(1) + '" stroke="var(--line-on-parchment)" stroke-dasharray="2 4"/>' +
          '<text x="' + (x0 - 8) + '" y="' + (sy(s) + 4).toFixed(1) + '" text-anchor="end">' + fmt(s) + '</text>';
      });
      var xt = '';
      for (var i = 0; i <= 4; i++) {
        var h = v.hours * i / 4;
        xt += '<text x="' + sx(h).toFixed(1) + '" y="' + (y0 + 20) + '" text-anchor="middle">' + (Math.round(h * 10) / 10) + '</text>';
      }
      chart.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + (H + 25) + '" role="img" aria-label="Reservoir storage over the event" style="width:100%;height:auto;font-family:var(--font-mono);font-size:11px;fill:var(--ink-soft)">' +
        ticks + xt +
        '<line x1="' + x0 + '" y1="' + y0 + '" x2="' + x1 + '" y2="' + y0 + '" stroke="var(--ink-soft)"/>' +
        '<line x1="' + x0 + '" y1="' + sy(CAPACITY).toFixed(1) + '" x2="' + x1 + '" y2="' + sy(CAPACITY).toFixed(1) + '" stroke="var(--rust)" stroke-dasharray="6 4"/>' +
        '<text x="' + (x1) + '" y="' + (sy(CAPACITY) - 6).toFixed(1) + '" text-anchor="end" fill="var(--rust)">Full: 3,645 mcft</text>' +
        '<path d="' + d + '" fill="none" stroke="var(--verdigris)" stroke-width="2.5"/>' +
        '<text x="' + ((x0 + x1) / 2) + '" y="' + (H + 18) + '" text-anchor="middle">Hours into the event</text>' +
        '<text x="14" y="' + ((y0 + y1) / 2) + '" transform="rotate(-90 14 ' + ((y0 + y1) / 2) + ')" text-anchor="middle">Storage (mcft)</text>' +
        '</svg>';
    }

    function row(label, value) { return '<div class="ex-row"><dt>' + label + '</dt><dd>' + value + '</dd></div>'; }

    function update() {
      var v = {
        inflow: +inp.inflow.value, hours: +inp.hours.value, cap: +inp.cap.value, start: +inp.start.value
      };
      out.inflow.textContent = fmt(v.inflow) + ' cusecs';
      out.hours.textContent = v.hours + ' h';
      out.cap.textContent = fmt(v.cap) + ' cusecs';
      out.start.textContent = fmt(v.start) + ' mcft (' + Math.round(100 * v.start / CAPACITY) + '%)';
      var r = model(v), html = '', verdict, cls;
      if (r.net <= 0) {
        verdict = 'The cap is at or above the inflow, so the tank does not gain water. It ends at ' + fmt(r.endStorage) + ' mcft.';
        cls = 'ok';
      } else if (!r.fills) {
        verdict = 'The tank stays below full and ends at ' + fmt(r.endStorage) + ' mcft, so a release of ' + fmt(v.cap) + ' cusecs can hold for the whole event.';
        cls = 'ok';
      } else {
        verdict = 'The tank fills after ' + (Math.round(r.tFill * 10) / 10) + ' hours. After that the release has to rise to the inflow, about ' + fmt(v.inflow) + ' cusecs, and ' + fmt(r.excess) + ' mcft passes over the cap.';
        cls = 'warn';
      }
      html += '<p class="ex-verdict ' + cls + '">' + verdict + '</p><dl class="ex-stats">';
      html += row('Inflow volume over the event', fmt(r.inflowVol) + ' mcft (' + Math.round(100 * r.inflowVol / CAPACITY) + '% of capacity)');
      html += row('Room in the tank at the start', fmt(r.roomAvail) + ' mcft');
      html += row('Room needed to hold this cap', fmt(r.roomNeeded) + ' mcft');
      html += row('Starting storage that would be needed', fmt(Math.min(CAPACITY, r.startNeeded)) + ' mcft (' + Math.round(100 * Math.min(CAPACITY, r.startNeeded) / CAPACITY) + '%)');
      if (r.shortfall > 0) {
        var days = r.shortfall * 28.3168 / SUPPLY_MLD;
        html += row('Extra empty space needed', fmt(r.shortfall) + ' mcft, about ' + Math.round(days) + ' days of supply at ' + SUPPLY_MLD + ' MLD');
      }
      html += '</dl>';
      res.innerHTML = html;
      drawChart(v, r);
    }

    Object.keys(inp).forEach(function (k) { inp[k].addEventListener('input', update); });
    root.querySelectorAll('[data-preset]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = PRESETS[b.getAttribute('data-preset')];
        Object.keys(p).forEach(function (k) { inp[k].value = p[k]; });
        root.querySelectorAll('[data-preset]').forEach(function (o) { o.classList.toggle('on', o === b); });
        update();
      });
    });
    update();
  });
})();
