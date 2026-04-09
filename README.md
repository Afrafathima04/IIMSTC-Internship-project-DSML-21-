# IIMSTC-Internship-project-DSML-21-
Title: Ed-Feed — AI-Driven Student Feedback Analysis & Insight Generation System

> Real-time NLP pipeline that transforms raw student feedback into structured sentiment insights and actionable recommendations for educators.

Overview:

Ed-Feed is an end-to-end intelligent feedback analysis system built for higher education institutions. It collects free-text student feedback, processes it through a multi-stage NLP pipeline, and delivers live sentiment insights, topic breakdowns, and LLM-generated recommendations directly to a faculty dashboard — within seconds of submission.

The system addresses five critical gaps identified across eight peer-reviewed studies in educational NLP:
- No existing tool provides real-time feedback analysis
- Generic NLP models fail on education-specific language
- No tool combines difficulty index with sentiment for root-cause diagnosis
- Enterprise tools are unaffordable for small institutions
- Existing dashboards show data but generate no actionable recommendations

System Architecture:

Student Feedback (Web / Mobile)
        ↓
   REST API / WebSocket  (FastAPI)
        ↓
   Redis Queue + Celery Workers
        ↓
┌──────────────────────────────────────┐
│         NLP Analysis Layer           │
│  • Sentiment    → BERT / RoBERTa     │
│  • Topics       → BERTopic / LDA     │
│  • Keywords     → KeyBERT            │
│  • Intent       → Zero-shot BART     │
└──────────────────────────────────────┘
        ↓
   LLM Insight Engine  (Gemini 1.5 Flash / Claude Haiku)
        ↓
   Real-Time Faculty Dashboard  (React + Chart.js)

 Key Features:

- Real-time pipeline — feedback analysed within 500ms of submission
- Aspect-based sentiment analysis (ABSA)— separate scores for teaching quality, course content, assignments, exams, and platform
- Difficulty-Sentiment Matrix — distinguishes course difficulty issues from teaching quality issues
- LLM-generated summaries — auto-produces human-readable insight cards and alert narratives for faculty
- Live dashboard — sentiment trend charts, word clouds, topic breakdowns, and threshold-based alerts
- Anonymous by design— PII stripped at ingestion via spaCy NER before any storage

NLP Models:

| Model | Purpose | Expected Performance |
| RoBERTa (fine-tuned) | Primary aspect-level sentiment classifier | Accuracy 88–94%, F1 > 85% |
| BERT (fine-tuned) | Core sentiment classification | High accuracy, strong baseline |
| DistilBERT | Real-time low-latency inference | 97% of BERT performance, 40% faster |
| BERTopic | Theme and topic extraction | Coherence score Cv ≥ 0.55 |
| LDA | Large-corpus topic modelling | Used with 1000+ feedback records |
| KeyBERT | Keyword and key-phrase extraction | Powers word cloud and tagging |
| VADER / SentiStrength | Lightweight lexicon baseline | Accuracy ~75–80%, instant inference |
| facebook/bart-large-mnli | Zero-shot intent classification | No training data required |

LLM Integration:

LLMs act as the **last-mile insight layer** — they receive aggregated NLP outputs and generate natural language summaries and alerts for the dashboard.

| LLM | Role |
| Gemini 1.5 Flash | Primary — real-time streaming summaries (1M token context) |
| Claude Haiku | Structured JSON insight generation, alert drafting |
| GPT-4o mini | High-quality summary fallback |
| Llama 3.1 8B (local) | Privacy-first on-premise deployment option |
| Mistral 7B (local) | Budget-friendly college server deployment |

Dataset:

Primary:RateMyProfessor sample dataset — 20,000 records, 51 features

| Feature | Type | Purpose |
| `comments` | Text | Core NLP input — free-text reviews |
| `star_rating` | Numeric | Overall satisfaction score |
| `diff_index` | Numeric | Course difficulty perception |
| `would_take_again` | Boolean | Teaching effectiveness indicator |
| `department_name` | Categorical | Department-level pattern analysis |
| `tags` | Categorical | Structured teaching attribute labels |

Secondary sources used for benchmarking:
- Coursera course review dataset (P3, P4 in literature review)
- SemEval ABSA dataset (restaurant and laptop domains — P5)
- Synthetic augmentation via LLM paraphrasing where data is scarce

Tech Stack:

| Layer | Technologies |
| Backend | Python, FastAPI, Celery, Redis, PostgreSQL, SQLAlchemy |
| NLP / ML | PyTorch, HuggingFace Transformers, spaCy, NLTK, BERTopic, KeyBERT, ONNX |
| LLM APIs | Gemini API, Anthropic API, Ollama (local), LangChain |
| Frontend | React.js, Chart.js, Recharts, Socket.io, TailwindCSS |
| Deployment | Docker, AWS / GCP, GitHub Actions (CI/CD) |

Getting Started:

Prerequisites:
Python 3.10+
Node.js 18+
Redis
PostgreSQL

Installation:
# Clone the repository
git clone https://github.com/your-username/ed-feed.git
cd ed-feed

# Backend setup
pip install -r requirements.txt

# Frontend setup
cd dashboard
npm install

# Environment variables
cp .env.example .env

# Add your Gemini API key, Anthropic API key, DB credentials
Run locally

# Start Redis
redis-server

# Start Celery worker
celery -A app.worker worker --loglevel=info

# Start FastAPI backend
uvicorn app.main:app --reload

# Start React dashboard
cd dashboard && npm run dev

Evaluation Metrics:

| Metric | Target |
| F1-Score (Macro) | ≥ 0.85 across all sentiment classes |
| Aspect-level F1 | Reported separately per aspect category |
| Topic Coherence (Cv) | ≥ 0.55 for BERTopic / LDA |
| Inter-rater reliability | κ > 0.70, Pearson r > 0.800 (aligned with Morris et al., 2025) |
| Pipeline latency (P95) | < 500ms per feedback for real-time requirement |

Literature Foundation:

This system is grounded in a structured review of eight peer-reviewed papers (2021–2025):

| Paper | Key Contribution |
| Shaik et al. (2023) | Survey of ML/DL/BERT approaches in educational SA |
| Kastrati et al. (2021) | PRISMA mapping — identified standardised dataset gap |
| Dalipi et al. (2022) | MOOC-specific SLR — identified real-time gap |
| Abdi et al. (2023) | DTLP model — BiLSTM + linguistic knowledge, Acc 88.78% |
| Hua et al. (2024) | Largest ABSA SLR — confirmed education domain gap |
| Grimalt-Álvaro & Usart (2024) | Formative assessment SA — called for teacher dashboards |
| Deshpande et al. (2025) | ML comparison on faculty feedback — RF Acc 91% |
| Morris et al. (2025) | Fine-tuned RoBERTa for real-time formative feedback |

 Roadmap:
- System architecture design
- Dataset selection and overview
- Literature review and gap analysis
- Data preprocessing pipeline
- BERT / RoBERTa fine-tuning on education feedback
- ABSA aspect extraction module
- BERTopic integration
- FastAPI backend + Redis queue
- LLM insight generation layer
- React faculty dashboard
- Docker deployment
- Model publishing on HuggingFace

Future Work:

- Explainable AI (XAI) methods for transparent LLM scoring decisions
- Cross-institutional generalisation testing
- Peer and self-assessment feedback analysis
- EduBERT fine-tuning for deeper academic language understanding

Acknowledgements:

Built on research from Natural Language Processing Journal (Elsevier), Applied Sciences (MDPI), Frontiers in Education, Soft Computing (Springer), Artificial Intelligence Review (Springer), Journal of Computing in Higher Education (Springer), Advances in Continuous and Discrete Models (Springer), and International Journal of Artificial Intelligence in Education (Springer).
