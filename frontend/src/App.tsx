import { useEffect, useState } from 'react'
import { MdSearch } from 'react-icons/md'
import { useNavigate } from 'react-router'

type Artist = {
  mbid: string
  artist: string | null
  country: string | null
}

const API_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

function App() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Artist[]>([])
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (query.trim().length < 2 || selectedArtist?.artist === query) {
      setSuggestions([])
      return
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `${API_URL}/artists/search?q=${encodeURIComponent(query.trim())}`,
        )
        if (!response.ok) throw new Error('Artist suggestions could not be loaded.')
        setSuggestions(await response.json() as Artist[])
      } catch {
        setErrorMessage('Artist suggestions could not be loaded.')
      }
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [query, selectedArtist])

  const searchSimilarArtists = async (artist: Artist) => {
    setQuery(artist.artist ?? '')
    setSelectedArtist(artist)
    setSuggestions([])
    navigate(`/artist/${encodeURIComponent(artist.mbid)}`)
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-bold text-primary">Find your artist twin</h1>
      <form
        className="relative mt-4 w-full max-w-md"
        onSubmit={(event) => {
          event.preventDefault()
          if (suggestions[0]) void searchSimilarArtists(suggestions[0])
        }}
      >
        <div className="aura text-primary w-full rounded-full">

        <input
          type="text"
          placeholder="Type your artist..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setSelectedArtist(null)
          }}
          className="input input-bordered w-full rounded-full px-6 pr-14 text-left focus:border-primary focus:outline-2 focus:outline-primary"
        />
        <button
          type="submit"
          aria-label="Search for artist"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl text-primary"
        >
          <MdSearch />
        </button>
          </div>
        {suggestions.length > 0 && (
          <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-box bg-base-200 text-left shadow-lg">
            {suggestions.map((artist) => (
              <li key={artist.mbid}>
                <button
                  type="button"
                  className="w-full px-6 py-3 text-left hover:bg-base-300"
                  onClick={() => void searchSimilarArtists(artist)}
                >
                  {artist.artist}
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>
      {errorMessage && <p className="mt-4 text-error">{errorMessage}</p>}
    </div>
  )
}

export default App
