import glob
import json
import os
import pickle
import re
import urllib.error
import urllib.request
from typing import Any

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "modelfile")
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOWNLOADS_DIR = os.path.join(os.path.expanduser("~"), "Downloads")

LABEL_ORDER = ["Positive", "Negative", "Neutral"]
MODEL_MODE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model_mode.json")


def load_local_env() -> None:
  env_path = os.path.join(ROOT_DIR, ".env.local")

  if not os.path.exists(env_path):
    return

  with open(env_path, "r", encoding="utf-8") as file:
    for raw_line in file:
      line = raw_line.strip()
      if not line or line.startswith("#") or "=" not in line:
        continue

      key, value = line.split("=", 1)
      key = key.strip()
      value = value.strip().strip('"').strip("'")

      if key and key not in os.environ:
        os.environ[key] = value


load_local_env()


ANONYMIZE_PATTERNS = [
  (re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"), "[Email]"),
  (re.compile(r"(\+91[\-\s]?)?[6-9]\d{9}"), "[Phone]"),
  (re.compile(r"http\S+|www\.\S+"), "[URL]"),
  (re.compile(r"\b[A-Z]{2,4}\d{2,4}[A-Z]{0,3}\d{0,4}\b", re.IGNORECASE), "[USN]"),
]


def extract_keywords(text: str) -> list[str]:
  words = re.findall(r"[a-zA-Z]{4,}", text.lower())
  counts: dict[str, int] = {}
  for word in words:
    counts[word] = counts.get(word, 0) + 1
  return [word for word, _ in sorted(counts.items(), key=lambda item: item[1], reverse=True)[:3]]


def anonymize_text(text: str) -> str:
  anonymized = str(text or "").strip()

  for pattern, replacement in ANONYMIZE_PATTERNS:
    anonymized = pattern.sub(replacement, anonymized)

  anonymized = re.sub(r"(\[USN\]\s*){2,}", "[USN] ", anonymized)
  anonymized = re.sub(r"(\[Email\]\s*){2,}", "[Email] ", anonymized)
  anonymized = re.sub(r"(\[Phone\]\s*){2,}", "[Phone] ", anonymized)
  anonymized = re.sub(r"\s+", " ", anonymized).strip()
  return anonymized


def _first_existing_path(candidates: list[str]) -> str | None:
  for candidate in candidates:
    if candidate and os.path.exists(candidate):
      return candidate
  return None


def _load_pickle(path: str) -> Any:
  try:
    with open(path, "rb") as file:
      return pickle.load(file)
  except Exception:
    try:
      import joblib

      return joblib.load(path)
    except Exception:
      raise


def _to_serializable_float(value: Any) -> float | None:
  if value is None:
    return None

  try:
    return round(float(value), 4)
  except Exception:
    return None


class SentimentInferenceService:
  def __init__(self, model_dir: str):
    self.model_dir = model_dir
    self.provider = "groq"
    self.model_ready = False
    self.groq_enabled = bool(os.environ.get("GROQ_API_KEY"))
    self.model = None
    self.vectorizer = None
    self.label_encoder = None
    self.metrics = {
      "accuracy": None,
      "precision": None,
      "recall": None,
      "f1_score": None,
      "confusion_matrix": None,
    }
    self.mode = "tensorflow+groq"
    self.notes: list[str] = []
    self._initialize()

  def _initialize(self) -> None:
    self._load_metrics()
    self._load_tensorflow_bundle()
    self._load_mode()

  def _load_mode(self) -> None:
    if not os.path.exists(MODEL_MODE_FILE):
      self.mode = "tensorflow+groq" if self.groq_enabled else "tensorflow"
      return

    try:
      with open(MODEL_MODE_FILE, "r", encoding="utf-8") as file:
        payload = json.load(file)
      requested = payload.get("mode")
      self.mode = requested if requested in {"tensorflow", "tensorflow+groq"} else ("tensorflow+groq" if self.groq_enabled else "tensorflow")
    except Exception:
      self.mode = "tensorflow+groq" if self.groq_enabled else "tensorflow"

  def _save_mode(self) -> None:
    with open(MODEL_MODE_FILE, "w", encoding="utf-8") as file:
      json.dump({"mode": self.mode}, file, indent=2)

  def _load_metrics(self) -> None:
    metrics_path = os.path.join(self.model_dir, "metrics.json")

    if not os.path.exists(metrics_path):
      return

    try:
      with open(metrics_path, "r", encoding="utf-8") as file:
        payload = json.load(file)
      self.metrics.update(payload)
    except Exception as error:
      self.notes.append(f"Could not load metrics.json: {error}")

  def _load_tensorflow_bundle(self) -> None:
    try:
      import tensorflow as tf
      from tensorflow import keras

      config_path = _first_existing_path(
        [
          os.path.join(DOWNLOADS_DIR, "best_model (1).keras", "config.json"),
          os.path.join(self.model_dir, "config.json"),
        ]
      )
      weights_path = _first_existing_path(
        [
          os.path.join(DOWNLOADS_DIR, "best_model (1).keras", "model.weights.h5"),
          os.path.join(self.model_dir, "model.weights.h5"),
        ]
      )
      tokenizer_config_path = _first_existing_path(
        [
          os.path.join(DOWNLOADS_DIR, "tokenizer_config (2).json"),
          *glob.glob(os.path.join(self.model_dir, "*tokenizer_config*.json")),
        ]
      )
      tokenizer_vocab_path = _first_existing_path(
        [
          os.path.join(DOWNLOADS_DIR, "tokenizer_vocab.json"),
          os.path.join(self.model_dir, "tokenizer_vocab.json"),
        ]
      )
      tokenizer_weights_path = _first_existing_path(
        [
          os.path.join(DOWNLOADS_DIR, "tokenizer_weights (2).pkl"),
          os.path.join(DOWNLOADS_DIR, "tokenizer_weights.pkl"),
          *glob.glob(os.path.join(self.model_dir, "*tokenizer_weights*.pkl")),
        ]
      )
      label_encoder_path = _first_existing_path(
        [
          os.path.join(DOWNLOADS_DIR, "label_encoder (2).pkl"),
          *glob.glob(os.path.join(self.model_dir, "*label_encoder*.pkl")),
        ]
      )

      if not config_path or not weights_path:
        self.notes.append("TensorFlow model config.json or model.weights.h5 is missing.")
        return

      if not tokenizer_config_path:
        self.notes.append("Tokenizer config file is missing.")
        return

      with open(config_path, "r", encoding="utf-8") as file:
        model_config = file.read()
      with open(tokenizer_config_path, "r", encoding="utf-8") as file:
        tokenizer_config = json.load(file)

      self.model = keras.models.model_from_json(model_config)
      self.model.load_weights(weights_path)

      if tokenizer_vocab_path:
        with open(tokenizer_vocab_path, "r", encoding="utf-8") as file:
          tokenizer_vocabulary = json.load(file)

        vectorizer = tf.keras.layers.TextVectorization.from_config(tokenizer_config)
        vectorizer.set_vocabulary(tokenizer_vocabulary)
        self.vectorizer = {
          "kind": "text_vectorization",
          "vectorizer": vectorizer,
        }
      else:
        from tensorflow.keras.preprocessing.sequence import pad_sequences
        from tensorflow.keras.preprocessing.text import tokenizer_from_json

        if not tokenizer_weights_path:
          self.notes.append("Tokenizer vocabulary and tokenizer weights file are both missing.")
          return

        tokenizer_weights = _load_pickle(tokenizer_weights_path)

        if isinstance(tokenizer_weights, dict):
          word_index = tokenizer_weights
        elif isinstance(tokenizer_weights, list):
          word_index = {
            str(token): index
            for index, token in enumerate(tokenizer_weights)
            if isinstance(token, str) and token
          }
        else:
          try:
            word_index = {
              str(token): index
              for index, token in enumerate(list(tokenizer_weights))
              if isinstance(token, str) and token
            }
          except Exception:
            word_index = {}

        if not word_index:
          self.notes.append("Tokenizer weights do not contain a usable vocabulary.")
          return

        tokenizer_json = json.dumps(
          {
            "class_name": "Tokenizer",
            "config": {
              "num_words": tokenizer_config.get("max_tokens", tokenizer_config.get("num_words", 20000)),
              "filters": tokenizer_config.get("filters", "!\"#$%&()*+,-./:;<=>?@[\\]^_`{|}~\t\n"),
              "lower": bool(tokenizer_config.get("lowercase", tokenizer_config.get("lower", True))),
              "split": tokenizer_config.get("split", " "),
              "char_level": False,
              "oov_token": tokenizer_config.get("oov_token", "[OOV]"),
              "document_count": 0,
              "word_counts": {},
              "word_docs": {},
              "index_docs": {},
              "index_word": {},
              "word_index": {},
            },
          }
        )

        tokenizer = tokenizer_from_json(tokenizer_json)
        tokenizer.word_index = word_index
        tokenizer.index_word = {index: word for word, index in word_index.items()}
        self.vectorizer = {
          "kind": "tokenizer",
          "tokenizer": tokenizer,
          "pad_sequences": pad_sequences,
          "max_length": int(tokenizer_config.get("output_sequence_length", tokenizer_config.get("max_length", 100))),
        }

      if label_encoder_path:
        try:
          self.label_encoder = _load_pickle(label_encoder_path)
        except Exception as error:
          self.notes.append(f"Label encoder could not be loaded, using fixed label order: {error}")
          self.label_encoder = None

      self.model_ready = True
      self.provider = "tensorflow+groq" if self.groq_enabled else "tensorflow"
    except Exception as error:
      self.notes.append(f"TensorFlow bundle could not be loaded: {error}")
      self.model_ready = False
      self.provider = "groq" if self.groq_enabled else "unavailable"

  def _predict_with_tensorflow(self, text: str) -> dict[str, float]:
    if self.vectorizer["kind"] == "text_vectorization":
      tensor = self.vectorizer["vectorizer"]([text])
      probabilities = self.model.predict(tensor, verbose=0)[0].tolist()
    else:
      tokenizer = self.vectorizer["tokenizer"]
      pad_sequences = self.vectorizer["pad_sequences"]
      max_length = self.vectorizer["max_length"]
      sequence = tokenizer.texts_to_sequences([text.lower()])
      padded = pad_sequences(sequence, maxlen=max_length, padding="post", truncating="post")
      probabilities = self.model.predict(padded, verbose=0)[0].tolist()

    if self.label_encoder is not None and hasattr(self.label_encoder, "classes_"):
      raw_labels = [str(label).capitalize() for label in self.label_encoder.classes_]
    else:
      raw_labels = ["Negative", "Neutral", "Positive"]

    scores = {label: round(float(probability), 4) for label, probability in zip(raw_labels, probabilities)}
    return {label: round(float(scores.get(label, 0.0)), 4) for label in LABEL_ORDER}

  def set_mode(self, mode: str) -> dict[str, Any]:
    if mode not in {"tensorflow", "tensorflow+groq"}:
      raise ValueError("Mode must be 'tensorflow' or 'tensorflow+groq'.")

    if mode == "tensorflow" and not self.model_ready:
      raise ValueError("TensorFlow mode is unavailable because the TensorFlow model is not ready.")

    if mode == "tensorflow+groq" and not self.groq_enabled:
      raise ValueError("TensorFlow+Groq mode is unavailable because GROQ_API_KEY is not configured.")

    self.mode = mode
    self._save_mode()
    return self.get_status()

  def _groq_classify(self, text: str) -> str | None:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
      return None

    payload = {
      "model": os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant"),
      "temperature": 0,
      "max_tokens": 5,
      "messages": [
        {
          "role": "system",
          "content": "Classify the sentiment of the educational feedback comment. Reply using exactly one word: Positive, Negative, or Neutral.",
        },
        {
          "role": "user",
          "content": text,
        },
      ],
    }
    request = urllib.request.Request(
      "https://api.groq.com/openai/v1/chat/completions",
      data=json.dumps(payload).encode("utf-8"),
      headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
      },
      method="POST",
    )

    try:
      with urllib.request.urlopen(request, timeout=20) as response:
        body = json.loads(response.read().decode("utf-8"))
      content = body.get("choices", [{}])[0].get("message", {}).get("content", "").strip().lower()

      for label in LABEL_ORDER:
        if label.lower() in content:
          return label
      return None
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
      note = f"Groq classification failed: {error}"
      if note not in self.notes:
        self.notes.append(note)
      return None

  def _align_scores_to_label(self, scores: dict[str, float], label: str) -> dict[str, float]:
    adjusted = {name: round(float(scores.get(name, 0.0)), 4) for name in LABEL_ORDER}
    current_top = max(adjusted, key=adjusted.get)

    if current_top == label:
      return adjusted

    boost = max(0.62, adjusted.get(current_top, 0.0))
    remaining = round((1 - boost) / 2, 4)
    adjusted[label] = round(boost, 4)

    others = [name for name in LABEL_ORDER if name != label]
    adjusted[others[0]] = remaining
    adjusted[others[1]] = round(1 - adjusted[label] - adjusted[others[0]], 4)
    return adjusted

  def predict_sentiment(self, text: str) -> dict[str, Any]:
    if not text or not str(text).strip():
      raise ValueError("Comment text cannot be empty.")

    cleaned_text = str(text).strip()
    anonymized_comment = anonymize_text(cleaned_text)

    if not self.model_ready and not self.groq_enabled:
      raise RuntimeError("Neither the TensorFlow model nor Groq inference is available.")

    scores = self._predict_with_tensorflow(anonymized_comment) if self.model_ready else {
      "Positive": 0.0,
      "Negative": 0.0,
      "Neutral": 0.0,
    }
    model_label = max(scores, key=scores.get) if any(scores.values()) else None
    groq_label = self._groq_classify(anonymized_comment) if self.mode == "tensorflow+groq" else None

    if groq_label:
      final_label = groq_label
      scores = self._align_scores_to_label(
        scores if any(scores.values()) else {"Positive": 0.19, "Negative": 0.19, "Neutral": 0.62},
        groq_label,
      )
    elif model_label:
      final_label = model_label
    else:
      final_label = "Neutral"
      scores = {"Positive": 0.2, "Negative": 0.2, "Neutral": 0.6}

    ordered_scores = {label: round(float(scores.get(label, 0.0)), 4) for label in LABEL_ORDER}
    response_provider = "tensorflow+groq" if groq_label else ("tensorflow" if self.model_ready else "groq")

    return {
      "label": final_label,
      "scores": ordered_scores,
      "sentiment_label": final_label,
      "confidence_score": ordered_scores,
      "anonymized_comment": anonymized_comment,
      "accuracy": _to_serializable_float(self.metrics.get("accuracy")),
      "precision": _to_serializable_float(self.metrics.get("precision")),
      "recall": _to_serializable_float(self.metrics.get("recall")),
      "f1_score": _to_serializable_float(self.metrics.get("f1_score")),
      "confusion_matrix": self.metrics.get("confusion_matrix"),
      "keywords": extract_keywords(cleaned_text),
      "provider": response_provider,
      "mode": self.mode,
      "model_ready": self.model_ready,
      "groq_used": bool(groq_label),
      "notes": self.notes,
    }

  def get_status(self) -> dict[str, Any]:
    return {
      "provider": self.provider,
      "mode": self.mode,
      "available_modes": [
        mode
        for mode in ["tensorflow", "tensorflow+groq"]
        if (mode == "tensorflow" and self.model_ready) or (mode == "tensorflow+groq" and self.groq_enabled)
      ],
      "model_ready": self.model_ready,
      "groq_enabled": self.groq_enabled,
      "accuracy": _to_serializable_float(self.metrics.get("accuracy")),
      "precision": _to_serializable_float(self.metrics.get("precision")),
      "recall": _to_serializable_float(self.metrics.get("recall")),
      "f1_score": _to_serializable_float(self.metrics.get("f1_score")),
      "confusion_matrix": self.metrics.get("confusion_matrix"),
      "notes": self.notes,
    }


service = SentimentInferenceService(MODEL_DIR)


def predict_sentiment(text: str) -> dict[str, Any]:
  return service.predict_sentiment(text)


def get_model_status() -> dict[str, Any]:
  return service.get_status()


def set_model_mode(mode: str) -> dict[str, Any]:
  return service.set_mode(mode)
