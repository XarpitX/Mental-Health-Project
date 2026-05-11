"""
Read JSON from stdin: {"text": "..."}
Print JSON to stdout with prediction (one-shot for Node subprocess).

Requires mental_health_model.pkl in the same directory (run train.py first).
"""

import json
import sys
from pathlib import Path

import joblib

from text_utils import preprocess

ML_DIR = Path(__file__).resolve().parent
MODEL_PATH = ML_DIR / "mental_health_model.pkl"


def main() -> None:
    raw = sys.stdin.read()
    try:
        data = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        print(json.dumps({"ok": False, "error": "invalid_json"}))
        return

    text = (data.get("text") or "").strip()
    if not text:
        print(json.dumps({"ok": False, "error": "empty_text"}))
        return

    if not MODEL_PATH.is_file():
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": "model_missing",
                    "hint": "Run: python backend/ml/train.py",
                }
            )
        )
        return

    model = joblib.load(MODEL_PATH)
    clean = preprocess(text)
    prediction = model.predict([clean])[0]
    probabilities = model.predict_proba([clean])[0]
    classes = list(model.classes_)
    prob_dict = {str(cls): round(float(prob), 4) for cls, prob in zip(classes, probabilities)}
    sorted_probs = dict(sorted(prob_dict.items(), key=lambda x: x[1], reverse=True))
    conf = round(float(max(probabilities)) * 100, 2)

    out = {
        "ok": True,
        "predicted_status": str(prediction),
        "confidence": conf,
        "all_probabilities": sorted_probs,
    }
    print(json.dumps(out))


if __name__ == "__main__":
    main()
