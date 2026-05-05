# Edfeed Dashboard - Integration Setup Guide

## 📋 Overview

Your Edfeed Dashboard is now connected to an advanced ML-powered system with Groq LLM integration. This guide explains the new architecture and how to run it.

---

## 🏗️ System Architecture

### Backend Stack
```
Flask API (app.py)
├── Legacy Model (feedback.csv + TF-IDF + Logistic Regression)
├── TensorFlow Model (best_model.keras)
│   ├── TextVectorization (20k vocab, 100 max length)
│   ├── Embedding Layer (64 dims)
│   ├── 2 × Bidirectional LSTM (64+32 units)
│   └── Dense + Softmax (3 classes: positive, neutral, negative)
└── Groq LLM Integration
    └── Llama 3.1 8B Instant
```

### Frontend Stack
```
Next.js App (/app)
├── Dashboard Pages
├── API Routes (/api/ai-summary)
└── Components
    └── AI Summary Cards (with Groq insights)
```

---

## 🚀 Installation & Setup

### Step 1: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Key Dependencies:**
- `tensorflow==2.13.0` - Deep learning framework
- `groq==0.4.1` - Groq API client
- `flask==2.3.3` - Web framework
- `scikit-learn==1.3.0` - ML utilities

### Step 2: Configure Environment Variables

The `.env` file already has the Groq API key configured:
```env
GROQ_API_KEY=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
GROQ_MODEL=llama-3.1-8b-instant
```

### Step 3: Verify Required Files

Ensure these files exist in your project:

```
Edfeed dashboard/
├── backend/
│   ├── app.py (✅ UPDATED)
│   ├── model.py
│   ├── tensorflow_predictor.py (✨ NEW)
│   ├── groq_insights.py (✨ NEW)
│   ├── best_model (1).keras/ (✅ REQUIRED)
│   ├── feedback.csv
│   ├── feedback_store.json
│   ├── requirements.txt (✅ UPDATED)
│   ├── .env
│   └── .env.example
├── app/
│   ├── api/
│   │   └── ai-summary/route.ts (✅ UPDATED)
│   └── ...
└── lib/
    └── dashboard-context.tsx
```

### Step 4: Install Frontend Dependencies (if needed)

```bash
npm install
# or
pnpm install
```

---

## 🎯 Running the Application

### Terminal 1: Start Backend

```bash
cd backend
python app.py
```

You should see:
```
============================================================
🚀 EDFEED DASHBOARD BACKEND - STARTING
============================================================
TensorFlow Model: ✅ ENABLED
Groq LLM: ✅ ENABLED
Legacy Model: ✅ ENABLED
============================================================

✅ TensorFlow model loaded successfully
✅ Text vectorizer initialized
✅ Groq client initialized
```

The Flask server runs on: **http://localhost:5000**

### Terminal 2: Start Frontend

```bash
npm run dev
# or
pnpm dev
```

The Next.js app runs on: **http://localhost:3000**

---

## 📡 API Endpoints

### 1. Get All Data
```
GET http://localhost:5000/api/data
```
Returns: Merged feedback from `feedback.csv` + `feedback_store.json`

### 2. Predict Sentiment (NEW - TensorFlow + Groq)
```
POST http://localhost:5000/api/predict
Content-Type: application/json

{
  "text": "The lectures are excellent and engaging!",
  "name": "Student Name",
  "usn": "21CS001",
  "email": "student@example.com"
}
```

Response:
```json
{
  "sentiment": "positive",
  "confidence": 0.95,
  "source": "tensorflow",
  "processed_text": "...",
  "all_predictions": {
    "negative": 0.02,
    "neutral": 0.03,
    "positive": 0.95
  }
}
```

### 3. Generate AI Summary (NEW - Groq LLM)
```
POST http://localhost:5000/api/ai-summary
Content-Type: application/json

{
  "data": [
    {
      "comments": "Great teaching method",
      "sentiment_label": "positive",
      "star_rating": 4.5,
      "department_name": "CSE",
      "professor_name": "Dr. Smith"
    },
    ...
  ]
}
```

Response:
```json
{
  "strengths": [
    "Clear and engaging teaching methods",
    "Good student-teacher interaction",
    "Well-structured curriculum"
  ],
  "problems": [
    "Need more practical assignments",
    "Some lab resources are outdated",
    "Feedback collection could be more frequent"
  ],
  "suggestions": [
    "Implement real-world project-based learning",
    "Schedule lab equipment upgrades quarterly",
    "Collect feedback bi-weekly instead of monthly"
  ],
  "source": "ai",
  "provider": "Groq (llama-3.1-8b-instant)"
}
```

### 4. Add Feedback
```
POST http://localhost:5000/api/add-feedback
Content-Type: application/json

{
  "comments": "New feedback",
  "sentiment": "positive",
  "department_name": "CSE",
  "professor_name": "Dr. Smith",
  "star_rating": 4.5,
  "name": "Student Name",
  "usn": "21CS001",
  "email": "student@example.com"
}
```

### 5. Health Check
```
GET http://localhost:5000/api/health
```

Response:
```json
{
  "status": "ok",
  "models": {
    "tensorflow": true,
    "groq": true,
    "legacy": true
  }
}
```

---

## 🧠 Model Details

### TensorFlow Model Architecture
- **Input:** Text feedback (anonymized, up to 100 tokens)
- **Embedding:** 64-dimensional word embeddings
- **Processing:** 2 Bidirectional LSTM layers (64 + 32 units)
- **Dense Layers:** 64 units ReLU + 0.4 Dropout
- **Output:** 3 classes (negative, neutral, positive) with softmax
- **Training Data:** ~35k balanced educational feedback samples

### Groq LLM Integration
- **Model:** Llama 3.1 8B Instant
- **Purpose:** Generate human-readable insights and recommendations
- **Inputs:** Feedback comments, sentiment distribution, keywords
- **Outputs:** 
  - Top 3 Strengths
  - Top 3 Problems
  - Top 3 Suggestions

---

## 🔄 Data Flow

```
User Submits Feedback
        ↓
┌───────────────────────┐
│ TensorFlow Prediction │ ← best_model.keras
└───────────────────────┘
        ↓ (sentiment label)
┌───────────────────────────────┐
│ Groq LLM Analysis             │ ← llama-3.1-8b-instant
│ • Extract keywords            │
│ • Analyze sentiment trends    │
│ • Generate recommendations   │
└───────────────────────────────┘
        ↓
Dashboard displays:
• Sentiment label (positive/neutral/negative)
• Confidence score
• AI-generated insights (strengths/problems/suggestions)
```

---

## 🛠️ Troubleshooting

### Issue: "Model not found at best_model (1).keras"
**Solution:** Ensure the model file exists in the backend directory. The model should contain the trained weights.

### Issue: "Groq API request failed"
**Solution:** 
1. Check API key in `.env` file
2. Verify internet connection
3. Check Groq API status

### Issue: "TensorFlow model loaded successfully" but predictions fail
**Solution:**
1. Check TensorFlow version compatibility
2. Verify all model files are complete
3. Try reinstalling TensorFlow: `pip install --force-reinstall tensorflow==2.13.0`

### Issue: Frontend shows "Error generating insights"
**Solution:**
1. Check backend health: `curl http://localhost:5000/api/health`
2. Check Flask logs in terminal
3. Verify CORS is enabled in Flask

---

## 📊 Monitoring & Logging

### Check Backend Status
```bash
curl http://localhost:5000/api/health
```

### View Flask Logs
Check the terminal where you ran `python app.py`

### Test Prediction Endpoint
```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Excellent course!",
    "name": "Test User",
    "usn": "21TEST01",
    "email": "test@example.com"
  }'
```

---

## 📈 Performance Tips

1. **Batch Processing:** For large datasets, batch predictions together
2. **Caching:** Recent summaries are cached to reduce API calls
3. **Async Loading:** Frontend loads AI summaries without blocking UI
4. **Model Optimization:** TensorFlow model uses optimized inference

---

## 🔐 Security Notes

1. **API Key:** Groq API key is stored in `.env` (not committed to git)
2. **PII Masking:** Email, phone, and names are automatically anonymized
3. **CORS:** Configured to allow dashboard access only
4. **Input Validation:** All endpoints validate and sanitize input

---

## 🤝 Support

For issues or questions:
1. Check the logs (Terminal 1 & 2)
2. Verify environment configuration
3. Test individual endpoints with curl
4. Check Groq API status: https://status.groq.com

---

## 📝 Next Steps

1. ✅ Run the backend: `python app.py`
2. ✅ Run the frontend: `npm run dev`
3. ✅ Open dashboard: http://localhost:3000
4. ✅ Submit feedback and see AI-powered insights!

---

**Last Updated:** April 2026  
**Status:** Production Ready ✅
