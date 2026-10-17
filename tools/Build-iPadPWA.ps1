param()

$ErrorActionPreference = "Stop"

$toolDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDirectory = Split-Path -Parent $toolDirectory
$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)

function Get-Sha256Hex([string]$path) {
  $stream = [IO.File]::OpenRead($path)
  $sha256 = [Security.Cryptography.SHA256]::Create()
  try {
    return ([BitConverter]::ToString($sha256.ComputeHash($stream))).Replace("-", "")
  } finally {
    $sha256.Dispose()
    $stream.Dispose()
  }
}

& (Join-Path $toolDirectory "Build-OfflineData.ps1")
& (Join-Path $toolDirectory "Build-PwaIcons.ps1")

$runtimeFiles = New-Object System.Collections.Generic.List[string]
foreach ($relativePath in @("index.html", "offline-data.js", "manifest.webmanifest")) {
  $runtimeFiles.Add($relativePath)
}

foreach ($folderName in @("images", "questions", "settings", "icons", "audio", "sounds", "fonts", "assets")) {
  $folderPath = Join-Path $projectDirectory $folderName
  if (-not (Test-Path -LiteralPath $folderPath -PathType Container)) { continue }

  Get-ChildItem -LiteralPath $folderPath -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($projectDirectory.Length + 1).Replace("\", "/")
    $runtimeFiles.Add($relativePath)
  }
}

$runtimeFiles = @($runtimeFiles | Sort-Object -Unique)
$hashInput = New-Object System.Text.StringBuilder
foreach ($relativePath in $runtimeFiles) {
  $localPath = Join-Path $projectDirectory $relativePath.Replace("/", "\")
  if (-not (Test-Path -LiteralPath $localPath -PathType Leaf)) {
    throw "PWA runtime file not found: $relativePath"
  }
  [void]$hashInput.Append($relativePath)
  [void]$hashInput.Append(":")
  [void]$hashInput.Append((Get-Sha256Hex $localPath))
  [void]$hashInput.Append(";")
}

$sha256 = [Security.Cryptography.SHA256]::Create()
try {
  $digestBytes = $sha256.ComputeHash([Text.Encoding]::UTF8.GetBytes($hashInput.ToString()))
} finally {
  $sha256.Dispose()
}

$digest = ([BitConverter]::ToString($digestBytes)).Replace("-", "").ToLowerInvariant()
$cacheName = "bbx-quiz-ipad-1017-$($digest.Substring(0,16))"
$precacheUrls = @("./") + @($runtimeFiles | ForEach-Object { "./$_" })
$precacheJson = ConvertTo-Json -InputObject $precacheUrls -Compress

$serviceWorkerTemplate = @'
const CACHE_NAME = "__CACHE_NAME__";
const CACHE_PREFIX = "bbx-quiz-ipad-1017-";
const PRECACHE_URLS = __PRECACHE_URLS__;
const INDEX_URL = "./index.html";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names
          .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(INDEX_URL, response.clone());
        }
        return response;
      } catch (error) {
        return (
          await caches.match(request, {ignoreSearch: true}) ||
          await caches.match(INDEX_URL) ||
          Response.error()
        );
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request, {ignoreSearch: true});
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      return Response.error();
    }
  })());
});
'@

$serviceWorker = $serviceWorkerTemplate.Replace("__CACHE_NAME__", $cacheName).Replace("__PRECACHE_URLS__", $precacheJson)

[IO.File]::WriteAllText(
  (Join-Path $projectDirectory "sw.js"),
  $serviceWorker,
  $utf8WithoutBom
)

Write-Host "iPad PWA cache name: $cacheName"
Write-Host "Precached runtime URLs: $($precacheUrls.Count)"

