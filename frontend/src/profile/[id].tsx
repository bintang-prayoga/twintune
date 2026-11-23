import { useEffect, useState } from 'react'
import { useParams } from 'react-router'

type LastFmImage = {
  '#text': string
  size: string
}

type LastFmArtist = {
  name: string
  url: string
  image: LastFmImage[]
  stats?: {
    listeners: string
    playcount: string
  }
  bio?: {
    summary: string
    content: string
  }
  tags?: {
    tag: Array<{ name: string; url: string }>
  }
}

const ARTIST_METADATA_API_URL = import.meta.env.VITE_ARTIST_METADATA_API_URL ?? 'http://localhost:3000'
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function ProfilePage() {
  const { id: artistId } = useParams()
  const [artist, setArtist] = useState<LastFmArtist | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!artistId) {
      setErrorMessage('Artist ID is missing.')
      setIsLoading(false)
      return
    }

    const loadArtistProfile = async () => {
      try {
        const sourceResponse = await fetch(`${API_URL}/artists/${encodeURIComponent(artistId)}`)
        if (!sourceResponse.ok) throw new Error('Artist could not be loaded.')
        const sourceArtist = await sourceResponse.json() as { artist: string | null }
        if (!sourceArtist.artist) throw new Error('Artist name is unavailable.')

        const response = await fetch(
          `${ARTIST_METADATA_API_URL}/artists/${encodeURIComponent(sourceArtist.artist)}/lastfm`,
        )
        if (!response.ok) throw new Error('Artist profile could not be loaded.')

        const data = await response.json() as { artist?: LastFmArtist; error?: number }
        if (!data.artist) throw new Error('Artist profile was not found.')
        setArtist(data.artist)
        const mediumImage = data.artist.image?.find(
          (image) => image.size === 'medium' && image['#text'].trim(),
        )
        setImageUrl(mediumImage?.['#text'] ?? null)
      } catch {
        setErrorMessage('Artist profile could not be loaded.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadArtistProfile()
  }, [artistId])

  return (
    <article className="mx-auto w-full max-w-4xl">
      {isLoading && <p>Loading artist profile...</p>}
      {errorMessage && <p className="text-error">{errorMessage}</p>}
      {!isLoading && !errorMessage && artist && (
        <>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${artist.name} profile`}
                className="size-32 rounded-full object-cover"
                onError={() => setImageUrl(null)}
              />
            ) : (
              <div className="flex size-32 items-center justify-center rounded-full bg-primary text-5xl font-bold text-primary-content">
                {artist.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold text-primary">{artist.name}</h1>
              {artist.stats && (
                <p className="mt-2 text-sm opacity-70">
                  {Number(artist.stats.listeners).toLocaleString()} listeners ·{' '}
                  {Number(artist.stats.playcount).toLocaleString()} plays
                </p>
              )}
              <a
                href={artist.url}
                target="_blank"
                rel="noreferrer"
                className="link link-primary mt-3 inline-block"
              >
                View on Last.fm
              </a>
            </div>
          </div>

          {artist.bio?.summary && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold">About</h2>
              <p className="mt-2 leading-7 opacity-80">
                {artist.bio.summary.replace(/ <a href="[^"]+">Read more on Last.fm<\/a>\.?$/, '')}
              </p>
            </section>
          )}

          {artist.tags?.tag.length ? (
            <section className="mt-8">
              <h2 className="text-xl font-semibold">Tags</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {artist.tags.tag.map((tag) => (
                  <a key={tag.url} href={tag.url} target="_blank" rel="noreferrer" className="badge badge-outline">
                    {tag.name}
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </article>
  )
}

export default ProfilePage
