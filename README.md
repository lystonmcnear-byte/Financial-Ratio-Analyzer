# Financial Ratio Analyzer

A web app that computes 9 key financial ratios from a company's income statement and balance sheet — with color-coded verdicts, charts, and plain-English insights.

**Live demo:** [lystonmcnear-byte.github.io/financial-ratio-analyzer](https://lystonmcnear-byte.github.io/financial-ratio-analyzer)

## What it analyzes

**Liquidity**
- Current ratio
- Quick ratio

**Profitability**
- Gross margin
- Operating margin
- Net margin
- Return on equity (ROE)
- Return on assets (ROA)

**Leverage**
- Debt-to-equity ratio
- Interest coverage ratio

## Features

- Enter any company's financials or load sample data
- Instant ratio calculations with Healthy / Adequate / At risk verdicts
- 3 charts: income breakdown, margin profile, liquidity & leverage
- Plain-English insights flagging strengths and red flags
- Zero dependencies — pure HTML, CSS, and JavaScript

## Tech stack

- HTML5, CSS3, Vanilla JavaScript
- Chart.js (via CDN) for data visualization
- Google Fonts (Inter + IBM Plex Mono)
- Hosted on GitHub Pages

## How to run locally

Just open `index.html` in any browser — no build step or server needed.

## How to deploy on GitHub Pages

1. Create a new repository on GitHub
2. Upload these 3 files: `index.html`, `style.css`, `app.js`
3. Go to **Settings → Pages**
4. Under Source, select your main branch
5. Your site will be live at `https://yourusername.github.io/repository-name`
