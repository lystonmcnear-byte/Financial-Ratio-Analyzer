// ── Helpers ──
const g = id => parseFloat(document.getElementById(id).value) || 0;
const pct = v => (v * 100).toFixed(1) + '%';
const r2 = v => v.toFixed(2);
const fmtDollar = v => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return (v < 0 ? '-' : '') + '$' + (abs / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1_000) return (v < 0 ? '-' : '') + '$' + (abs / 1_000).toFixed(1) + 'K';
  return (v < 0 ? '-$' : '$') + Math.round(abs).toLocaleString();
};

let charts = [];

// ── Sample data ──
function loadSample() {
  const data = {
    revenue: 8500000, cogs: 3200000, opex: 1800000,
    interest: 180000, netIncome: 1100000,
    currAssets: 4200000, inventory: 620000,
    currLiab: 1800000, totalDebt: 2400000,
    equity: 5100000, totalAssets: 8200000,
  };
  Object.entries(data).forEach(([k, v]) => {
    const el = document.getElementById(k);
    if (el) el.value = v;
  });
}

function clearAll() {
  ['revenue','cogs','opex','interest','netIncome','currAssets','inventory','currLiab','totalDebt','equity','totalAssets']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('results').classList.add('hidden');
  charts.forEach(c => c.destroy());
  charts = [];
}

// ── Verdict logic ──
function verdict(key, val) {
  const map = {
    current:    [[2,   'Healthy',  'good'], [1,   'Adequate', 'warn'], [0, 'At risk',    'bad']],
    quick:      [[1,   'Healthy',  'good'], [0.7, 'Adequate', 'warn'], [0, 'At risk',    'bad']],
    grossMargin:[[0.4, 'Strong',   'good'], [0.2, 'Moderate', 'warn'], [0, 'Thin',       'bad']],
    opMargin:   [[0.15,'Strong',   'good'], [0.05,'Moderate', 'warn'], [0, 'Weak',       'bad']],
    netMargin:  [[0.1, 'Profitable','good'],[0.04,'Marginal', 'warn'], [0, 'Unprofitable','bad']],
    roe:        [[0.15,'Strong',   'good'], [0.05,'Adequate', 'warn'], [0, 'Weak',       'bad']],
    roa:        [[0.08,'Efficient','good'],  [0.03,'Moderate', 'warn'], [0, 'Poor',       'bad']],
    interestCov:[[3,   'Safe',     'good'], [1.5, 'Adequate', 'warn'], [0, 'Risky',      'bad']],
  };
  if (key === 'debtEquity') {
    if (val < 0.5) return { label: 'Conservative', cls: 'good' };
    if (val < 1.5) return { label: 'Moderate',     cls: 'warn' };
    return { label: 'Leveraged', cls: 'bad' };
  }
  const tiers = map[key];
  if (!tiers) return { label: '–', cls: 'neutral' };
  for (const [min, label, cls] of tiers) {
    if (val >= min) return { label, cls };
  }
  return { label: '–', cls: 'neutral' };
}

// ── Main analysis ──
function analyze() {
  const rev = g('revenue'), cogs = g('cogs'), opex = g('opex'),
        interest = g('interest'), ni = g('netIncome'),
        ca = g('currAssets'), inv = g('inventory'), cl = g('currLiab'),
        debt = g('totalDebt'), eq = g('equity'), ta = g('totalAssets');

  if (!rev || !cl) {
    alert('Please enter at least Revenue and Current liabilities to analyze.');
    return;
  }

  const grossProfit = rev - cogs;
  const ebit = grossProfit - opex;

  const ratios = {
    current:    cl   ? ca / cl           : 0,
    quick:      cl   ? (ca - inv) / cl   : 0,
    grossMargin:rev  ? grossProfit / rev  : 0,
    opMargin:   rev  ? ebit / rev         : 0,
    netMargin:  rev  ? ni / rev           : 0,
    roe:        eq   ? ni / eq            : 0,
    roa:        ta   ? ni / ta            : 0,
    debtEquity: eq   ? debt / eq          : 0,
    interestCov:interest ? ebit / interest : 0,
  };

  renderKPIs({ rev, grossProfit, ebit, ni });
  renderRatioGrid(ratios);
  renderCharts({ rev, cogs, grossProfit, opex, ebit, ni }, ratios);
  renderInsights(ratios);

  document.getElementById('results').classList.remove('hidden');
  document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── KPIs ──
function renderKPIs({ rev, grossProfit, ebit, ni }) {
  document.getElementById('kpiRow').innerHTML = [
    { label: 'Revenue',       val: fmtDollar(rev) },
    { label: 'Gross profit',  val: fmtDollar(grossProfit) },
    { label: 'EBIT',          val: fmtDollar(ebit) },
    { label: 'Net income',    val: fmtDollar(ni) },
  ].map(k => `
    <div class="kpi">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.val}</div>
    </div>
  `).join('');
}

// ── Ratio grid ──
function renderRatioGrid(ratios) {
  const items = [
    { key: 'current',    label: 'Current ratio',      val: r2(ratios.current),           note: 'Current assets ÷ current liabilities' },
    { key: 'quick',      label: 'Quick ratio',         val: r2(ratios.quick),             note: '(Current assets − inventory) ÷ current liabilities' },
    { key: 'grossMargin',label: 'Gross margin',        val: pct(ratios.grossMargin),      note: 'Gross profit ÷ revenue' },
    { key: 'opMargin',   label: 'Operating margin',    val: pct(ratios.opMargin),         note: 'EBIT ÷ revenue' },
    { key: 'netMargin',  label: 'Net margin',          val: pct(ratios.netMargin),        note: 'Net income ÷ revenue' },
    { key: 'roe',        label: 'Return on equity',    val: pct(ratios.roe),              note: 'Net income ÷ equity' },
    { key: 'roa',        label: 'Return on assets',    val: pct(ratios.roa),              note: 'Net income ÷ total assets' },
    { key: 'debtEquity', label: 'Debt-to-equity',      val: r2(ratios.debtEquity),        note: 'Total debt ÷ equity' },
    { key: 'interestCov',label: 'Interest coverage',   val: r2(ratios.interestCov) + 'x', note: 'EBIT ÷ interest expense' },
  ];

  document.getElementById('ratioGrid').innerHTML = items.map(it => {
    const v = verdict(it.key, parseFloat(it.val));
    return `
      <div class="ratio-card">
        <div class="ratio-name">${it.label}</div>
        <div class="ratio-val">${it.val}</div>
        <span class="badge badge-${v.cls}">${v.label}</span>
        <div class="ratio-note">${it.note}</div>
      </div>
    `;
  }).join('');
}

// ── Charts ──
function renderCharts({ rev, cogs, grossProfit, opex, ebit, ni }, ratios) {
  charts.forEach(c => c.destroy());
  charts = [];

  const gridColor = '#e8e7e1';
  const tickColor = '#9a9892';

  // Income breakdown
  const c1 = new Chart(document.getElementById('incomeChart'), {
    type: 'bar',
    data: {
      labels: ['Revenue', 'COGS', 'Op. expenses', 'Net income'],
      datasets: [{
        data: [rev, cogs, opex, ni],
        backgroundColor: ['#1a56db', '#e34848', '#eda100', '#0a7c4a'],
        borderRadius: 5,
        borderSkipped: 'bottom',
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + fmtDollar(c.raw) } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 11 } }, border: { color: gridColor } },
        y: { grid: { color: gridColor }, border: { display: false }, ticks: { color: tickColor, font: { size: 11 }, callback: v => fmtDollar(v) } }
      }
    }
  });

  // Income legend
  document.getElementById('incomeLegend').innerHTML = [
    { color: '#1a56db', label: 'Revenue' },
    { color: '#e34848', label: 'COGS' },
    { color: '#eda100', label: 'Op. expenses' },
    { color: '#0a7c4a', label: 'Net income' },
  ].map(l => `<span class="leg"><span class="leg-sq" style="background:${l.color}"></span>${l.label}</span>`).join('');

  // Margin profile
  const c2 = new Chart(document.getElementById('marginChart'), {
    type: 'bar',
    data: {
      labels: ['Gross', 'Operating', 'Net'],
      datasets: [{
        data: [+(ratios.grossMargin * 100).toFixed(1), +(ratios.opMargin * 100).toFixed(1), +(ratios.netMargin * 100).toFixed(1)],
        backgroundColor: ['#1a56db', '#4a3aa7', '#0a7c4a'],
        borderRadius: 5,
        borderSkipped: 'bottom',
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.raw}%` } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 11 } }, border: { color: gridColor } },
        y: { grid: { color: gridColor }, border: { display: false }, ticks: { color: tickColor, font: { size: 11 }, callback: v => v + '%' } }
      }
    }
  });

  // Liquidity & leverage
  const c3 = new Chart(document.getElementById('liquChart'), {
    type: 'bar',
    data: {
      labels: ['Current ratio', 'Quick ratio', 'Debt / Equity'],
      datasets: [{
        data: [+ratios.current.toFixed(2), +ratios.quick.toFixed(2), +ratios.debtEquity.toFixed(2)],
        backgroundColor: ['#1a56db', '#0a7c4a', '#e34848'],
        borderRadius: 5,
        borderSkipped: 'bottom',
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 11 } }, border: { color: gridColor } },
        y: { grid: { color: gridColor }, border: { display: false }, ticks: { color: tickColor, font: { size: 11 } } }
      }
    }
  });

  charts = [c1, c2, c3];
}

// ── Insights ──
function renderInsights(ratios) {
  const items = [];

  if (ratios.current >= 2)
    items.push({ icon: '✅', text: `Strong liquidity — current ratio of ${r2(ratios.current)} comfortably covers short-term obligations.` });
  else if (ratios.current < 1)
    items.push({ icon: '🔴', text: `Liquidity risk — current ratio of ${r2(ratios.current)} means current liabilities exceed current assets.` });
  else
    items.push({ icon: '🟡', text: `Adequate liquidity — current ratio of ${r2(ratios.current)}. Monitor carefully if business slows.` });

  if (ratios.grossMargin >= 0.4)
    items.push({ icon: '✅', text: `Healthy gross margin of ${pct(ratios.grossMargin)} — strong pricing power or efficient production costs.` });
  else if (ratios.grossMargin < 0.2)
    items.push({ icon: '🟡', text: `Thin gross margin of ${pct(ratios.grossMargin)} — limited room between revenue and direct costs.` });

  if (ratios.netMargin >= 0.1)
    items.push({ icon: '✅', text: `Solid net margin of ${pct(ratios.netMargin)} — the business efficiently converts revenue to profit.` });
  else if (ratios.netMargin < 0)
    items.push({ icon: '🔴', text: `Negative net margin — the business is currently operating at a loss.` });
  else
    items.push({ icon: '🟡', text: `Slim net margin of ${pct(ratios.netMargin)} — watch operating expenses and interest costs.` });

  if (ratios.roe >= 0.15)
    items.push({ icon: '✅', text: `ROE of ${pct(ratios.roe)} exceeds the 15% benchmark — strong returns for shareholders.` });
  else if (ratios.roe < 0.05)
    items.push({ icon: '🟡', text: `Low ROE of ${pct(ratios.roe)} — the business generates limited return on shareholder capital.` });

  if (ratios.debtEquity > 1.5)
    items.push({ icon: '🔴', text: `High leverage — debt-to-equity of ${r2(ratios.debtEquity)} increases financial risk and reduces flexibility.` });
  else if (ratios.debtEquity < 0.5)
    items.push({ icon: '✅', text: `Conservative capital structure — debt-to-equity of ${r2(ratios.debtEquity)} signals low financial risk.` });

  if (ratios.interestCov >= 3)
    items.push({ icon: '✅', text: `Interest coverage of ${r2(ratios.interestCov)}x — earnings comfortably cover interest obligations.` });
  else if (ratios.interestCov < 1.5 && ratios.interestCov > 0)
    items.push({ icon: '🔴', text: `Weak interest coverage of ${r2(ratios.interestCov)}x — earnings may not reliably cover interest payments.` });

  document.getElementById('insightCard').innerHTML = `
    <ul class="insight-list">
      ${items.map(i => `
        <li class="insight-item">
          <span class="insight-icon">${i.icon}</span>
          <span>${i.text}</span>
        </li>
      `).join('')}
    </ul>
  `;
}

// ── Tab switching ──
function switchTab(id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => { p.classList.remove('active'); p.classList.add('hidden'); });

  const activeTab = [...document.querySelectorAll('.tab')].find(t => t.getAttribute('onclick')?.includes(`'${id}'`));
  if (activeTab) activeTab.classList.add('active');

  const panel = document.getElementById('tab-' + id);
  if (panel) { panel.classList.add('active'); panel.classList.remove('hidden'); }

  // Resize charts so they render correctly when tab becomes visible
  setTimeout(() => { charts.forEach(c => c.resize()); }, 10);
}
