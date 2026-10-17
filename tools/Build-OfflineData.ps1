param()

$ErrorActionPreference = "Stop"

$toolDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDirectory = Split-Path -Parent $toolDirectory
$offlineDataPath = Join-Path $projectDirectory "offline-data.js"

$sourceFiles = @(
  "settings/page_text.txt",
  "settings/staff.txt",
  "questions/anime_easy.txt",
  "questions/anime_hard.txt",
  "questions/bey_easy.txt",
  "questions/bey_hard.txt"
)

$offlineFiles = [ordered]@{}

foreach ($relativePath in $sourceFiles) {
  $windowsRelativePath = $relativePath.Replace("/", [System.IO.Path]::DirectorySeparatorChar)
  $sourcePath = Join-Path $projectDirectory $windowsRelativePath

  if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
    throw "Offline source file not found: $relativePath"
  }

  $offlineFiles[$relativePath] = [System.IO.File]::ReadAllText($sourcePath)
}

$json = ConvertTo-Json -InputObject $offlineFiles -Compress
$javascript = "window.BBX_OFFLINE_FILES = Object.freeze($json);`r`n"
$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText($offlineDataPath, $javascript, $utf8WithoutBom)

Write-Host "Offline data updated: $offlineDataPath"
Write-Host "Embedded $($sourceFiles.Count) TXT files."
