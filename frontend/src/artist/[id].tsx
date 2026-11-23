import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

type SimilarArtist = {
  mbid: string
  artist: string | null
  country: string | null
  similarity_score: number
}

type Artist = Omit<SimilarArtist, 'similarity_score'>

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const ARTIST_METADATA_API_URL = import.meta.env.VITE_ARTIST_METADATA_API_URL ?? 'http://localhost:3000'

function ArtistPage() {
  const { id: artistId } = useParams()
  const navigate = useNavigate()
  const [artist, setArtist] = useState<Artist | null>(null)
  const [similarArtists, setSimilarArtists] = useState<SimilarArtist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null)
  const [artistImageUrl, setArtistImageUrl] = useState<string | null>(null)
  const [isLoadingArtistMetadata, setIsLoadingArtistMetadata] = useState(false)

  useEffect(() => {
    if (!artistId) {
      setErrorMessage('Artist ID is missing.')
      setIsLoading(false)
      return
    }

    const loadSimilarArtists = async () => {
      try {
        const [artistResponse, similarResponse] = await Promise.all([
          fetch(`${API_URL}/artists/${encodeURIComponent(artistId)}`),
          fetch(`${API_URL}/similar/${encodeURIComponent(artistId)}?limit=20`),
        ])
        if (!artistResponse.ok || !similarResponse.ok) {
          throw new Error('Artist data could not be loaded.')
        }
        setArtist(await artistResponse.json() as Artist)
        setSimilarArtists(await similarResponse.json() as SimilarArtist[])
      } catch {
        setErrorMessage('Similar artists could not be loaded.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadSimilarArtists()
  }, [artistId])

  const selectArtist = async (similarArtist: SimilarArtist) => {
    const isSelected = selectedArtistId === similarArtist.mbid
    setSelectedArtistId(isSelected ? null : similarArtist.mbid)
    if (isSelected) return

    setArtistImageUrl(null)
    setIsLoadingArtistMetadata(true)
    try {
      const response = await fetch(
        `${ARTIST_METADATA_API_URL}/artists/${encodeURIComponent(similarArtist.artist ?? '')}/lastfm`,
      )
      if (!response.ok) throw new Error('Artist image could not be loaded.')
      const lastFmArtist = await response.json() as {
        artist?: {
          image?: Array<{ '#text'?: string; size?: string }>
        }
      }
      const mediumImage = lastFmArtist.artist?.image?.find((image) => image.size === 'medium')
      setArtistImageUrl(mediumImage?.['#text'] ?? null)
    } catch {
      setArtistImageUrl(null)
    } finally {
      setIsLoadingArtistMetadata(false)
    }
  }

  const renderArtistCard = (similarArtist: SimilarArtist) => (
    <div
      className="relative w-56 rounded-box bg-base-100 p-3 text-left text-xs shadow-lg"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-3">
        {artistImageUrl ? (
          <img src={artistImageUrl} alt="" className="size-12 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-content">
            {isLoadingArtistMetadata ? '...' : similarArtist.artist?.charAt(0) ?? '?'}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold">{similarArtist.artist}</p>
          <p className="opacity-70">
            {(similarArtist.similarity_score * 100).toFixed(1)}% similar
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="btn btn-primary btn-xs flex-1"
          onClick={() => navigate(`/artist/${encodeURIComponent(similarArtist.mbid)}`)}
        >
          Continue
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-xs flex-1"
          onClick={() => navigate(`/profile/${encodeURIComponent(similarArtist.mbid)}`)}
        >
          Profile
        </button>
      </div>
    </div>
  )

  return (
    <div className="mx-auto w-full max-w-[96rem]">
      {isLoading && <p className="mt-4">Finding similar artists...</p>}
      {errorMessage && <p className="mt-4 text-error">{errorMessage}</p>}
      {!isLoading && !errorMessage && (
        <div className="relative mt-2 min-h-[min(75vh,48rem)] w-full overflow-visible rounded-box bg-base-200/40">
          <div
            className={`absolute left-1/2 top-1/2 z-10 flex min-h-12 max-w-64 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm bg-primary px-3 text-center font-bold text-primary-content shadow-lg ${
              selectedArtistId === artistId ? 'z-30' : ''
            }`}
            onClick={() => artist && void selectArtist({ ...artist, similarity_score: 1 })}
          >
            {artist?.artist ?? 'Selected artist'}
            {selectedArtistId === artistId && artist && (
              <div className="absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2">
                {renderArtistCard({ ...artist, similarity_score: 1 })}
              </div>
            )}
          </div>
          {similarArtists.map((artist, index) => {
            const ring = index % 3
            const artistsInRing = Math.ceil(similarArtists.length / 3)
            const angle = (index % artistsInRing) * (360 / artistsInRing) + ring * 18
            const distance = 22 + ring * 14 + (1 - artist.similarity_score) * 5
            const angleInRadians = (angle * Math.PI) / 180
            const x = Math.min(86, Math.max(14, 50 + Math.cos(angleInRadians) * distance))
            const y = Math.min(86, Math.max(14, 50 + Math.sin(angleInRadians) * distance))
            const cardVerticalPosition = y > 62 ? 'bottom-full mb-2' : 'top-full mt-2'
            const cardHorizontalPosition =
              x < 28 ? 'left-0' : x > 72 ? 'right-0' : 'left-1/2 -translate-x-1/2'

            return (
              <div
                key={artist.mbid}
                className={`absolute max-w-32 cursor-pointer break-words -translate-x-1/2 -translate-y-1/2 px-1 text-center text-sm hover:bg-neutral ${
                  selectedArtistId === artist.mbid ? 'z-30' : ''
                }`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                }}
                onClick={() => void selectArtist(artist)}
              >
                {artist.artist}
                {selectedArtistId === artist.mbid && (
                  <div className={`absolute z-20 ${cardVerticalPosition} ${cardHorizontalPosition}`}>
                    {renderArtistCard(artist)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ArtistPage
