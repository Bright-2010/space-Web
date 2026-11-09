const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-gpu-sandbox', '--hide-scrollbars'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', (message) => logs.push(`[console:${message.type()}] ${message.text()}`));
  page.on('pageerror', (error) => logs.push(`[pageerror] ${error.stack || error.message}`));
  await page.goto('http://127.0.0.1:8137', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => window.__SCENE_READY__ === true, null, { timeout: 120000 });
  await page.waitForTimeout(4200);

  const ids = ['sun', 'mercury', 'mars', 'jupiter', 'neptune'];
  for (const id of ids) {
    await page.evaluate((planet) => window.__STATION_DEBUG__.openPlanet(planet), id);
    await page.waitForTimeout(3600);
    await page.screenshot({ path: `shots/planet-${id}.png` });
    await page.evaluate(() => window.__STATION_DEBUG__.setMode('solar'));
    await page.waitForTimeout(2200);
  }
  console.log(JSON.stringify({ logs }, null, 2));
  await browser.close();
})();
