# 自动部署脚本
# 用法: .\deploy.ps1 "commit message"

param(
    [string]$message = "Update"
)

Write-Host "🚀 开始部署..." -ForegroundColor Cyan

# 1. Git add & commit & push
Write-Host "📦 提交代码到 GitHub..." -ForegroundColor Yellow
git add -A
git commit -m $message
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git push 失败" -ForegroundColor Red
    exit 1
}

# 2. 部署到 Vercel
Write-Host "🌐 部署到 Vercel..." -ForegroundColor Yellow
vercel deploy --prod --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 部署成功!" -ForegroundColor Green
} else {
    Write-Host "❌ Vercel 部署失败" -ForegroundColor Red
    exit 1
}



