
import tensorflow as tf
print(f"TensorFlow: {tf.__version__}")
print(f"GPUs found: {tf.config.list_physical_devices('GPU')}")

import os, time, re, json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import warnings
warnings.filterwarnings('ignore')

from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

print("All imports successful ✅")



root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATASET_PATHS = [
    os.path.join(root_dir, "edufeed_clean.csv"),
    os.path.join(root_dir, "public", "feedback.csv"),
    "/kaggle/input/datasets/sonu7676/data-for-tensorflow/balanced_edufeed_dataset (2).xlsx",
]

dataset_path = next((path for path in DATASET_PATHS if os.path.exists(path)), None)
if dataset_path is None:
    raise FileNotFoundError(
        "Dataset not found. Place edufeed_clean.csv in the repository root or update the training script dataset paths."
    )

if dataset_path.lower().endswith(".xlsx"):
    df = pd.read_excel(dataset_path)
else:
    df = pd.read_csv(dataset_path)

if "comments" not in df.columns or "sentiment_label" not in df.columns:
    raise ValueError("Dataset must contain 'comments' and 'sentiment_label' columns.")

print(f'Total samples: {len(df)}')
df = df[["comments", "sentiment_label"]].dropna()
df["comments"] = df["comments"].astype(str).str.strip()
print("Loaded dataset from", dataset_path)

# In[6]:


print(df['comments'].str.len().describe())

# In[7]:

print("Skipping Groq cache checks because local TensorFlow inference is being used.")

# In[8]:


from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from tensorflow import keras
import numpy as np

# Encode labels
label_encoder = LabelEncoder()
df['label_enc'] = label_encoder.fit_transform(df['sentiment_label'])
NUM_CLASSES = len(label_encoder.classes_)
print('Label mapping:', dict(zip(label_encoder.classes_, label_encoder.transform(label_encoder.classes_))))

X = df['comments'].values
y = df['label_enc'].values

# 70 / 15 / 15 split
X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.30, random_state=42, stratify=y)
X_val, X_test, y_val, y_test     = train_test_split(X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp)

print(f'Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}')

# In[12]:


import re
import pandas as pd

PATTERNS = [
    (re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'), '<EMAIL>'),
    (re.compile(r'(\+91[\-\s]?)?[6-9]\d{9}'), '<PHONE>'),
    (re.compile(r'http\S+|www\.\S+'), '<URL>'),
    (re.compile(r'\b[A-Z]{2,4}\d{2,4}[A-Z]{0,3}\d{0,4}\b'), '<ID>'),
    (re.compile(r'\b\d{5,}\b'), '<NUM>'),
    (re.compile(r'(?<![.\n])\b[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})*\b'), '<NAME>'),
]

def anonymize_text(text):
    if pd.isna(text):
        return ""
    for pattern, repl in PATTERNS:
        text = pattern.sub(repl, text)
    return text.strip()

df['comments'] = df['comments'].apply(anonymize_text)

print("Anonymization done ✅")
print(df['comments'].head())

# In[13]:


# Fastest tokenization — tf.data pipeline + vectorization
import tensorflow as tf

MAX_LEN   = 100
VOCAB_SIZE = 20000
EMBEDDING_DIM = 64

vectorizer = tf.keras.layers.TextVectorization(
    max_tokens=VOCAB_SIZE,
    output_sequence_length=MAX_LEN,
    split='whitespace',       # faster than default
    ngrams=None               # no ngrams = faster
)

# adapt on small sample — vocab stabilizes at 5k rows
vectorizer.adapt(X_train[:5000])

X_train_pad = vectorizer(X_train).numpy()
X_val_pad   = vectorizer(X_val).numpy()
X_test_pad  = vectorizer(X_test).numpy()

y_train_cat = keras.utils.to_categorical(y_train, NUM_CLASSES)
y_val_cat   = keras.utils.to_categorical(y_val,   NUM_CLASSES)
y_test_cat  = keras.utils.to_categorical(y_test,  NUM_CLASSES)

print(f'X_train_pad shape: {X_train_pad.shape}')
print("Data ready ✅")

# In[ ]:




# In[14]:


import tensorflow as tf

if tf.config.list_physical_devices("GPU"):
    strategy = tf.distribute.MirroredStrategy()
else:
    strategy = tf.distribute.get_strategy()
print(f"Using strategy: {strategy.__class__.__name__}")

with strategy.scope():
    inp = keras.Input(shape=(MAX_LEN,))
    x   = keras.layers.Embedding(VOCAB_SIZE, EMBEDDING_DIM)(inp)
    x   = keras.layers.SpatialDropout1D(0.2)(x)
    x   = keras.layers.Bidirectional(keras.layers.LSTM(64, return_sequences=True, dropout=0.2))(x)
    x   = keras.layers.Bidirectional(keras.layers.LSTM(32, dropout=0.2))(x)
    x   = keras.layers.Dense(64, activation='relu')(x)
    x   = keras.layers.Dropout(0.4)(x)
    out = keras.layers.Dense(NUM_CLASSES, activation='softmax')(x)

    model = keras.Model(inp, out)
    model.compile(
        optimizer=keras.optimizers.Adam(1e-3),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

model.summary()

# In[15]:


MODEL_DIR = os.path.dirname(__file__)
model_path = os.path.join(MODEL_DIR, "best_model.keras")

callbacks = [
    keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=4, restore_best_weights=True),
    keras.callbacks.ModelCheckpoint(model_path, monitor='val_accuracy', save_best_only=True),
    keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-6)
]

history = model.fit(
    X_train_pad, y_train_cat,
    validation_data=(X_val_pad, y_val_cat),
    epochs=20,
    batch_size=128,
    callbacks=callbacks
)

# Save inference artifacts for backend loading
print("Saving inference bundle to", MODEL_DIR)
model.save(model_path)
with open(os.path.join(MODEL_DIR, "config.json"), "w", encoding="utf-8") as file:
    file.write(model.to_json())
model.save_weights(os.path.join(MODEL_DIR, "model.weights.h5"))

with open(os.path.join(MODEL_DIR, "tokenizer_config.json"), "w", encoding="utf-8") as file:
    json.dump(vectorizer.get_config(), file, indent=2)
with open(os.path.join(MODEL_DIR, "tokenizer_vocab.json"), "w", encoding="utf-8") as file:
    json.dump(vectorizer.get_vocabulary(), file, indent=2)

joblib.dump(label_encoder, os.path.join(MODEL_DIR, "label_encoder.pkl"))

metrics = {
    "accuracy": float(history.history["val_accuracy"][-1]) if history.history.get("val_accuracy") else None,
    "loss": float(history.history["val_loss"][-1]) if history.history.get("val_loss") else None,
}
with open(os.path.join(MODEL_DIR, "metrics.json"), "w", encoding="utf-8") as file:
    json.dump(metrics, file, indent=2)

print("Saved model bundle and tokenizer artifacts.")

# In[16]:


from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

best_model = keras.models.load_model(model_path)

test_loss, test_acc = best_model.evaluate(X_test_pad, y_test_cat, verbose=0)
print(f'Test Accuracy : {test_acc:.4f}')
print(f'Test Loss     : {test_loss:.4f}')

y_pred = np.argmax(best_model.predict(X_test_pad), axis=1)

print('\n── Classification Report ──')
print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

# Confusion matrix
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(7, 5))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=label_encoder.classes_,
            yticklabels=label_encoder.classes_)
plt.title('Confusion Matrix — TF Model')
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.tight_layout()
plt.savefig(os.path.join(MODEL_DIR, 'confusion_matrix.png'), dpi=150)
plt.show()

# In[17]:


import joblib
from tensorflow import keras

# ── LOAD ─────────────────────────────────────────────────────────────────
model = keras.models.load_model(model_path)
# vectorizer  ← already in memory from training cell
# label_encoder ← already in memory from training cell
print("Model loaded ✅")
print("Label classes:", label_encoder.classes_)

# In[ ]:



