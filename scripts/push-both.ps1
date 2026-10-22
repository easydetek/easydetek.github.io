# ============================================================
# 双远端推送：GitHub(origin) + Gitee(gitee)
# 本仓库约定：每次都要两个都推，不要只推一个。
#   用法：powershell -ExecutionPolicy Bypass -File .\scripts\push-both.ps1
#         powershell -ExecutionPolicy Bypass -File .\scripts\push-both.ps1 -Branch main -DryRun
# ============================================================
param(
  [string]$Branch = 'main',
  [string[]]$Remotes = @('origin', 'gitee'),
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

# 工作区必须干净，避免把半成品推上去
$dirty = git status --porcelain
if ($dirty) {
  Write-Host '工作区有未提交的改动，请先提交：' -ForegroundColor Yellow
  $dirty | ForEach-Object { Write-Host "  $_" }
  exit 1
}

$existing = @(git remote)
$failed = @()

foreach ($remote in $Remotes) {
  if ($existing -notcontains $remote) {
    Write-Host "跳过：远端 '$remote' 不存在（现有：$($existing -join ', ')）" -ForegroundColor Yellow
    continue
  }

  $url = git remote get-url $remote
  Write-Host "==> $remote ($url)  $Branch" -ForegroundColor Cyan

  if ($DryRun) { Write-Host '    [DryRun] 跳过实际推送'; continue }

  git push $remote $Branch
  if ($LASTEXITCODE -ne 0) { $failed += $remote }
}

if ($failed.Count -gt 0) {
  Write-Host "推送失败：$($failed -join ', ')" -ForegroundColor Red
  exit 1
}

Write-Host '完成。记得：' -ForegroundColor Green
Write-Host '  · GitHub Pages 会自动构建（约 2–4 分钟）'
Write-Host '  · docs.easydetek.com 需在服务器上手动 docker compose up -d --build'
