"""
Train TF-IDF + Logistic Regression on mental_health_dataset.csv (repo root).
Writes mental_health_model.pkl next to this script.

Usage (from repo root, with venv activated):
  pip install -r backend/ml/requirements.txt
  python backend/ml/train.py
"""

from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from text_utils import preprocess

ML_DIR = Path(__file__).resolve().parent
REPO_ROOT = ML_DIR.parent.parent
CSV_PATH = REPO_ROOT / "mental_health_dataset.csv"
MODEL_PATH = ML_DIR / "mental_health_model.pkl"


def main() -> None:
    if not CSV_PATH.is_file():
        raise SystemExit(f"Dataset not found: {CSV_PATH}")

    print("Loading dataset...")
    df = pd.read_csv(CSV_PATH)
    df.dropna(inplace=True)
    print(f"Dataset shape: {df.shape}")
    print(df["status"].value_counts())

    print("\nPreprocessing text...")
    df["clean_statement"] = df["statement"].apply(preprocess)

    X = df["clean_statement"]
    y = df["status"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\nTrain: {len(X_train)}  |  Test: {len(X_test)}")

    tfidf_params = dict(
        max_features=10000,
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=2,
    )

    lr_pipeline = Pipeline(
        [
            ("tfidf", TfidfVectorizer(**tfidf_params)),
            ("clf", LogisticRegression(max_iter=1000, random_state=42, C=5.0)),
        ]
    )

    print("\n--- Training Logistic Regression ---")
    lr_pipeline.fit(X_train, y_train)
    lr_preds = lr_pipeline.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, lr_preds):.4f}")
    print(classification_report(y_test, lr_preds))

    joblib.dump(lr_pipeline, MODEL_PATH)
    print(f"\nModel saved: {MODEL_PATH}")


if __name__ == "__main__":
    main()
