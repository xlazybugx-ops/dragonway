$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$node = 'C:\Users\ilya-\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if (-not (Test-Path $node)) { $node = 'node' }

Get-ChildItem (Join-Path $root 'js') -Filter '*.js' | ForEach-Object {
  & $node --check $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Syntax check failed: $($_.Name)" }
}

& $node (Join-Path $PSScriptRoot 'test-release.js')
if ($LASTEXITCODE -ne 0) { throw 'Balance tests failed' }
& $node (Join-Path $PSScriptRoot 'test-hub-builder.js')
if ($LASTEXITCODE -ne 0) { throw 'Settlement builder tests failed' }
& $node (Join-Path $PSScriptRoot 'check-assets.js')
if ($LASTEXITCODE -ne 0) { throw 'Asset reference checks failed' }
& $node (Join-Path $PSScriptRoot 'check-performance.js')
if ($LASTEXITCODE -ne 0) { throw 'Image performance budget failed' }
Write-Host 'All release checks passed.'
