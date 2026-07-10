param(
  [string]$OutputDir = (Join-Path $PSScriptRoot "release")
)

$projectRoot = Split-Path $PSScriptRoot -Parent
$siteRoot = Join-Path $OutputDir "site"
$zipPath = Join-Path $OutputDir "linktalk-ovh-site.zip"
$legacyZipPath = Join-Path $OutputDir "bliskochat-ovh-site.zip"

if (Test-Path $siteRoot) {
  Remove-Item $siteRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $siteRoot -Force | Out-Null

$siteFiles = @(
  "index.html",
  "styles.css",
  "app.js",
  "app-enhancements.js",
  "config.js",
  "config.example.js",
  "manifest.webmanifest",
  "service-worker.js",
  "icon.svg"
)

foreach ($file in $siteFiles) {
  Copy-Item (Join-Path $projectRoot $file) (Join-Path $siteRoot $file) -Force
}

$downloadsPath = Join-Path $siteRoot "downloads"
New-Item -ItemType Directory -Path $downloadsPath -Force | Out-Null

$apkCandidates = @(
  (Join-Path $projectRoot "android\\app\\build\\outputs\\apk\\debug\\app-debug.apk"),
  (Join-Path $projectRoot "downloads\\linktalk-debug.apk"),
  (Join-Path $projectRoot "downloads\\bliskochat-debug.apk")
) | Where-Object { Test-Path $_ }

$apkSource = $apkCandidates | Select-Object -First 1
if ($apkSource) {
  Copy-Item $apkSource (Join-Path $downloadsPath "linktalk-debug.apk") -Force
  Copy-Item $apkSource (Join-Path $downloadsPath "bliskochat-debug.apk") -Force
}

$downloadIndexSource = Join-Path $projectRoot "downloads\\index.html"
if (Test-Path $downloadIndexSource) {
  Copy-Item $downloadIndexSource (Join-Path $downloadsPath "index.html") -Force
}

if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

if (Test-Path $legacyZipPath) {
  Remove-Item $legacyZipPath -Force
}

Compress-Archive -Path (Join-Path $siteRoot "*") -DestinationPath $zipPath -Force
Write-Host "Gotowe: $zipPath"
