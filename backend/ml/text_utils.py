"""Shared text preprocessing for mental health NLP (train + predict)."""

import re

import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

nltk.download("stopwords", quiet=True)
nltk.download("wordnet", quiet=True)
nltk.download("omw-1.4", quiet=True)

_lemmatizer = WordNetLemmatizer()
_stop_words = set(stopwords.words("english"))


def preprocess(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z\s]", "", text)
    tokens = text.split()
    tokens = [t for t in tokens if t not in _stop_words]
    tokens = [_lemmatizer.lemmatize(t) for t in tokens]
    return " ".join(tokens)
