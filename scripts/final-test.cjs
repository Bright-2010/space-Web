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
  page.on('requestfailed', (request) => logs.push(`[requestfailed] ${request.url()} :: ${request.failure()?.errorText}`));

  await page.goto('http://127.0.0.1:8137', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => window.__SCENE_READY__ === true, null, { timeout: 120000 });
  await page.waitForTimeout(4500);

  const initial = await page.evaluate(() => ({
    mode: window.__STATION_DEBUG__.state.mode,
    body: document.body.className,
    activeMode: document.querySelector('.mode-button.is-active')?.dataset.mode,
    live: document.querySelector('#live-label').textContent,
    planets: document.querySelectorAll('.planet-list-item').length,
  }));

  const earthScreen = await page.evaluate(() => {
    const d = window.__STATION_DEBUG__;
    const body = d.solarSystem.getBody('earth');
    const p = body.group.position.clone().project(d.camera);
    return { x: (p.x * 0.5 + 0.5) * innerWidth, y: (-p.y * 0.5 + 0.5) * innerHeight };
  });
  await page.mouse.click(earthScreen.x, earthScreen.y);
  await page.waitForTimeout(3600);
  const earthDetail = await page.evaluate(() => ({
    mode: window.__STATION_DEBUG__.state.mode,
    selected: window.__STATION_DEBUG__.state.selectedPlanet,
    title: document.querySelector('#planet-name').textContent,
    stationCardVisible: !document.querySelector('#earth-station-card').hidden,
    stationLabelVisible: !document.querySelector('#solar-station-label').hidden,
    activeQuick: document.querySelector('.planet-quicknav .is-active')?.dataset.planet,
  }));
  await page.screenshot({ path: 'shots/final-earth.png' });

  await page.evaluate(() => document.querySelector('#solar-station-label').click());
  await page.waitForTimeout(2600);
  const stationMode = await page.evaluate(() => ({
    mode: window.__STATION_DEBUG__.state.mode,
    body: document.body.className,
    activeMode: document.querySelector('.mode-button.is-active')?.dataset.mode,
    heroVisible: getComputedStyle(document.querySelector('.hero')).display !== 'none',
  }));

  await page.click('#mission-button');
  await page.waitForTimeout(600);
  const modalOpen = await page.evaluate(() => document.querySelector('#mission-modal').classList.contains('is-open'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const modalClosed = await page.evaluate(() => !document.querySelector('#mission-modal').classList.contains('is-open'));

  await page.click('.mode-button[data-mode="solar"]');
  await page.waitForTimeout(2600);
  const solarReturn = await page.evaluate(() => ({
    mode: window.__STATION_DEBUG__.state.mode,
    body: document.body.className,
    activeMode: document.querySelector('.mode-button.is-active')?.dataset.mode,
    solarHeroVisible: getComputedStyle(document.querySelector('.solar-hero')).display !== 'none',
  }));

  await page.evaluate(() => window.__STATION_DEBUG__.openPlanet('sun'));
  await page.waitForTimeout(3600);
  const sunDetail = await page.evaluate(() => ({
    mode: window.__STATION_DEBUG__.state.mode,
    selected: window.__STATION_DEBUG__.state.selectedPlanet,
    title: document.querySelector('#planet-name').textContent,
    stationCardHidden: document.querySelector('#earth-station-card').hidden,
  }));

  console.log(JSON.stringify({ logs, initial, earthDetail, stationMode, modalOpen, modalClosed, solarReturn, sunDetail }, null, 2));
  await browser.close();
})();
