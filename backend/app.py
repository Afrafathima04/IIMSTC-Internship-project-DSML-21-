import json
import os
from typing import Any

from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd

from data_service import get_dataset_status, load_dataset_frame, reset_dataset, save_uploaded_dataset
from model import get_model_status, predict_sentiment, set_model_mode

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(ROOT_DIR, "feedback_store.json")

app = Flask(__name__)
CORS(app)


def _json_default(value: Any):
  if value is None:
    return None
  if hasattr(value, "item"):
    try:
      value = value.item()
    except Exception:
      pass
  if isinstance(value, pd.Timestamp):
    if pd.isna(value):
      return None
    return value.isoformat()
  if isinstance(value, pd.Timedelta):
    return str(value)
  try:
    if pd.isna(value):
      return None
  except Exception:
    pass
  if hasattr(value, "isoformat"):
    try:
      return value.isoformat()
    except Exception:
      pass
  raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def load_store() -> list[dict[str, Any]]:
  if os.path.exists(DATA_FILE):
    with open(DATA_FILE, "r", encoding="utf-8") as file:
      return json.load(file)
  return []


def save_store(store: list[dict[str, Any]]) -> None:
  with open(DATA_FILE, "w", encoding="utf-8") as file:
    json.dump(store, file, indent=2)


feedback_store = load_store()


@app.route("/api/data", methods=["GET"])
def get_data():
  dataset_frame = load_dataset_frame()
  combined = dataset_frame.to_dict(orient="records") + feedback_store
  return app.response_class(
    json.dumps(combined, default=_json_default, allow_nan=False),
    mimetype="application/json",
  )


@app.route("/api/dataset-status", methods=["GET"])
def dataset_status():
  return jsonify(get_dataset_status())


@app.route("/api/faculty-directory", methods=["GET"])
def faculty_directory():
  dataset_frame = load_dataset_frame()
  preferred_columns = [
    column
    for column in ["professor_name", "department_name", "course_name", "course", "subject", "name_not_onlines"]
    if column in dataset_frame.columns
  ]

  if not preferred_columns or "professor_name" not in preferred_columns:
    return jsonify([])

  directory_frame = dataset_frame[preferred_columns].copy()
  directory_frame = directory_frame[directory_frame["professor_name"].notna()]
  directory_frame = directory_frame.drop_duplicates()
  directory_frame = directory_frame.where(directory_frame.notna(), None)
  records = directory_frame.to_dict(orient="records")

  return app.response_class(
    json.dumps(records, default=_json_default, allow_nan=False),
    mimetype="application/json",
  )


@app.route("/api/upload-dataset", methods=["POST"])
def upload_dataset():
  if "file" not in request.files:
    return jsonify({"error": "Dataset file is required."}), 400

  uploaded_file = request.files["file"]

  if not uploaded_file.filename:
    return jsonify({"error": "Dataset file name is missing."}), 400

  try:
    status = save_uploaded_dataset(uploaded_file)
    return jsonify(status)
  except ValueError as error:
    return jsonify({"error": str(error)}), 400
  except Exception as error:
    return jsonify({"error": f"Failed to upload dataset: {error}"}), 500


@app.route("/api/reset-dataset", methods=["POST"])
def reset_dataset_route():
  try:
    status = reset_dataset()
    return jsonify(status)
  except Exception as error:
    return jsonify({"error": f"Failed to reset dataset: {error}"}), 500


@app.route("/api/model-status", methods=["GET"])
def model_status():
  return jsonify(get_model_status())


@app.route("/api/model-mode", methods=["POST"])
def model_mode():
  payload = request.json or {}
  mode = payload.get("mode") or ""

  try:
    status = set_model_mode(mode)
    return jsonify(status)
  except ValueError as error:
    return jsonify({"error": str(error)}), 400
  except Exception as error:
    return jsonify({"error": f"Failed to change model mode: {error}"}), 500


@app.route("/api/predict", methods=["POST"])
def predict():
  payload = request.json or {}
  text = payload.get("comment") or payload.get("text") or ""

  try:
    prediction = predict_sentiment(text)
    return jsonify(prediction)
  except ValueError as error:
    return jsonify({"error": str(error)}), 400
  except Exception as error:
    return jsonify({"error": f"Prediction failed: {error}"}), 500


@app.route("/api/add-feedback", methods=["POST"])
def add_feedback():
  payload = request.json or {}

  feedback_store.append(
    {
      "comments": payload.get("comments") or payload.get("anonymized_comment"),
      "sentiment_label": payload.get("sentiment") or payload.get("sentiment_label") or payload.get("label"),
      "department_name": payload.get("department_name"),
      "professor_name": payload.get("professor_name"),
      "star_rating": payload.get("star_rating"),
      "student_name": payload.get("name"),
      "usn": payload.get("usn"),
      "email": payload.get("email"),
    }
  )

  save_store(feedback_store)
  return jsonify({"status": "saved"})


if __name__ == "__main__":
  app.run(debug=True)
