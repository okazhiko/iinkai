const puppeteer = require('puppeteer');

const meti_format1 = {
  '調達価格算定委員会': 'https://www.meti.go.jp/shingikai/santeii/',
};

const meti_format2 = {
  '再生可能エネルギー発電設備の廃棄・リサイクルのあり方に関する検討会': 'https://www.meti.go.jp/shingikai/energy_environment/disposal_recycle/index.html',
  '卸電力市場、需給調整市場及び需給運用の在り方勉強会': 'https://www.meti.go.jp/shingikai/energy_environment/oroshi_jukyu/index.html',
  'あるべき卸電力市場、需給調整市場及び需給運用の実現に向けた実務検討作業部会': 'https://www.meti.go.jp/shingikai/energy_environment/oroshi_jukyu_kento/index.html',
  '同時市場の在り方等に関する検討会': 'https://www.meti.go.jp/shingikai/energy_environment/doji_shijo_kento/index.html',
  'GX実現に向けた排出量取引制度の検討に資する法的課題研究会': 'https://www.meti.go.jp/shingikai/energy_environment/gx_implementation/index.html',
  'カーボンニュートラルの実現に向けたカーボン・クレジットの適切な活用のための環境整備に関する検討会': 'https://www.meti.go.jp/shingikai/energy_environment/carbon_credit/index.html',
  '温対法に基づく事業者別排出係数の算出方法等に係る検討会': 'https://www.meti.go.jp/shingikai/energy_environment/ontaiho_haisyutsu/index.html',
};

const egc_format1 = {
  '制度設計・監視専門会合': 'https://www.egc.meti.go.jp/activity/index_systemsurveillance.html',
  '料金制度専門会合': 'https://www.egc.meti.go.jp/activity/index_electricity.html',
};

const env_format1 = {
  'カーボンプライシングの活用に関する小委員会': 'https://www.env.go.jp/council/06earth/yoshi06-19.html',
};

const occto_format1 = {
  '調整力及び需給バランス評価等に関する委員会': 'https://www.occto.or.jp/iinkai/chouseiryoku/index.html',
  '容量市場の在り方等に関する検討会・勉強会': 'https://www.occto.or.jp/iinkai/youryou/index.html',
};

async function getFirstByXPath(page, xpath) {
  const result = await page.evaluate((xp) => {
    const node = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (!node) return { text: '', href: '' };
    const text = (node.textContent || '').replace(/\s+/g, '');
    let href = '';
    if (node && typeof node.getAttribute === 'function') {
      href = node.getAttribute('href') || '';
    }
    return { text, href };
  }, xpath);
  return result;
}

function absolutize(baseUrl, href) {
  try {
    if (!href) return '';
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

async function scrapeAll() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(30000);

  const results = [];

  for (const [name, url] of Object.entries(meti_format1)) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const { text, href } = await getFirstByXPath(page, '//*[@id="__main_contents"]/ul[2]/li[1]/a');
      results.push({ committee: name, latest: text, url: absolutize(url, href) || url });
    } catch (e) {
      results.push({ committee: name, latest: `ERROR: ${e}`, url });
    }
  }

  for (const [name, url] of Object.entries(meti_format2)) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const { text, href } = await getFirstByXPath(page, '//*[@id="__main_contents"]/ul/li[1]/a');
      results.push({ committee: name, latest: text, url: absolutize(url, href) || url });
    } catch (e) {
      results.push({ committee: name, latest: `ERROR: ${e}`, url });
    }
  }

  for (const [name, url] of Object.entries(egc_format1)) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const { text } = await getFirstByXPath(page, '//*[@id="meti_or"]/table[2]/tbody/tr[1]/td[1]');
      results.push({ committee: name, latest: text, url });
    } catch (e) {
      results.push({ committee: name, latest: `ERROR: ${e}`, url });
    }
  }

  for (const [name, url] of Object.entries(env_format1)) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const { text } = await getFirstByXPath(page, '//*[@id="main"]/div[2]/div/div/div/ul/li[1]');
      results.push({ committee: name, latest: text, url });
    } catch (e) {
      results.push({ committee: name, latest: `ERROR: ${e}`, url });
    }
  }

  for (const [name, url] of Object.entries(occto_format1)) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const { text } = await getFirstByXPath(page, '//*[@id="contents"]/ul[2]/li[1]');
      results.push({ committee: name, latest: text, url });
    } catch (e) {
      results.push({ committee: name, latest: `ERROR: ${e}`, url });
    }
  }

  await browser.close();
  return results;
}

module.exports = { scrapeAll };


