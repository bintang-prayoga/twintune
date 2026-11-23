import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Route, Routes } from 'react-router'
import App from './App.tsx'
import Layout from './Layout.tsx'
import ArtistPage from './artist/[id].tsx'
import ProfilePage from './profile/[id].tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/artist/:id" element={<ArtistPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </StrictMode>,
)
