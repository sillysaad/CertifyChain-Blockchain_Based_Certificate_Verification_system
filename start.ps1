# CertifyChain - One-Click Startup Script
# Run from the blockchain-cert-app root folder:
#   .\start.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  CertifyChain - Blockchain Certificate Verification" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# -- Step 1: Start Ganache --------------------------------------------------
Write-Host "[1/5] Starting local Ganache blockchain on port 8545..." -ForegroundColor Yellow
$ganache = Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "npx -y ganache -p 8545 -m 'test test test test test test test test test test test junk'" `
    -WorkingDirectory "$root\backend" -PassThru
Start-Sleep -Seconds 4
Write-Host "      [OK] Ganache started (PID $($ganache.Id))" -ForegroundColor Green

# -- Step 2: Compile Smart Contract ----------------------------------------
Write-Host "[2/5] Compiling CertificateRegistry.sol..." -ForegroundColor Yellow
if (Test-Path "$root\smart_contracts\compiled") {
    Remove-Item -Recurse -Force "$root\smart_contracts\compiled"
}
$compile = Start-Process powershell -ArgumentList "-Command", `
    "npx -y solc@0.8.24 --abi --bin --base-path . contracts/CertificateRegistry.sol -o compiled; Write-Host '[OK] Compiled!' -ForegroundColor Green; Start-Sleep -Seconds 2" `
    -WorkingDirectory "$root\smart_contracts" -PassThru -Wait
Start-Sleep -Seconds 2
Write-Host "      [OK] Contract compiled" -ForegroundColor Green

# -- Step 3: Deploy Contract ------------------------------------------------
Write-Host "[3/5] Deploying contract to local blockchain..." -ForegroundColor Yellow
Push-Location "$root\backend"
node deploy.js
Pop-Location
Write-Host "      [OK] Contract deployed and address saved to backend\.env" -ForegroundColor Green

# -- Step 4: Start Backend --------------------------------------------------
Write-Host "[4/5] Starting Express backend on http://localhost:5000..." -ForegroundColor Yellow
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "node server.js" `
    -WorkingDirectory "$root\backend" -PassThru
Start-Sleep -Seconds 3
Write-Host "      [OK] Backend running (PID $($backend.Id))" -ForegroundColor Green

# -- Step 5: Start Frontend -------------------------------------------------
Write-Host "[5/5] Starting React frontend on http://localhost:5173..." -ForegroundColor Yellow
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "npm run dev" `
    -WorkingDirectory "$root\frontend" -PassThru
Start-Sleep -Seconds 3
Write-Host "      [OK] Frontend running (PID $($frontend.Id))" -ForegroundColor Green

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  [OK] CertifyChain is RUNNING!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend    ->  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend     ->  http://localhost:5000/api/health" -ForegroundColor White
Write-Host "  Blockchain  ->  http://localhost:8545" -ForegroundColor White
Write-Host ""
Write-Host "  Admin Portal   ->  http://localhost:5173/admin" -ForegroundColor White
Write-Host "  Verify Portal  ->  http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Opening up browser..." -ForegroundColor Gray
Start-Process "http://localhost:5173"
