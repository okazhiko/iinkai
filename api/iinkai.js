const { scrapeAll } = require('../src/scraper');

module.exports = async function handler(req, res) {
  try {
    const data = await scrapeAll();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: String(e) }));
  }
};


