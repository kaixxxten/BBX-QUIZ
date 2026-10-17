const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const playwrightPath = process.env.BBX_PLAYWRIGHT_PATH;
if (!playwrightPath) throw new Error("BBX_PLAYWRIGHT_PATH is required");

const {webkit, devices} = require(playwrightPath);
const root = path.resolve(__dirname, "..");
const evidenceDirectory = path.join(root, "test-evidence");
fs.mkdirSync(evidenceDirectory, {recursive: true});

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function localPathFromUrl(url) {
  const pathname = decodeURIComponent(new URL(url, "http://127.0.0.1").pathname);
  const requested = pathname === "/" ? "/index.html" : pathname;
  const resolved = path.resolve(root, `.${requested}`);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) return null;
  return resolved;
}

const server = http.createServer((request, response) => {
  const localPath = localPathFromUrl(request.url);
  if (!localPath || !fs.existsSync(localPath) || !fs.statSync(localPath).isFile()) {
    response.writeHead(404, {"content-type": "text/plain; charset=utf-8"});
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": mimeTypes[path.extname(localPath).toLowerCase()] || "application/octet-stream",
    "cache-control": "no-store"
  });
  fs.createReadStream(localPath).pipe(response);
});

function sameMetrics(a, b) {
  const numericKeys = ["appWidth", "appHeight", "heroWidth", "heroHeight", "titleSize"];
  return a.layout === b.layout && numericKeys.every(key => Math.abs(a[key] - b[key]) < 1);
}

async function readLayoutMetrics(page) {
  return page.evaluate(() => {
    const app = document.querySelector(".app").getBoundingClientRect();
    const hero = document.querySelector(".hero-card").getBoundingClientRect();
    return {
      layout: document.body.dataset.layout,
      appWidth: app.width,
      appHeight: app.height,
      heroWidth: hero.width,
      heroHeight: hero.height,
      titleSize: Number.parseFloat(getComputedStyle(document.getElementById("homeTitle")).fontSize)
    };
  });
}

async function main() {
  let serverStopped = false;
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const port = server.address().port;
  const origin = `http://127.0.0.1:${port}`;
  const url = `${origin}/index.html`;
  const browser = await webkit.launch({headless: true});
  const context = await browser.newContext({
    ...devices["iPad (gen 11) landscape"],
    serviceWorkers: "allow"
  });
  await context.addInitScript(() => {
    Object.defineProperty(window.navigator, "standalone", {
      configurable: true,
      get: () => true
    });
  });
  const externalRequests = [];
  context.on("request", request => {
    if (!request.url().startsWith(origin) && !/^(data|blob):/.test(request.url())) {
      externalRequests.push(request.url());
    }
  });

  try {
    const onlinePage = await context.newPage();
    await onlinePage.goto(url, {waitUntil: "networkidle"});
    await onlinePage.waitForSelector("#categoryScreen.active");
    await onlinePage.waitForFunction(() => document.documentElement.dataset.pwaReady === "true", null, {timeout: 20000});

    const onlineState = await onlinePage.evaluate(async () => {
      await window.BBX_PWA_READY;
      const cacheNames = await caches.keys();
      const cacheName = cacheNames.find(name => name.startsWith("bbx-quiz-ipad-1017-"));
      const cache = cacheName ? await caches.open(cacheName) : null;
      return {
        cacheName,
        cachedUrls: cache ? (await cache.keys()).map(request => request.url) : [],
        questionFiles: Object.keys(window.BBX_OFFLINE_FILES || {}).filter(key => key.startsWith("questions/")).length,
        standalone: document.body.dataset.standalone,
        fullscreenAvailable: document.body.dataset.fullscreenAvailable,
        fullscreenButtonDisplay: getComputedStyle(document.getElementById("fullscreenBtn")).display
      };
    });
    if (!onlineState.cacheName || onlineState.cachedUrls.length < 26) {
      throw new Error(`PWA precache incomplete: ${onlineState.cachedUrls.length}`);
    }
    if (onlineState.questionFiles !== 4) throw new Error("Offline question data missing");
    if (onlineState.standalone !== "true") throw new Error("iPad standalone mode was not detected");
    if (onlineState.fullscreenAvailable !== "false" || onlineState.fullscreenButtonDisplay !== "none") {
      throw new Error("Fullscreen API must not be offered inside the installed iPad PWA");
    }
    const onlineMetrics = await readLayoutMetrics(onlinePage);
    if (onlineMetrics.layout !== "default") throw new Error(`Unexpected iPad layout: ${onlineMetrics.layout}`);

    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
    serverStopped = true;
    await onlinePage.close();

    const page = await context.newPage();
    await page.goto(url, {waitUntil: "domcontentloaded"});
    await page.waitForSelector("#categoryScreen.active");
    const offlineMetrics = await readLayoutMetrics(page);
    if (!sameMetrics(onlineMetrics, offlineMetrics)) throw new Error("Offline layout differs from online layout");
    await page.screenshot({path: path.join(evidenceDirectory, "ipad-1017-offline-home.png"), fullPage: true});

    await page.locator('.hero-card[data-category="動畫"]').tap();
    await page.waitForSelector("#difficultyScreen.active");
    await page.locator("#topBtn").tap();
    await page.waitForSelector("#categoryScreen.active");

    const activeElementState = await page.evaluate(() => {
      const active = document.activeElement;
      return {
        tagName: active?.tagName || "",
        isTextEntry: Boolean(active?.matches?.('input, textarea, [contenteditable="true"]'))
      };
    });
    if (activeElementState.isTextEntry) {
      throw new Error(`Normal quiz flow focused a text-entry element: ${activeElementState.tagName}`);
    }

    await page.locator('.hero-card[data-category="陀螺"]').tap();
    await page.waitForSelector("#difficultyScreen.active");
    await page.locator("#topBtn").tap();
    await page.waitForSelector("#categoryScreen.active");

    await page.locator('.hero-card[data-category="動畫"]').tap();
    await page.waitForSelector("#difficultyScreen.active");
    await page.locator('.diff-card[data-difficulty="簡單"]').tap();
    await page.waitForSelector("#quizScreen.active");
    const generalInitial = await page.evaluate(() => ({
      progress: document.getElementById("progress").textContent.trim(),
      question: document.getElementById("question").textContent.trim(),
      answerCount: document.querySelectorAll("#answers .answer").length
    }));
    if (generalInitial.progress !== "1 / 10" || !generalInitial.question || generalInitial.answerCount !== 4) {
      throw new Error("General mode failed to render");
    }
    await page.locator("#answers .answer").first().tap();
    await page.waitForSelector("#nextBtn:not(.hidden)");
    await page.locator("#nextBtn").tap();
    await page.waitForFunction(() => document.getElementById("progress").textContent.trim() === "2 / 10");

    await page.evaluate(() => {
      const imageQuestion = bank.find(question =>
        question.promptImages.length || question.optionImages.some(Boolean)
      );
      if (!imageQuestion) throw new Error("No image question found");
      imageQuestion._view = null;
      current = [imageQuestion];
      index = 0;
      score = 0;
      answered = false;
      timeAttackMode = false;
      render();
    });
    await page.waitForSelector("#quizScreen img");
    await page.waitForFunction(() => [...document.querySelectorAll("#quizScreen img")].every(image => image.complete && image.naturalWidth > 0));
    const imageState = await page.evaluate(() => ({
      imageCount: document.querySelectorAll("#quizScreen img").length,
      correctIndex: current[index]._view.answer
    }));
    await page.locator("#answers .answer").nth(imageState.correctIndex).tap();
    await page.waitForFunction(() => document.getElementById("feedbackTitle").textContent.includes("答對"));
    await page.screenshot({path: path.join(evidenceDirectory, "ipad-1017-offline-general.png"), fullPage: true});
    await page.locator("#topBtn").tap();
    await page.waitForSelector("#categoryScreen.active");

    await page.locator("#timeAttackBtn").tap();
    await page.waitForSelector("#quizScreen.timeattack-active");
    const timerBefore = Number.parseFloat(await page.locator("#taTimer").textContent());
    await page.waitForTimeout(1200);
    const timerAfter = Number.parseFloat(await page.locator("#taTimer").textContent());
    if (!(timerBefore <= 60 && timerBefore > 59 && timerAfter < timerBefore)) {
      throw new Error(`Time attack timer failed: ${timerBefore} -> ${timerAfter}`);
    }
    await page.locator("#answers .answer").first().tap();
    await page.waitForFunction(() => taAnsweredTotal >= 1);
    await page.screenshot({path: path.join(evidenceDirectory, "ipad-1017-offline-timeattack.png"), fullPage: true});
    await page.evaluate(() => { taEndTime = performance.now() + 150; });
    await page.waitForSelector("#timeAttackResultScreen.active", {timeout: 5000});
    const resultState = await page.evaluate(() => ({
      stats: document.getElementById("taFinalStats").textContent.trim(),
      rank: document.getElementById("taFinalRank").textContent.trim()
    }));
    if (!resultState.stats || !resultState.rank) throw new Error("Time attack result failed to render");
    await page.locator("#taReviewBtn").tap();
    await page.waitForSelector("#timeAttackReviewScreen.active");
    const reviewQuestion = (await page.locator("#reviewQuestion").textContent()).trim();
    if (!reviewQuestion) throw new Error("Time attack review failed to render");
    await page.locator("#reviewBackBtn").tap();
    await page.waitForSelector("#timeAttackResultScreen.active");
    await page.locator("#topBtn").tap();
    await page.waitForSelector("#categoryScreen.active");

    if (externalRequests.length) throw new Error(`External requests detected: ${externalRequests.join(", ")}`);

    const report = [
      "BEYBLADE X QUIZ 1017 iPad WebKit offline PWA test",
      `Viewport/device: iPad (gen 11) landscape / ${devices["iPad (gen 11) landscape"].viewport.width}x${devices["iPad (gen 11) landscape"].viewport.height}`,
      `PWA cache: ${onlineState.cacheName}`,
      `Precached URLs: ${onlineState.cachedUrls.length}`,
      "Server stopped before offline verification: YES",
      "Offline close/reopen: OK",
      "Touch input: Playwright tap()",
      "Installed PWA standalone detection: YES",
      "Nested Fullscreen API button/request path: DISABLED",
      `Normal quiz flow active element: ${activeElementState.tagName || "none"} (not text input)`,
      "動畫題 button -> difficulty page: OK",
      "陀螺題 button -> difficulty page: OK",
      "TOP return: OK",
      `General mode: ${generalInitial.progress}, ${generalInitial.answerCount} answers, next question 2 / 10 OK`,
      `Offline images loaded: ${imageState.imageCount}`,
      "Image question correct-answer judgment: OK",
      `Time attack countdown: ${timerBefore.toFixed(1)} -> ${timerAfter.toFixed(1)}`,
      `Time attack result: ${resultState.stats} / ${resultState.rank}`,
      "Time attack review: OK",
      "Online/offline layout metrics identical: YES",
      `Layout: ${offlineMetrics.layout}`,
      `App viewport: ${offlineMetrics.appWidth.toFixed(1)} x ${offlineMetrics.appHeight.toFixed(1)}`,
      "External requests: 0",
      "Note: Playwright WebKit emulates iPad Safari behavior; physical iPad Add to Home Screen remains the final device acceptance test."
    ];
    fs.writeFileSync(path.join(evidenceDirectory, "ipad-1017-offline-test.txt"), `${report.join("\r\n")}\r\n`, "utf8");
    console.log(report.join("\n"));
  } finally {
    await context.close();
    await browser.close();
    if (!serverStopped) await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});

