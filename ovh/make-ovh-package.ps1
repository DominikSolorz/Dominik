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

$apkSource = Join-Path $projectRoot "android\\app\\build\\outputs\\apk\\debug\\app-debug.apk"
if (Test-Path $apkSource) {
  Copy-Item $apkSource (Join-Path $downloadsPath "linktalk-debug.apk") -Force
  Copy-Item $apkSource (Join-Path $downloadsPath "bliskochat-debug.apk") -Force
}

$downloadIndex = @"
<!doctype html>
<html lang="pl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Pobierz LinkTalk APK</title>
    <style>
      body{font-family:Arial,sans-serif;background:#f5f7fb;color:#050505;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}
      main{background:#fff;border-radius:16px;box-shadow:0 16px 40px rgba(15,23,42,.12);max-width:440px;padding:24px;text-align:center}
      a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;border-radius:999px;background:#0866ff;color:#fff;text-decoration:none;font-weight:800;padding:0 18px}
    </style>
  </head>
  <body>
    <main>
      <h1>LinkTalk APK</h1>
      <p>Pobierz testowa aplikacje Android.</p>
      <a href="./linktalk-debug.apk" download>Pobierz APK</a>
    </main>
  </body>
</html>
"@
Set-Content -Path (Join-Path $downloadsPath "index.html") -Value $downloadIndex -Encoding utf8

if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

if (Test-Path $legacyZipPath) {
  Remove-Item $legacyZipPath -Force
}

Compress-Archive -Path (Join-Path $siteRoot "*") -DestinationPath $zipPath -Force
Write-Host "Gotowe: $zipPath"
