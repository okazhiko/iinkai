const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

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
  '容量市場の在り方等に関する検討会・勉強会': 'https://www.occto.or.jp/iinkai/youryou/index.html'
};

const occto_format2 = {
  '調整力及び需給バランス評価等に関する委員会': 'https://www.occto.or.jp/iinkai/chouseiryoku/index.html'
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
  const isVercel = !!process.env.VERCEL || process.env.AWS_REGION;
  const launchOptions = isVercel
    ? {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      }
    : { headless: 'new' };

  const browser = await puppeteer.launch(launchOptions);

  async function createOptimizedPage() {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(20000);
    await page.setRequestInterception(true);
    page.on('request', req => {
      const resourceType = req.resourceType();
      if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font' || resourceType === 'media' || resourceType === 'xhr' || resourceType === 'fetch' || resourceType === 'websocket') {
        req.abort();
      } else {
        req.continue();
      }
    });
    return page;
  }

  async function runTask(task) {
    const page = await createOptimizedPage();
    try {
      await page.goto(task.url, { waitUntil: 'domcontentloaded' });
      const { text, href } = await getFirstByXPath(page, task.xpath);
      const outUrl = task.needsHref ? (absolutize(task.url, href) || task.url) : task.url;
      return { committee: task.name, latest: text, url: outUrl };
    } catch (e) {
      return { committee: task.name, latest: `ERROR: ${e}`, url: task.url };
    } finally {
      await page.close().catch(() => {});
    }
  }

  function buildTasks() {
    const tasks = [];
    for (const [name, url] of Object.entries(meti_format1)) {
      tasks.push({ name, url, xpath: '//*[@id="__main_contents"]/ul[2]/li[1]/a', needsHref: true });
    }
    for (const [name, url] of Object.entries(meti_format2)) {
      tasks.push({ name, url, xpath: '//*[@id="__main_contents"]/ul/li[1]/a', needsHref: true });
    }
    for (const [name, url] of Object.entries(egc_format1)) {
      tasks.push({ name, url, xpath: '//*[@id="meti_or"]/table[2]/tbody/tr[1]/td[1]', needsHref: false });
    }
    for (const [name, url] of Object.entries(env_format1)) {
      tasks.push({ name, url, xpath: '//*[@id="main"]/div[2]/div/div/div/ul/li[1]', needsHref: false });
    }
    for (const [name, url] of Object.entries(occto_format1)) {
      tasks.push({ name, url, xpath: '//*[@id="contents"]/ul[1]/li[1]', needsHref: false });
    }
    for (const [name, url] of Object.entries(occto_format2)) {
      tasks.push({ name, url, xpath: '//*[@id="contents"]/ul[2]/li[1]', needsHref: false });
    }
    return tasks;
  }

  async function runWithConcurrency(tasks, limit) {
    const results = new Array(tasks.length);
    let nextIndex = 0;

    async function worker() {
      while (true) {
        const current = nextIndex++;
        if (current >= tasks.length) break;
        results[current] = await runTask(tasks[current]);
      }
    }

    const workers = [];
    for (let i = 0; i < limit; i++) workers.push(worker());
    await Promise.all(workers);
    return results;
  }

  const tasks = buildTasks();
  const concurrency = Math.min(6, Math.max(2, Math.ceil(tasks.length / 4)));
  const results = await runWithConcurrency(tasks, concurrency);

  await browser.close();
  return results;
}

module.exports = { scrapeAll };


