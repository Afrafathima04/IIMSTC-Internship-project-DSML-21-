# Quick Start Script for Edfeed Dashboard
# Run this script to start both backend and frontend

Write-Host "========================================"
Write-Host "🚀 Edfeed Dashboard - Quick Start"
Write-Host "========================================"
Write-Host ""

# Check Python
Write-Host "✓ Checking Python installation..."
$python = python --version 2>&1
Write-Host "  $python"

# Check Node.js
Write-Host "✓ Checking Node.js installation..."
$node = node --version
Write-Host "  Node $node"

Write-Host ""
Write-Host "========================================"
Write-Host "Starting Services..."
Write-Host "========================================"
Write-Host ""

# Start Backend
Write-Host "📌 Backend: Starting Flask API on port 5000..."
Write-Host "   Command: python backend\app.py"
Write-Host ""

$backendProcess = Start-Process -NoNewWindow -PassThru -FilePath "python" -ArgumentList "backend\app.py"

# Wait for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "📌 Frontend: Starting Next.js on port 3000..."
Write-Host "   Command: npm run dev"
Write-Host ""

$frontendProcess = Start-Process -NoNewWindow -PassThru -FilePath "npm" -ArgumentList "run", "dev"

# Wait for frontend to start
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================"
Write-Host "✅ Services Started Successfully!"
Write-Host "========================================"
Write-Host ""
Write-Host "📍 Dashboard:  http://localhost:3000"
Write-Host "📍 API Server: http://localhost:5000"
Write-Host ""
Write-Host "Press Ctrl+C to stop all services"
Write-Host ""

# Keep script running
while ($true) {
    Start-Sleep -Seconds 10
}
