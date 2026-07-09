param(
  [string]$SshHost = "146.59.93.168",
  [string]$User = "root",
  [int]$Port = 22,
  [string]$KeyPath = "$HOME\\.ssh\\id_ed25519"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path $PSScriptRoot -Parent
$packageScript = Join-Path $PSScriptRoot "make-ovh-package.ps1"
$bootstrapScript = Join-Path $PSScriptRoot "bootstrap-vps.sh"
$releaseZip = Join-Path $PSScriptRoot "release\\linktalk-ovh-site.zip"

if (-not (Test-Path $KeyPath)) {
  throw "Nie znaleziono klucza SSH: $KeyPath"
}

if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
  throw "Brakuje polecenia scp w systemie."
}

if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
  throw "Brakuje polecenia ssh w systemie."
}

powershell -ExecutionPolicy Bypass -File $packageScript

& scp -i $KeyPath -P $Port $bootstrapScript "${User}@${SshHost}:/tmp/bootstrap-vps.sh"
& scp -i $KeyPath -P $Port $releaseZip "${User}@${SshHost}:/tmp/linktalk-ovh-site.zip"
& ssh -i $KeyPath -p $Port "${User}@${SshHost}" "chmod +x /tmp/bootstrap-vps.sh && DOMAIN=linktalk.pl WWW_DOMAIN=www.linktalk.pl PUBLIC_IPV4=$SshHost /tmp/bootstrap-vps.sh /tmp/linktalk-ovh-site.zip"

Write-Host "Wdrozenie na OVH zakonczone. Sprawdz: https://linktalk.pl/ albo http://$SshHost/"
