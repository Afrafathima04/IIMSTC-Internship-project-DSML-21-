# ED-FEED: AI-Driven Intelligent Student Feedback Analysis and Insight Generation System

**IIMSTC DSML Internship — Cohort 21 | Industry Internship Project Report**

---

## Overview

ED-FEED is an end-to-end AI-powered system that automates the analysis of student feedback in educational institutions. It uses Natural Language Processing (NLP) and deep learning to classify free-text feedback into Positive, Negative, and Neutral sentiments, surfacing actionable insights for educators through a real-time dashboard.

The system addresses a critical gap in EdTech: institutions collect large volumes of qualitative feedback but lack scalable, automated tools to process it meaningfully.

---

## Key Features

- **Three-class sentiment classification** (Positive / Negative / Neutral) using a Bidirectional LSTM (Bi-LSTM) model
- **LLM-assisted data labelling** via LLaMA 3.1 8B Instant (Groq Cloud API) with zero-shot, deterministic prompts across 35,000 samples
- **Privacy-first pipeline** — PII anonymization using regex + spaCy NER before any model training or inference
- **Real-time inference** with sub-500ms latency on standard CPU hardware
- **Educator dashboard** with sentiment distributions, trend analysis, aspect breakdowns, and alert flagging
- **Distributed training** across 2× NVIDIA T4 GPUs using TensorFlow MirroredStrategy

---

## Model Architecture

The classifier is a Bidirectional LSTM network built in TensorFlow/Keras:

```
Embedding (vocab: 20k, dim: 64)
    → SpatialDropout1D (20%)
    → BiLSTM (128 units, return_sequences=True)
    → BiLSTM (64 units, return_sequences=False)
    → Dense (64 units, ReLU) + Dropout (40%)
    → Dense Output (3 units, Softmax)
```

**Test Set Performance (35,421 balanced samples):**

| Metric | Value |
|---|---|
| Overall Accuracy | 84% |
| Macro F1 Score | 0.84 |
| Negative Recall | 0.90 |
| Positive Precision | 0.88 |

---

## Pipeline Stages

1. **Data Ingestion** — Feedback collected via web forms / LMS integrations, tagged with course/instructor/semester metadata
2. **PII Anonymization** — Regex + spaCy NER removes names, emails, phone numbers, IDs
3. **Text Preprocessing** — Lowercasing, tokenization, stop word removal, Porter stemming
4. **LLM Re-Labelling** — LLaMA 3.1 8B via Groq API; temperature 0.0 for deterministic labels; CSV caching to avoid redundant calls
5. **Vectorization** — TensorFlow TextVectorization: 20k-token vocab, padded/truncated to 100 tokens
6. **Model Training** — Bi-LSTM with Early Stopping, Model Checkpointing, ReduceLROnPlateau callbacks
7. **Real-Time Inference** — Saved checkpoint serves predictions; <500ms per comment on CPU
8. **Dashboard Visualization** — Sentiment pie charts, trend lines, aspect breakdowns, flagged items

---

## Tech Stack

| Category | Technology |
|---|---|
| Language | Python |
| Deep Learning | TensorFlow / Keras |
| NLP | spaCy, NLTK |
| ML Utilities | scikit-learn |
| LLM Re-Labelling | Groq Cloud API + LLaMA 3.1 8B |
| Data Handling | pandas, NumPy |
| Visualization | Matplotlib, Seaborn |
| Dashboard | React / Flask |
| Training Platform | Kaggle Notebooks (2× NVIDIA T4) |
| Version Control | Git / GitHub |

---

## Hardware Requirements

**Training:**
- GPU: 2× NVIDIA Tesla T4 (16 GB VRAM each)
- RAM: 16 GB minimum (32 GB recommended)
- Storage: 50 GB SSD

**Inference / Deployment:**
- CPU only (no GPU required)
- RAM: 8 GB minimum
- Storage: 10 GB SSD

---

## Results Summary

The Bi-LSTM model achieves **84% accuracy** on a balanced 3-class test set (11,807 samples per class), with consistent F1 scores across all sentiment classes. The Negative class achieves the highest recall (0.90), making the system particularly sensitive to dissatisfied student responses — the most operationally critical signal in a deployment context. The primary challenge is the Neutral–Positive boundary, a limitation consistent with findings across the sentiment analysis literature.

---

## Limitations

- Neutral class ambiguity remains the hardest classification challenge
- No explainability mechanism (black-box predictions)
- English-only; no multilingual support
- Trained on online platform data (RateMyProfessor, Coursera, Waterloo, Exeter) — may not generalize to all institution types without fine-tuning
- Batch processing only; no true real-time streaming yet

---

## Future Work

- Fine-tune BERT / RoBERTa / EduBERT on the labelled corpus
- Add Explainable AI (LIME, SHAP, attention visualization)
- Aspect-level sentiment analysis (teaching quality, assignment difficulty, infrastructure, etc.)
- Multilingual support (mBERT / XLM-RoBERTa for Hindi, Tamil, Telugu, etc.)
- Real-time streaming pipeline (Apache Kafka + TensorFlow Serving / ONNX Runtime)
- LLM-generated personalized educator recommendations

---

## References

Full references are listed in the project report. Key tools and frameworks:

- [TensorFlow](https://www.tensorflow.org) / [Keras](https://keras.io)
- [spaCy](https://spacy.io) / [NLTK](https://www.nltk.org)
- [Groq API](https://console.groq.com) + [LLaMA (Meta AI)](https://ai.meta.com/llama)
- [scikit-learn](https://scikit-learn.org) / [pandas](https://pandas.pydata.org) / [NumPy](https://numpy.org)
- [Seaborn](https://seaborn.pydata.org) / [Matplotlib](https://matplotlib.org)
- [Kaggle](https://www.kaggle.com) / [GitHub](https://github.com)

---

*IIMSTC DSML Internship, Cohort 21 — Industry Internship Project Report*
