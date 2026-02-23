# DEV EC Windows Publish Script
# Run this on Windows or with dotnet CLI available

param(
    [string]$Configuration = "Release",
    [string]$Runtime = "win-x64"
)

$ErrorActionPreference = "Stop"

Write-Host "Publishing DEV EC for $Runtime..." -ForegroundColor Cyan

# Build and publish
dotnet publish src/DevEc.Api -c $Configuration -r $Runtime --self-contained -p:PublishSingleFile=true -o ./publish

Write-Host "Published to ./publish directory" -ForegroundColor Green
Write-Host ""
Write-Host "To run:" -ForegroundColor Yellow
Write-Host "  Set environment variables:" -ForegroundColor White
Write-Host "    DEVEC_DB=`"Host=...`"" -ForegroundColor Gray
Write-Host "    DEVEC_TENANT_ID=`"your-tenant-id`"" -ForegroundColor Gray
Write-Host "    DEVEC_CLIENT_ID=`"your-client-id`"" -ForegroundColor Gray
Write-Host "    DEVEC_CLIENT_SECRET=`"your-secret`"" -ForegroundColor Gray
Write-Host "  Run: .\publish\DevEc.Api.exe" -ForegroundColor White
