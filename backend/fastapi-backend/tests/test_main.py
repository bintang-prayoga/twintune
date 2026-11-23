from fastapi.testclient import TestClient

from main import app, df, mbid_to_idx


client = TestClient(app)
KNOWN_MBID = next(iter(mbid_to_idx))


def test_returns_similar_artists():
    response = client.get(f"/similar/{KNOWN_MBID}?limit=3")

    assert response.status_code == 200
    results = response.json()

    assert len(results) == 3
    assert all(result["mbid"] != KNOWN_MBID for result in results)
    assert all(
        set(result) == {"mbid", "artist", "country", "similarity_score"}
        for result in results
    )
    assert all(0 <= result["similarity_score"] <= 1 for result in results)


def test_search_returns_matching_artists():
    known_artist = str(df["artist_mb"].dropna().iloc[0])

    response = client.get(
        "/artists/search",
        params={"q": known_artist[:3], "limit": 1},
    )

    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert set(results[0]) == {"mbid", "artist", "country"}


def test_returns_not_found_for_unknown_artist():
    response = client.get("/similar/unknown-mbid")

    assert response.status_code == 404
    assert response.json() == {"detail": "Artist not found"}


def test_rejects_invalid_limit():
    response = client.get(f"/similar/{KNOWN_MBID}?limit=101")

    assert response.status_code == 422
