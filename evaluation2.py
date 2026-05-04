import pandas as pd
import re
import hashlib
import spacy
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, f1_score

# Initialize SpaCy
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import os
    os.system("python -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# --- 1. CORE FUNCTIONS ---

def clean_text_improved(text):
    """Member B's improved cleaning: retains context like ! and ?."""
    text = str(text).lower()
    text = re.sub(r'[^a-z\s!?]', '', text)
    return text

def generate_hash(text):
    """Member C's hashing for student privacy."""
    return hashlib.sha256(text.encode()).hexdigest()

def mask_text(text, name, roll, email):
    """Member C's PII masking logic."""
    text = str(text)
    text = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[EMAIL]', text)
    text = text.replace(name, '[STUDENT]')
    text = text.replace(roll, '[ROLL]')
    text = text.replace(email, '[EMAIL]')
    text = re.sub(r'\b\d+\b', '[ROLL]', text)
    return text

# --- 2. DATA PIPELINE & AUDIT TRAINING ---

def main():
    # Load dataset
    try:
        df = pd.read_csv('edufeed_clean.csv')
    except FileNotFoundError:
        print("Error: 'edufeed_clean.csv' not found. Please ensure the file is in the script directory.")
        return

    # Data Cleaning & Validation
    df = df.dropna(subset=['comments', 'student_star'])
    
    def map_sentiment(rating):
        if rating >= 4: return "positive"
        elif rating == 3: return "neutral"
        else: return "negative"

    df['sentiment_label'] = df['student_star'].apply(map_sentiment)
    df['cleaned_comments'] = df['comments'].apply(clean_text_improved)

    X = df['cleaned_comments']
    y = df['sentiment_label']

    # Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Person A Audit Settings: Trigrams & 7000 features
    tfidf = TfidfVectorizer(max_features=7000, ngram_range=(1,3), min_df=2)
    X_train_vec = tfidf.fit_transform(X_train)
    X_test_vec = tfidf.transform(X_test)

    # Person A Hyperparameters: C=2, Balanced Weights
    lr_model = LogisticRegression(max_iter=2000, class_weight='balanced', C=2)
    lr_model.fit(X_train_vec, y_train)

    # --- 3. AUDIT REPORT (PERSON A TASKS) ---
    
    y_pred = lr_model.predict(X_test_vec)
    
    print("\n" + "="*50)
    print("PERSON A: MACHINE LEARNING AUDIT REPORT")
    print("="*50)

    print("\n### 1. PERFORMANCE METRICS")
    print(classification_report(y_test, y_pred))

    # Neutral Class Focus
    neutral_val = 'neutral' if 'neutral' in y.unique() else 'Neutral'
    f1_neut = f1_score(y_test, y_pred, labels=[neutral_val], average='weighted')
    print(f"### 2. NEUTRAL CLASS F1-SCORE: {f1_neut:.4f}")

    # Overfitting Check
    train_acc = lr_model.score(X_train_vec, y_train)
    test_acc = lr_model.score(X_test_vec, y_test)
    print(f"### 3. OVERFITTING CHECK")
    print(f"Training Accuracy: {train_acc:.4f}")
    print(f"Testing Accuracy:  {test_acc:.4f}")
    print(f"Generalization Gap: {train_acc - test_acc:.4f}")

    # --- 4. INTERACTIVE SYSTEM TEST ---
    
    print("\n" + "="*50)
    print("INTEGRATED FEEDBACK SYSTEM TEST")
    print("="*50)
    
    sample_review = "The lectures are excellent! But the assignments are a bit difficult?"
    # Mocking inputs for demonstration
    s_name, s_roll, s_email = "Bhavana", "21CS001", "bhavana@example.com"
    
    masked = mask_text(sample_review, s_name, s_roll, s_email)
    cleaned = clean_text_improved(masked)
    vec = tfidf.transform([cleaned])
    pred = lr_model.predict(vec)[0]

    print(f"Original: {sample_review}")
    print(f"Masked:   {masked}")
    print(f"Sentiment: {pred}")

if __name__ == "__main__":
    main()