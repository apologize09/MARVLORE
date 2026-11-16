$ErrorActionPreference = "Continue"
$log = Join-Path $PSScriptRoot "_push-log.txt"
function Log($m) { Add-Content -Path $log -Value $m -Encoding utf8 }
Set-Content -Path $log -Value "START $(Get-Date -Format o)" -Encoding utf8
Set-Location $PSScriptRoot
Log "cwd=$(Get-Location)"
Log "git=$(git --version 2>&1)"
if (-not (Test-Path .git)) {
  Log "init..."
  git init 2>&1 | ForEach-Object { Log $_ }
}
git remote remove origin 2>$null
git remote add origin https://github.com/apologize09/MARVLORE.git 2>&1 | ForEach-Object { Log $_ }
Log "remotes:"
git remote -v 2>&1 | ForEach-Object { Log $_ }
git add -A 2>&1 | ForEach-Object { Log $_ }
$status = git status --porcelain 2>&1
Log "status:"
$status | ForEach-Object { Log $_ }
$hasCommit = git rev-parse --verify HEAD 2>$null
if (-not $hasCommit) {
  git commit -m "Initial commit: MARVLORE website" 2>&1 | ForEach-Object { Log $_ }
} else {
  $dirty = git status --porcelain
  if ($dirty) {
    git commit -m "Sync local MARVLORE website" 2>&1 | ForEach-Object { Log $_ }
  } else {
    Log "nothing to commit"
  }
}
git branch -M main 2>&1 | ForEach-Object { Log $_ }
Log "push..."
git push -u origin main 2>&1 | ForEach-Object { Log $_ }
Log "EXIT=$LASTEXITCODE"
Log "END $(Get-Date -Format o)"
