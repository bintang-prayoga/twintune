import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type LayoutProperties = {
  children: ReactNode
}

function Layout({ children }: LayoutProperties) {
  const { pathname } = useLocation()
  const [artistName, setArtistName] = useState<string | null>(null)

  useEffect(() => {
    const artistId = pathname.match(/^\/artist\/([^/]+)$/)?.[1]
    if (!artistId) {
      setArtistName(null)
      return
    }

    const loadArtistName = async () => {
      const response = await fetch(`${API_URL}/artists/${encodeURIComponent(artistId)}`)
      if (!response.ok) return
      const artist = await response.json() as { artist: string | null }
      setArtistName(artist.artist)
    }

    void loadArtistName()
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-base-100">
      <header className="w-full">
        <div className="navbar mx-auto min-h-16 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="navbar-start">
            <a className="btn btn-ghost px-2 text-xl normal-case" href="/">
              TwinTune
            </a>
            {artistName && (
              <>
              <div className="divider divider-horizontal divider-secondary"></div>
              <div className="bg-accent rounded-sm px-2 py-2 text-sm font-medium text-accent-content">
                <span className="truncate text-lg text-primary">{artistName}</span>
              </div>
              </>
              )
            }
          </div>
          <div className="navbar-end">
            <button className="btn btn-ghost btn-sm sm:hidden" type="button">
              Menu
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto min-h-full w-full max-w-[96rem] px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <footer className="w-full border-t border-base-300">
        <div className="footer mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm text-base-content/60">TwinTune</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout