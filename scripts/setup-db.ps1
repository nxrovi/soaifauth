# VenomAuth Database Setup Script for Windows
Write-Host "🔧 Setting up VenomAuth Database..." -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found. Creating it..." -ForegroundColor Yellow
    @"
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="venom-auth-super-secret-key-change-in-production-$(Get-Random)"
NEXTAUTH_URL="http://localhost:3000"
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host "✅ .env file created!" -ForegroundColor Green
}

# Try to generate Prisma client
Write-Host "`n📦 Generating Prisma Client..." -ForegroundColor Cyan
npm run db:generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️  Prisma generate failed due to file lock." -ForegroundColor Yellow
    Write-Host "💡 Try these solutions:" -ForegroundColor Yellow
    Write-Host "   1. Close VS Code/Editor and try again" -ForegroundColor White
    Write-Host "   2. Run PowerShell as Administrator" -ForegroundColor White
    Write-Host "   3. Temporarily disable antivirus" -ForegroundColor White
    Write-Host "   4. Restart your computer" -ForegroundColor White
    Write-Host "`n🔄 Database schema will still work, trying to push..." -ForegroundColor Cyan
}

# Push database schema
Write-Host "`n🗄️  Pushing database schema..." -ForegroundColor Cyan
npm run db:push

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Database setup complete!" -ForegroundColor Green
    Write-Host "📁 Database location: prisma\dev.db" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Database setup failed. Check the errors above." -ForegroundColor Red
}

