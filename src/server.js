const express = require('express');
const { scrapeAll } = require('./scraper');

const app = express();

app.get('/api/iinkai', async (req, res) => {
  try {
    const data = await scrapeAll();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/', async (req, res) => {
  try {
    const data = await scrapeAll();
    const rows = data.map(r => `<tr><td>${escapeHtml(r['committee'])}</td><td>${escapeHtml(r['latest'])}</td><td><a href="${escapeAttr(r['url'])}" target="_blank" rel="noopener noreferrer">${escapeHtml(r['url'])}</a></td></tr>`).join('');
    const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>委員会一覧</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto;line-height:1.6;padding:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}th{background:#f5f5f5;text-align:left}tr:nth-child(even){background:#fafafa}</style></head><body><h1>委員会一覧</h1><table><thead><tr><th>委員会</th><th>最新情報</th><th>URL</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    res.set('Content-Type', 'text/html; charset=utf-8').send(html);
  } catch (e) {
    res.status(500).send(`エラー: ${String(e)}`);
  }
});

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
}

function escapeAttr(s) {
  return String(s || '').replace(/["']/g, c => ({'"':'&quot;','\'':'&#39;'}[c]));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


