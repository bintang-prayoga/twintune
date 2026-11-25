# TwinTune

TwinTune is a music discovery app with a React frontend, a FastAPI similarity API, and an Elysia backend for artist metadata.

## Requirements

- [Podman](https://podman.io/) for the containerized setup
- [Bun](https://bun.sh/) and [uv](https://docs.astral.sh/uv/) for local development
- A [Last.fm API key](https://www.last.fm/api/account/create) for Last.fm artist details

## Run with Podman

Run these commands from the repository root. The frontend is available at `http://localhost:8080`; FastAPI and Elysia are published on ports `8000` and `3000`.

1. Create `backend/elysia-backend/.env` with your Last.fm key:

   ```env
   LASTFM_API_KEY=your_lastfm_api_key
   ```

2. Build the three images:

   ```sh
   podman build -f backend/fastapi-backend/Containerfile \
     -t localhost/twintune-fastapi:latest .
   podman build -f backend/elysia-backend/Containerfile \
     -t localhost/twintune-elysia:latest .
   podman build -f frontend/Containerfile \
     --build-arg VITE_API_BASE_URL=http://localhost:8000 \
     -t localhost/twintune-frontend:latest .
   ```

3. Start the backends and frontend:

   ```sh
   podman run -d --name twintune-fastapi -p 8000:8000 \
     localhost/twintune-fastapi:latest
   podman run -d --name twintune-elysia -p 3000:3000 \
     --env-file backend/elysia-backend/.env \
     localhost/twintune-elysia:latest
   podman run -d --name twintune-frontend -p 8080:80 \
     localhost/twintune-frontend:latest
   ```

Open `http://localhost:8080`. The Last.fm key is read by Elysia at container startup, so recreate that container after changing the key. Keep the `.env` file private; it is excluded from Git.

To inspect service logs, use `podman logs twintune-fastapi`, `podman logs twintune-elysia`, or `podman logs twintune-frontend`. To stop and remove the containers:

```sh
podman rm -f twintune-frontend twintune-elysia twintune-fastapi
```

## Local development

Run each service in a separate terminal:

```sh
cd backend/fastapi-backend
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

```sh
cd backend/elysia-backend
bun install
bun run dev
```

```sh
cd frontend
bun install
bun run dev
```

The Vite development server uses port `5173`. FastAPI already allows that origin; add `http://localhost:5173` to Elysia's allowed CORS origin if you use Last.fm or MusicBrainz metadata while running the frontend in development mode.

Run the FastAPI tests with:

```sh
cd backend/fastapi-backend
uv run pytest
```
