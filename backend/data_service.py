import json
import os
from typing import Any

import pandas as pd

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
DATASET_STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dataset_state.json")
DOWNLOADS_DIR = os.path.join(os.path.expanduser("~"), "Downloads")
_DATASET_CACHE: dict[str, Any] = {"path": None, "mtime": None, "frame": None}

os.makedirs(UPLOAD_DIR, exist_ok=True)


def _candidate_default_paths() -> list[str]:
  return [
    os.path.join(DOWNLOADS_DIR, "feedback.csv"),
    os.path.join(ROOT_DIR, "balanced_edufeed_dataset_FINAL.csv"),
    os.path.join(ROOT_DIR, "balanced_edufeed_dataset_FINAL.xlsx"),
    os.path.join(DOWNLOADS_DIR, "balanced_edufeed_dataset_FINAL.csv"),
    os.path.join(DOWNLOADS_DIR, "balanced_edufeed_dataset_FINAL.xlsx"),
    os.path.join(DOWNLOADS_DIR, "balanced_edufeed_dataset.csv"),
    os.path.join(DOWNLOADS_DIR, "balanced_edufeed_dataset.xlsx"),
    os.path.join(ROOT_DIR, "feedback.csv"),
  ]


def _safe_read_frame(path: str) -> pd.DataFrame:
  if path.lower().endswith(".csv"):
    return pd.read_csv(path, encoding_errors="ignore", low_memory=False)
  if path.lower().endswith(".xlsx"):
    return pd.read_excel(path, engine="openpyxl")
  raise ValueError("Unsupported dataset format")


def _canonical_column_name(column: Any) -> str:
  return str(column or "").strip().lower().replace(" ", "_")


def _standardize_columns(frame: pd.DataFrame) -> pd.DataFrame:
  normalized = frame.copy()
  column_map = {_canonical_column_name(column): column for column in normalized.columns}
  rename_map: dict[Any, str] = {}

  aliases = {
    "comments": ["comments", "comment", "feedback", "review", "student_feedback"],
    "sentiment_label": ["sentiment_label", "sentiment", "label", "predicted_label"],
    "department_name": ["department_name", "department", "dept", "departmentname"],
    "professor_name": ["professor_name", "professor", "faculty", "faculty_name", "teacher_name"],
    "student_name": ["student_name", "student", "name"],
    "star_rating": ["star_rating", "rating", "stars"],
  }

  for target, candidates in aliases.items():
    for candidate in candidates:
      source = column_map.get(candidate)
      if source and source != target:
        rename_map[source] = target
        break

  if rename_map:
    normalized = normalized.rename(columns=rename_map)

  return normalized


def _normalize_frame(frame: pd.DataFrame) -> pd.DataFrame:
  normalized = _standardize_columns(frame)

  for column in normalized.columns:
    if pd.api.types.is_datetime64_any_dtype(normalized[column]):
      normalized[column] = normalized[column].apply(
        lambda value: value.isoformat() if pd.notna(value) else None
      )
    elif pd.api.types.is_object_dtype(normalized[column]):
      normalized[column] = normalized[column].apply(
        lambda value: value.isoformat() if hasattr(value, "isoformat") and pd.notna(value) else value
      )

  # Force object dtype before null replacement so numeric NaN values become real Python None,
  # which prevents invalid JSON like NaN from leaking into API responses.
  normalized = normalized.astype(object)
  normalized = normalized.where(pd.notna(normalized), None)
  return normalized


def is_valid_dataset(path: str) -> bool:
  if not path or not os.path.exists(path):
    return False

  try:
    frame = _standardize_columns(_safe_read_frame(path))
    return "comments" in frame.columns and "sentiment_label" in frame.columns
  except Exception:
    return False


def resolve_default_dataset_path() -> str:
  for candidate in _candidate_default_paths():
    if is_valid_dataset(candidate):
      return candidate

  raise FileNotFoundError("No valid default dataset found.")


def load_state() -> dict[str, Any]:
  if not os.path.exists(DATASET_STATE_FILE):
    return {}

  with open(DATASET_STATE_FILE, "r", encoding="utf-8") as file:
    return json.load(file)


def save_state(state: dict[str, Any]) -> None:
  with open(DATASET_STATE_FILE, "w", encoding="utf-8") as file:
    json.dump(state, file, indent=2)


def get_active_dataset_path() -> str:
  state = load_state()
  active_path = state.get("active_dataset_path")
  default_path = resolve_default_dataset_path()

  if active_path and os.path.normcase(active_path) == os.path.normcase(os.path.join(ROOT_DIR, "feedback.csv")):
    save_state({"active_dataset_path": default_path})
    return default_path

  if active_path and is_valid_dataset(active_path):
    return active_path

  if active_path and not is_valid_dataset(active_path):
    save_state({"active_dataset_path": default_path})

  return default_path


def load_dataset_frame(path: str | None = None) -> pd.DataFrame:
  dataset_path = path or get_active_dataset_path()
  try:
    mtime = os.path.getmtime(dataset_path)
    if (
      _DATASET_CACHE["path"] == dataset_path
      and _DATASET_CACHE["mtime"] == mtime
      and _DATASET_CACHE["frame"] is not None
    ):
      return _DATASET_CACHE["frame"].copy()

    frame = _safe_read_frame(dataset_path)
    normalized = _normalize_frame(frame)
    _DATASET_CACHE.update({"path": dataset_path, "mtime": mtime, "frame": normalized})
    return normalized.copy()
  except Exception:
    default_path = resolve_default_dataset_path()
    if dataset_path != default_path:
      save_state({"active_dataset_path": default_path})
      mtime = os.path.getmtime(default_path)
      if (
        _DATASET_CACHE["path"] == default_path
        and _DATASET_CACHE["mtime"] == mtime
        and _DATASET_CACHE["frame"] is not None
      ):
        return _DATASET_CACHE["frame"].copy()
      frame = _safe_read_frame(default_path)
      normalized = _normalize_frame(frame)
      _DATASET_CACHE.update({"path": default_path, "mtime": mtime, "frame": normalized})
      return normalized.copy()
    raise


def get_dataset_status() -> dict[str, Any]:
  active_path = get_active_dataset_path()
  default_path = resolve_default_dataset_path()
  frame = load_dataset_frame(active_path)

  return {
    "active_dataset_path": get_active_dataset_path(),
    "default_dataset_path": default_path,
    "using_uploaded_dataset": os.path.normcase(get_active_dataset_path()) != os.path.normcase(default_path),
    "row_count": int(len(frame)),
    "columns": list(frame.columns),
  }


def save_uploaded_dataset(file_storage) -> dict[str, Any]:
  filename = file_storage.filename or "uploaded_dataset.csv"
  extension = os.path.splitext(filename)[1].lower()

  if extension not in {".csv", ".xlsx"}:
    raise ValueError("Only CSV and XLSX files are supported.")

  saved_path = os.path.join(UPLOAD_DIR, f"active_dataset{extension}")
  file_storage.save(saved_path)

  try:
    frame = _standardize_columns(_safe_read_frame(saved_path))
    if "comments" not in frame.columns or "sentiment_label" not in frame.columns:
      raise ValueError("Uploaded file must contain comments and sentiment_label columns.")
  except Exception as error:
    if os.path.exists(saved_path):
      os.remove(saved_path)
    raise ValueError(f"Uploaded dataset could not be read: {error}")

  save_state({"active_dataset_path": saved_path})
  _DATASET_CACHE.update({"path": None, "mtime": None, "frame": None})
  return get_dataset_status()


def reset_dataset() -> dict[str, Any]:
  default_path = resolve_default_dataset_path()
  save_state({"active_dataset_path": default_path})
  _DATASET_CACHE.update({"path": None, "mtime": None, "frame": None})

  for filename in os.listdir(UPLOAD_DIR):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.isfile(file_path):
      os.remove(file_path)

  return get_dataset_status()
