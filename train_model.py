#!/usr/bin/env python3
"""
Minimal TensorFlow sentiment model training script.
Saves inference artifacts to modelfile/ for backend use.
"""

import os
import sys
import json
import pandas as pd
import numpy as np
import joblib
import warnings
warnings.filterwarnings('ignore')

print("=" * 70)
print("EDUFEED SENTIMENT MODEL TRAINING")
print("=" * 70)

# ─────────────────────────────────────────────────────────────────────────────
# 1. LOAD DATA
# ─────────────────────────────────────────────────────────────────────────────
print("\n[1/5] Loading dataset...")

root_dir = os.path.dirname(os.path.abspath(__file__))
dataset_candidates = [
    os.path.join(root_dir, "edufeed_clean.csv"),
    os.path.join(root_dir, "public", "feedback.csv"),
]

dataset_path = None
for candidate in dataset_candidates:
    if os.path.exists(candidate):
        dataset_path = candidate
        break

if not dataset_path:
    print(f"ERROR: Dataset not found in {dataset_candidates}")
    sys.exit(1)

print(f"  Loading from: {dataset_path}")
if dataset_path.endswith(".xlsx"):
    df = pd.read_excel(dataset_path)
else:
    df = pd.read_csv(dataset_path)

# Validate required columns
if "comments" not in df.columns or "sentiment_label" not in df.columns:
    print(f"ERROR: Dataset must have 'comments' and 'sentiment_label' columns. Found: {df.columns.tolist()}")
    sys.exit(1)

# Clean data
df = df[["comments", "sentiment_label"]].dropna()
df["comments"] = df["comments"].astype(str).str.strip()
print(f"  Loaded {len(df)} rows")
print(f"  Label distribution:\n{df['sentiment_label'].value_counts()}")

# ─────────────────────────────────────────────────────────────────────────────
# 2. PREPARE DATA
# ─────────────────────────────────────────────────────────────────────────────
print("\n[2/5] Preparing data...")

from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

# Encode labels
label_encoder = LabelEncoder()
df['label_enc'] = label_encoder.fit_transform(df['sentiment_label'])
NUM_CLASSES = len(label_encoder.classes_)
print(f"  Classes: {label_encoder.classes_}")
print(f"  Label mapping: {dict(zip(label_encoder.classes_, label_encoder.transform(label_encoder.classes_)))}")

X = df['comments'].values
y = df['label_enc'].values

# Split: 70/15/15
X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.30, random_state=42, stratify=y)
X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp)

print(f"  Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}")

# ─────────────────────────────────────────────────────────────────────────────
# 3. BUILD & TRAIN MODEL
# ─────────────────────────────────────────────────────────────────────────────
print("\n[3/5] Building and training model...")

try:
    import tensorflow as tf
    from tensorflow import keras
except ImportError:
    print("ERROR: TensorFlow is not installed. Install with: pip install tensorflow scikit-learn pandas numpy joblib")
    sys.exit(1)

MAX_LEN = 100
VOCAB_SIZE = 20000
EMBEDDING_DIM = 64

# Tokenize & pad
print("  Tokenizing text...")
vectorizer = tf.keras.layers.TextVectorization(
    max_tokens=VOCAB_SIZE,
    output_sequence_length=MAX_LEN,
    split='whitespace',
)
vectorizer.adapt(X_train[:min(5000, len(X_train))])

X_train_pad = vectorizer(X_train).numpy()
X_val_pad = vectorizer(X_val).numpy()
X_test_pad = vectorizer(X_test).numpy()

y_train_cat = keras.utils.to_categorical(y_train, NUM_CLASSES)
y_val_cat = keras.utils.to_categorical(y_val, NUM_CLASSES)
y_test_cat = keras.utils.to_categorical(y_test, NUM_CLASSES)

print(f"  X_train_pad shape: {X_train_pad.shape}")

# Use CPU/GPU automatically
print("  Building model...")
inp = keras.Input(shape=(MAX_LEN,))
x = keras.layers.Embedding(VOCAB_SIZE, EMBEDDING_DIM)(inp)
x = keras.layers.SpatialDropout1D(0.2)(x)
x = keras.layers.Bidirectional(keras.layers.LSTM(64, return_sequences=True, dropout=0.2))(x)
x = keras.layers.Bidirectional(keras.layers.LSTM(32, dropout=0.2))(x)
x = keras.layers.Dense(64, activation='relu')(x)
x = keras.layers.Dropout(0.4)(x)
out = keras.layers.Dense(NUM_CLASSES, activation='softmax')(x)

model = keras.Model(inp, out)
model.compile(
    optimizer=keras.optimizers.Adam(1e-3),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print("  Model architecture:")
model.summary()

print("  Training...")
callbacks = [
    keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=4, restore_best_weights=True),
    keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-6)
]

history = model.fit(
    X_train_pad, y_train_cat,
    validation_data=(X_val_pad, y_val_cat),
    epochs=20,
    batch_size=32,
    callbacks=callbacks,
    verbose=1
)

# ─────────────────────────────────────────────────────────────────────────────
# 4. EVALUATE
# ─────────────────────────────────────────────────────────────────────────────
print("\n[4/5] Evaluating model...")

test_loss, test_acc = model.evaluate(X_test_pad, y_test_cat, verbose=0)
print(f"  Test Accuracy: {test_acc:.4f}")
print(f"  Test Loss: {test_loss:.4f}")

from sklearn.metrics import classification_report
y_pred = np.argmax(model.predict(X_test_pad), axis=1)
print("\n  Classification Report:")
print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

# ─────────────────────────────────────────────────────────────────────────────
# 5. SAVE ARTIFACTS FOR BACKEND
# ─────────────────────────────────────────────────────────────────────────────
print("\n[5/5] Saving model artifacts...")

model_dir = os.path.join(root_dir, "modelfile")
os.makedirs(model_dir, exist_ok=True)

# Save as .keras format
model_path = os.path.join(model_dir, "best_model.keras")
model.save(model_path)
print(f"  ✓ Saved {model_path}")

# Save config + weights for fallback
config_path = os.path.join(model_dir, "config.json")
with open(config_path, "w", encoding="utf-8") as f:
    f.write(model.to_json())
print(f"  ✓ Saved {config_path}")

weights_path = os.path.join(model_dir, "model.weights.h5")
model.save_weights(weights_path)
print(f"  ✓ Saved {weights_path}")

# Save tokenizer config
tokenizer_config_path = os.path.join(model_dir, "tokenizer_config.json")
with open(tokenizer_config_path, "w", encoding="utf-8") as f:
    json.dump(vectorizer.get_config(), f, indent=2)
print(f"  ✓ Saved {tokenizer_config_path}")

# Save tokenizer vocabulary
tokenizer_vocab_path = os.path.join(model_dir, "tokenizer_vocab.json")
with open(tokenizer_vocab_path, "w", encoding="utf-8") as f:
    json.dump(vectorizer.get_vocabulary(), f, indent=2)
print(f"  ✓ Saved {tokenizer_vocab_path}")

# Save label encoder
label_encoder_path = os.path.join(model_dir, "label_encoder.pkl")
joblib.dump(label_encoder, label_encoder_path)
print(f"  ✓ Saved {label_encoder_path}")

# Save metrics
metrics = {
    "accuracy": float(test_acc),
    "loss": float(test_loss),
    "epochs_trained": len(history.history["loss"]),
    "num_classes": int(NUM_CLASSES),
    "vocab_size": int(VOCAB_SIZE),
    "max_length": int(MAX_LEN),
}
metrics_path = os.path.join(model_dir, "metrics.json")
with open(metrics_path, "w", encoding="utf-8") as f:
    json.dump(metrics, f, indent=2)
print(f"  ✓ Saved {metrics_path}")

print("\n" + "=" * 70)
print("SUCCESS! Model trained and saved.")
print("=" * 70)
print(f"\nRestart your backend server to load the new model.")
print(f"The dashboard sentiment prediction will now use TensorFlow inference.")
