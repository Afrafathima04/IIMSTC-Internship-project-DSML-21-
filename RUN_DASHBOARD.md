# Run The Dashboard

## One-time setup

1. Open PowerShell in:
   `C:\Users\Aishwarya S Koti\Downloads\Edfeed dashboard`
2. Install frontend packages:
   ```powershell
   npm install
   ```
3. Make sure Python dependencies are installed in your Python 3.10 environment:
   ```powershell
   pip install flask flask-cors pandas openpyxl tensorflow
   ```

## Normal way to run

You must run **2 servers** in **2 separate terminals**.

### Terminal 1: Flask backend
```powershell
cd "C:\Users\Aishwarya S Koti\Downloads\Edfeed dashboard\backend"
python app.py
```

Expected backend URL:
`http://localhost:5000`

Quick backend checks:
```powershell
http://localhost:5000/api/data
http://localhost:5000/api/model-status
http://localhost:5000/api/dataset-status
```

### Terminal 2: Next.js frontend
```powershell
cd "C:\Users\Aishwarya S Koti\Downloads\Edfeed dashboard"
npm run dev
```

Expected frontend URL:
`http://localhost:3000`

## Easy launcher

You can also run:
```powershell
powershell -ExecutionPolicy Bypass -File .\start-dashboard.ps1
```

This opens one window for the backend and one for the frontend.

## If you see `Failed to fetch`

Usually one of these is happening:

1. The backend is not running on port `5000`
2. The frontend is not running on port `3000`
3. The backend crashed with a Python error
4. The dataset file currently selected is invalid

## If dataset upload looks like it disappeared

Check:
```powershell
http://localhost:5000/api/dataset-status
```

If `using_uploaded_dataset` is `true`, the upload is still active.

## Recommended startup order

1. Start Flask backend
2. Wait until you see the server is running on `http://127.0.0.1:5000`
3. Start Next frontend
4. Open `http://localhost:3000`

## When changing model or dataset files

Restart the Flask backend after changing:

- model files
- tokenizer files
- label encoder files
- uploaded dataset state issues

The frontend usually does not need a restart for dataset changes, but the backend does for model file changes.
