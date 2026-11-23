from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

app = FastAPI(title="Matrix Similarity Engine")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATASET_PATH = Path(__file__).resolve().parents[2] / "datasets" / "cleaned_artists.csv"

print(f"Loading artist metadata and tags from {DATASET_PATH}...")
df = pd.read_csv(DATASET_PATH, usecols=["mbid", "artist_mb", "country", "tag"])

vectorizer = TfidfVectorizer(dtype=np.float32)
tag_matrix = vectorizer.fit_transform(df["tag"].fillna("").astype(str))

# Create a lookup dictionary (maps an artist's MBID to their matrix row index).
mbid_to_idx = {mbid: idx for idx, mbid in enumerate(df['mbid'])}
print("Engine ready!")

@app.get("/artists/search")
def search_artists(
    q: str = Query(min_length=2, max_length=100),
    limit: int = Query(default=8, ge=1, le=20),
):
    normalized_query = q.strip().casefold()
    if not normalized_query:
        return []

    artist_names = df["artist_mb"].fillna("").astype(str)
    matches = artist_names.str.casefold().str.contains(normalized_query, regex=False)
    matching_indices = df.index[matches][:limit]

    return [
        {
            "mbid": df.loc[idx, "mbid"],
            "artist": df.loc[idx, "artist_mb"],
            "country": None if pd.isna(df.loc[idx, "country"]) else df.loc[idx, "country"],
        }
        for idx in matching_indices
    ]


@app.get("/artists/{mbid}")
def get_artist(mbid: str):
    if mbid not in mbid_to_idx:
        raise HTTPException(status_code=404, detail="Artist not found")

    artist = df.iloc[mbid_to_idx[mbid]]
    return {
        "mbid": artist["mbid"],
        "artist": None if pd.isna(artist["artist_mb"]) else artist["artist_mb"],
        "country": None if pd.isna(artist["country"]) else artist["country"],
    }


@app.get("/similar/{mbid}")
def get_similar_artists(mbid: str, limit: int = Query(default=10, ge=1, le=100)):
    if mbid not in mbid_to_idx:
        raise HTTPException(status_code=404, detail="Artist not found")

    idx = mbid_to_idx[mbid]
    artist_vector = tag_matrix[idx]

    scores = cosine_similarity(artist_vector, tag_matrix).flatten()

    ranked_indices = scores.argsort()[::-1]
    top_indices = ranked_indices[ranked_indices != idx][:limit]

    results = []
    for res_idx in top_indices:
        results.append({
            "mbid": df.iloc[res_idx]['mbid'],
            "artist": None if pd.isna(df.iloc[res_idx]['artist_mb']) else df.iloc[res_idx]['artist_mb'],
            "country": None if pd.isna(df.iloc[res_idx]['country']) else df.iloc[res_idx]['country'],
            "similarity_score": round(float(scores[res_idx]), 4)
        })
        
    return results