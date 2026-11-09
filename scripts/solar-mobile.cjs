const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-gpu-sandbox', '--hide-scrollbars'],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', (message) => logs.push(`[console:${message.type()}] ${message.text()}`));
  page.on('pageerror', (error) => logs.push(`[pageerror] ${error.stack || error.message}`));
  await page.goto('http://127.0.0.1:8137', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => window.__SCENE_READY__ === true, null, { timeout: 120000 });
  await page.waitForTimeout(4800);
  await page.screenshot({ path: 'shots/solar-mobile.png' });
  const layout = await page.evaluate(() => {
    const index = document.querySelector('.solar-index').getBoundingClientRect();
    const hero = document.querySelector('.solar-hero').getBoundingClientRect();
    return {
      width: innerWidth,
      height: innerHeight,
      index: { x: index.x, y: index.y, width: index.width, height: index.height },
      hero: { x: hero.x, y: hero.y, width: hero.width, height: hero.height },
      modeSwitch: document.querySelector('.mode-switch').getBoundingClientRect().toJSON(),
      body: document.body.className,
    };
  });

  await page.click('.planet-list-item[data-planet="earth"]');
  await page.waitForTimeout(3600);
  await page.screenshot({ path: 'shots/solar-mobile-earth.png' });
  const earth = await page.evaluate(() => ({
    mode: window.__STATION_DEBUG__.state.mode,
    panel: document.querySelector('#planet-detail').getBoundingClientRect().toJSON(),
    back: document.querySelector('#planet-back').getBoundingClientRect().toJSON(),
  }));

  await page.click('#enter-station');
  await page.waitForTimeout(2600);
  await page.screenshot({ path: 'shots/solar-mobile-station.png' });

  console.log(JSON.stringify({ logs, layout, earth }, null, 2));
  await browser.close();
})();
