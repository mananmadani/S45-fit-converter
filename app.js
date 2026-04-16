'use strict';

/* ── HAPTIC ── */
const hap = (ms = 30) => { if ('vibrate' in navigator) navigator.vibrate(ms); };

/* ── TOAST ── */
let _tt;
function toast(msg, ms = 1800) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.remove('show'), ms);
}

/* ── TAB SWITCH ── */
function showTab(idx) {
  document.querySelectorAll('.panel').forEach((p, i) => p.classList.toggle('active', i === idx));
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
    t.setAttribute('aria-selected', i === idx ? 'true' : 'false');
  });
  hap(20);
}
document.getElementById('tab-shrinkage').onclick = () => showTab(0);
document.getElementById('tab-fit').onclick = () => showTab(1);

/* ── MATH ── */
const snap8 = v => Math.round(v * 8) / 8;
const prewash = (t, s) => {
  const r = s / 100;
  return (!isFinite(t) || !isFinite(r) || r >= 1) ? null : t / (1 - r);
};

/* ── CLIPBOARD ── */
function copyText(text) {
  navigator.clipboard.writeText(text)
    .then(() => toast('COPIED'))
    .catch(() => toast('COPY FAILED'));
}

/* ── COPY ICON SVG ── */
const COPY_ICO = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

/* ── RESULT ROW BUILDER ── */
function makeRow(dim, mainVal, tag, tagClass, rawVal, copyVal) {
  const raw = rawVal !== undefined ? `<span class="res-raw">(${rawVal})</span>` : '';
  return `
    <div class="res-row">
      <span class="res-dim">${dim}</span>
      ${raw}
      <span class="res-val ${tagClass}">${mainVal}</span>
      <span class="res-tag ${tagClass}">${tag}</span>
      <button class="cp-btn" onclick="copyText('${copyVal}')" aria-label="Copy">${COPY_ICO}</button>
    </div>`;
}

/* ══════════════════════════════════════════
   SHRINKAGE CALCULATOR
══════════════════════════════════════════ */
const FIELDS = [
  { dim: 'LEN', b: 'lb', a: 'la', key: 'length' },
  { dim: 'WST', b: 'wb', a: 'wa', key: 'waist'  },
  { dim: 'THG', b: 'tb', a: 'ta', key: 'thigh'  },
  { dim: 'BOT', b: 'bb', a: 'ba', key: 'bottom' },
];

document.getElementById('shrinkageForm').addEventListener('submit', function (e) {
  e.preventDefault();
  hap([18, 24, 18]);

  const cache = {};
  let html = '';
  let hasData = false;
  let copyLines = [];

  FIELDS.forEach(f => {
    const b = parseFloat(document.getElementById(f.b).value);
    const a = parseFloat(document.getElementById(f.a).value);
    cache[f.key] = '';
    if (isNaN(b) || isNaN(a) || b <= 0) return;

    hasData = true;
    const pct = (b - a) / b * 100;
    const pctStr = pct.toFixed(5);
    cache[f.key] = pctStr;

    const abs = Math.abs(pct).toFixed(3);
    const shrunk = pct > 0.001;
    const grew   = pct < -0.001;
    const tagClass = shrunk ? 'tag-shrunk' : grew ? 'tag-grew' : 'tag-zero';
    const tag      = shrunk ? '▼ SHRUNK'    : grew ? '▲ GREW'    : 'NO CHG';

    copyLines.push(`${f.dim}: ${pctStr}%`);
    html += makeRow(f.dim, abs + '%', tag, tagClass, undefined, pctStr);
  });

  if (!hasData) { toast('ENTER AT LEAST ONE BEFORE/AFTER PAIR'); return; }

  const panel = document.getElementById('shrink-results');
  document.getElementById('shrink-rows').innerHTML = html;
  panel.removeAttribute('hidden');

  // Copy all handler
  document.getElementById('copy-shrink').onclick = () => copyText(copyLines.join('\n'));

  window._s45cache = cache;
  document.getElementById('send-btn').style.display = 'block';

  // Scroll results into view
  setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
});

/* ── SEND TO FIT ── */
document.getElementById('send-btn').addEventListener('click', function () {
  const c = window._s45cache || {};
  const map = { length: 'al', waist: 'aw', thigh: 'ath', bottom: 'ab' };
  Object.entries(map).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el && c[key]) el.value = c[key];
  });
  hap([14, 22, 14]);
  showTab(1);
  toast('SHRINKAGE % LOADED');
});

/* ══════════════════════════════════════════
   FIT CONVERTER
══════════════════════════════════════════ */
const FIT_FIELDS = [
  { dim: 'LEN', t: 'tl',   a: 'al',  key: 'length' },
  { dim: 'WST', t: 'tw',   a: 'aw',  key: 'waist'  },
  { dim: 'THG', t: 'tt',   a: 'ath', key: 'thigh'  },
  { dim: 'BOT', t: 'tbot', a: 'ab',  key: 'bottom' },
];

document.getElementById('fitForm').addEventListener('submit', function (e) {
  e.preventDefault();
  hap([22, 28, 20]);

  const farma = parseFloat(document.getElementById('fs').value);

  const rA = {}, rF = {}, sA = {}, sF = {}, adj = {};
  let hasData = false;

  FIT_FIELDS.forEach(f => {
    const t  = parseFloat(document.getElementById(f.t).value);
    const as = parseFloat(document.getElementById(f.a).value);

    if (!isNaN(t) && !isNaN(as)) {
      const raw = prewash(t, as);
      if (raw !== null) { rA[f.key] = raw; sA[f.key] = snap8(raw); hasData = true; }
    }
    if (!isNaN(t) && !isNaN(farma)) {
      const raw = prewash(t, farma);
      if (raw !== null) { rF[f.key] = raw; sF[f.key] = snap8(raw); hasData = true; }
    }
    if (sA[f.key] !== undefined && sF[f.key] !== undefined) {
      adj[f.key] = +(sA[f.key] - sF[f.key]).toFixed(3);
    }
  });

  if (!hasData) { toast('ENTER TARGET + SHRINKAGE VALUES'); return; }

  let html = '';
  let copyLines = [];

  /* Section: Actual */
  const actualRows = FIT_FIELDS
    .filter(f => sA[f.key] !== undefined)
    .map(f => {
      const v = sA[f.key].toFixed(3);
      const raw = rA[f.key].toFixed(3);
      copyLines.push(`ACTUAL ${f.dim}: ${v}"`);
      return makeRow(f.dim, `${v}"`, `RAW:${raw}`, '', undefined, v);
    }).join('');

  if (actualRows) {
    html += `<div class="res-section">
      <div class="res-section-head">BEFORE WASH — ACTUAL</div>
      ${actualRows}
    </div>`;
  }

  /* Section: Farma */
  const farmaRows = FIT_FIELDS
    .filter(f => sF[f.key] !== undefined)
    .map(f => {
      const v = sF[f.key].toFixed(3);
      const raw = rF[f.key].toFixed(3);
      copyLines.push(`FARMA  ${f.dim}: ${v}"`);
      return makeRow(f.dim, `${v}"`, `RAW:${raw}`, '', undefined, v);
    }).join('');

  if (farmaRows) {
    html += `<div class="res-section">
      <div class="res-section-head">BEFORE WASH — FARMA</div>
      ${farmaRows}
    </div>`;
  }

  /* Section: Adjustment */
  const adjRows = FIT_FIELDS
    .filter(f => adj[f.key] !== undefined)
    .map(f => {
      const v = adj[f.key];
      const sign = v > 0 ? '+' : '';
      const cls  = v > 0.0001 ? 'pos' : v < -0.0001 ? 'neg' : '';
      const tag  = v > 0.0001 ? '+ADD' : v < -0.0001 ? '−CUT' : 'EXACT';
      const tagC = v > 0.0001 ? 'tag-pos' : v < -0.0001 ? 'tag-neg' : 'tag-zero';
      const disp = `${sign}${v.toFixed(3)}"`;
      copyLines.push(`ADJ    ${f.dim}: ${disp}`);
      return makeRow(f.dim, disp, tag, tagC, undefined, disp);
    }).join('');

  if (adjRows) {
    html += `<div class="res-section">
      <div class="res-section-head">ADJUSTMENT (ACTUAL − FARMA)</div>
      ${adjRows}
    </div>`;
  }

  const panel = document.getElementById('fit-results');
  document.getElementById('fit-rows').innerHTML = html;
  panel.removeAttribute('hidden');

  document.getElementById('copy-fit').onclick = () => copyText(copyLines.join('\n'));

  setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
});

/* ── CLEAR ALL ── */
document.getElementById('clear-bin').addEventListener('click', function () {
  document.querySelectorAll('input[type=number]').forEach(el => el.value = '');
  document.getElementById('shrink-results').setAttribute('hidden', '');
  document.getElementById('fit-results').setAttribute('hidden', '');
  document.getElementById('shrink-rows').innerHTML = '';
  document.getElementById('fit-rows').innerHTML = '';
  window._s45cache = {};
  hap(20);
  toast('CLEARED');
});
