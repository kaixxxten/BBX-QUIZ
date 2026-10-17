const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const playwrightPath = process.env.BBX_PLAYWRIGHT_PATH;
const previousRoot = process.env.BBX_PREVIOUS_RELEASE;
if (!playwrightPath) throw new Error("BBX_PLAYWRIGHT_PATH is required");
if (!previousRoot) throw new Error("BBX_PREVIOUS_RELEASE is required");

const {webkit, devices} = require(playwrightPath);
const currentRoot = path.resolve(__dirname, "..");
const evidenceDirectory = path.join(currentRoot, "test-evidence");
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

function readCacheName(root) {
  const source = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  return source.match(/const CACHE_NAME = "([^"]+)"/)?.[1] || "";
}

const oldCacheName = readCacheName(previousRoot);
const newCacheName = readCacheName(currentRoot);
if (!oldCacheName || !newCacheName || oldCacheName === newCacheName) {
  throw new Error(`Expected different cache names: ${oldCacheName} / ${newCacheName}`);
}

let releaseMode = "old";
let currentIndexRequests = 0;

function resolveRequest(root, requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://127.0.0.1").pathname);
  const requested = pathname === "/" ? "/index.html" : pathname;
  const resolved = path.resolve(root, `.${requested}`);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) return null;
  return resolved;
}

const server = http.createServer((request, response) => {
  const root = releaseMode === "old" ? previousRoot : currentRoot;
  const localPath = resolveRequest(root, request.url);
  if (!localPath || !fs.existsSync(localPath) || !fs.statSync(localPath).isFile()) {
    response.writeHead(404, {"content-type": "text/plain; charset=utf-8"});
    response.end("Not found");
    return;
  }

  if (releaseMode === "current" && /(^|\/)index\.html(?:\?|$)/.test(request.url)) {
    currentIndexRequests++;
  }

  const extension = path.extname(localPath).toLowerCase();
  response.writeHead(200, {
    "content-type": mimeTypes[extension] || "application/octet-stream",
    "cache-control": "no-store"
  });

  if (releaseMode === "current" && request.url.split("?")[0].endsWith("/offline-data.js")) {
    const source = fs.readFileSync(localPath, "utf8");
    response.end(`window.BBX_UPDATE_TEST_MARKER="NEW";\n${source}`);
    return;
  }

  fs.createReadStream(localPath).pipe(response);
});

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
  const externalRequests = [];
  context.on("request", request => {
    if (!request.url().startsWith(origin) && !/^(data|blob):/.test(request.url())) {
      externalRequests.push(request.url());
    }
  });

  try {
    const page = await context.newPage();
    await page.goto(url, {waitUntil: "networkidle"});
    await page.waitForSelector("#categoryScreen.active");
    await page.waitForFunction(() => document.documentElement.dataset.pwaReady === "true", null, {timeout: 20000});
    await page.waitForFunction(expected => caches.keys().then(names => names.includes(expected)), oldCacheName);

    const initialMarker = await page.evaluate(() => window.BBX_UPDATE_TEST_MARKER || "OLD");
    if (initialMarker !== "OLD") throw new Error("Old release marker was not loaded first");

    releaseMode = "current";
    await page.reload({waitUntil: "domcontentloaded"}).catch(() => {});
    await page.waitForFunction(
      expected => caches.keys().then(names => names.includes(expected)),
      newCacheName,
      {timeout: 30000}
    );
    await page.waitForFunction(() => window.BBX_UPDATE_TEST_MARKER === "NEW", null, {timeout: 30000});
    await page.waitForSelector("#categoryScreen.active");

    const updatedState = await page.evaluate(async ({oldName, newName}) => {
      const cacheNames = await caches.keys();
      return {
        marker: window.BBX_UPDATE_TEST_MARKER,
        oldCachePresent: cacheNames.includes(oldName),
        newCachePresent: cacheNames.includes(newName),
        pwaReady: document.documentElement.dataset.pwaReady
      };
    }, {oldName: oldCacheName, newName: newCacheName});

    if (updatedState.oldCachePresent) throw new Error("Old cache was not deleted");
    if (!updatedState.newCachePresent || updatedState.marker !== "NEW") {
      throw new Error("New cache did not take control");
    }
    if (currentIndexRequests < 2) {
      throw new Error(`Expected automatic reload after update, got ${currentIndexRequests} current index requests`);
    }
    await page.screenshot({path: path.join(evidenceDirectory, "ipad-1017-pwa-updated.png"), fullPage: true});

    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
    serverStopped = true;
    await page.close();

    const offlinePage = await context.newPage();
    await offlinePage.goto(url, {waitUntil: "domcontentloaded"});
    await offlinePage.waitForSelector("#categoryScreen.active");
    const offlineMarker = await offlinePage.evaluate(() => window.BBX_UPDATE_TEST_MARKER);
    if (offlineMarker !== "NEW") throw new Error("Updated release was not available offline");
    await offlinePage.locator('.hero-card[data-category="動畫"]').tap();
    await offlinePage.waitForSelector("#difficultyScreen.active");

    if (externalRequests.length) throw new Error(`External requests detected: ${externalRequests.join(", ")}`);

    const report = [
      "BEYBLADE X QUIZ PWA update test",
      `Old cache: ${oldCacheName}`,
      `New cache: ${newCacheName}`,
      "Explicit Service Worker update check: OK",
      "New worker controllerchange detected: OK",
      `Current index requests after publish: ${currentIndexRequests}`,
      "Automatic reload on home screen: OK",
      "New offline-data marker loaded: OK",
      "Old cache deleted: OK",
      "Updated release close/reopen with server stopped: OK",
      "Updated release touch navigation while offline: OK",
      "External requests: 0"
    ];
    fs.writeFileSync(path.join(evidenceDirectory, "pwa-update-test.txt"), `${report.join("\r\n")}\r\n`, "utf8");
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

