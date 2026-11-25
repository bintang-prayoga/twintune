import { Elysia } from "elysia";

type MusicBrainzRelation = {
  type?: string;
  url?: {
    resource?: string;
  };
};

const LASTFM_API_KEY = Bun.env.LASTFM_API_KEY ?? "";

const app = new Elysia()
  .onRequest(({ set }) => {
    set.headers["Access-Control-Allow-Origin"] = "http://localhost:8080";
    set.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
    set.headers["Access-Control-Allow-Headers"] = "Content-Type";
  })
  .get("/", () => "Hello Elysia")
  .get("/artists/:artistName/metadata", async ({ params, set }) => {
    try {
      const response = await fetch(
        `https://musicbrainz.org/ws/2/artist/${encodeURIComponent(params.artistName)}?inc=url-rels&fmt=json`,
        {
          headers: {
            "User-Agent": "TwinTune/1.0 (music-discovery)",
          },
        },
      );

      if (!response.ok) {
        set.status = 502;
        return { detail: "MusicBrainz artist data could not be loaded." };
      }

      const data = await response.json() as { relations?: MusicBrainzRelation[] };
      const imageRelation = data.relations?.find((relation) => relation.type === "image");

      return {
        imageUrl: imageRelation?.url?.resource ?? null,
      };
    } catch (error) {
      console.error("MusicBrainz request failed:", error);
      set.status = 502;
      return { detail: "MusicBrainz artist data could not be loaded." };
    }
  })
  .get("/artists/:artistName/lastfm", async ({ params, set }) => {
    if (!LASTFM_API_KEY) {
      set.status = 503;
      return { detail: "Last.fm API key is not configured." };
    }

    const lastFmUrl = new URL("https://ws.audioscrobbler.com/2.0/");
    lastFmUrl.search = new URLSearchParams({
      method: "artist.getinfo",
      artist: params.artistName,
      api_key: LASTFM_API_KEY,
      format: "json",
    }).toString();

    let response: Response;
    try {
      response = await fetch(lastFmUrl);
    } catch (error) {
      console.error("Last.fm request failed:", error);
      set.status = 502;
      return { detail: "Last.fm artist data could not be loaded." };
    }

    if (!response.ok) {
      set.status = 502;
      return { detail: "Last.fm artist data could not be loaded." };
    }

    const data = await response.json() as {
      artist?: unknown;
      error?: number;
      message?: string;
    };
    console.log("Last.fm artist response:", data);

    if (data.error) {
      set.status = data.error === 6 ? 404 : 502;
      return {
        detail: data.message ?? "Last.fm artist data could not be loaded.",
      };
    }

    return data;
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
