$projectRoot = "C:\Users\Aishwarya S Koti\Downloads\Edfeed dashboard"
$backendDir = Join-Path $projectRoot "backend"
$pythonExe = "C:\Users\Aishwarya S Koti\AppData\Local\Programs\Python\Python310\python.exe"

if (-not (Test-Path $pythonExe)) {
  $pythonExe = "python"
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendDir'; & '$pythonExe' app.py"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot'; npm run dev"
