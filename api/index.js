const { scrapeAll } = require('../src/scraper');

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
}

function escapeAttr(s) {
  return String(s || '').replace(/["']/g, c => ({'"':'&quot;','\'':'&#39;'}[c]));
}

module.exports = async function handler(req, res) {
  try {
    const data = await scrapeAll();
    const rows = data.map(r => `<tr><td>${escapeHtml(r['committee'])}</td><td>${escapeHtml(r['latest'])}</td><td><a href="${escapeAttr(r['url'])}" target="_blank" rel="noopener noreferrer">${escapeHtml(r['url'])}</a></td></tr>`).join('');
    const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>委員会一覧</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto;line-height:1.6;padding:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}th{background:#f5f5f5;text-align:left}tr:nth-child(even){background:#fafafa}</style></head><body><h1>委員会一覧</h1><table><thead><tr><th>委員会</th><th>最新情報</th><th>URL</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(`エラー: ${String(e)}`);
  }
};


