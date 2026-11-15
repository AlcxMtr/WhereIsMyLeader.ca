# where-is-my-leader

The Next.js frontend for [whereismyleader.ca](https://whereismyleader.ca): an interactive 3D globe showing where
the Prime Minister has travelled, built on [`react-globe.gl`](https://github.com/vasturiano/react-globe.gl).

Trip data is written to SQLite by the `scraper` service (in `../scraper`). This app only reads it.

## Running locally

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # vitest
npm run lint
```

Locally, the API reads `../shared-data/trips.db`, or `../shared-data/trips_fallback.json` if the database doesn't exist.
In production (`NODE_ENV=production`) both are read from `/app/data`, which docker-compose mounts from `shared-data/`.

## Layout

| Path | What lives there |
| --- | --- |
| `app/page.tsx`, `app/[person]/page.tsx` | Default landing page (`carney`) and dynamic per-person route (`/carney`, `/andrewdeng`, …) |
| `app/api/trips/route.ts` | `GET /api/trips?person=<id>` (defaults to `carney`) |
| `lib/subjects.ts` | Shared subject registry (IDs, names, welcome copy, navigation strategy) |
| `lib/server/` | Server-only data loading (`sqliteTrips.ts`, `leaderTrips.ts`, and static person files) |
| `lib/dates.ts`, `lib/types.ts` | Date helpers and the `TravelPoint` type shared by client and server |
| `components/TravelMap.tsx` | Top-level client component: loads trips and connects the globe, sidebar and timeline |
| `components/map/` | `GlobeMap`, `Sidebar`, `MobileTripStrip`, `TimelineRange` and the components inside them |
| `components/map/hooks/` | One hook per behaviour (camera, playback, selection, timeline filter, …) |
| `components/map/globe/` | Pure helpers that turn trips into globe data (points, arcs, country overlay, camera plans) |
| `components/map/tripDetail/` | The pin's detail bubble, built as plain DOM because globe.gl needs a real element |
| `components/map/places.ts` | Resolving `"City, Region, Country"` strings to country names and ISO codes |
| `components/map/tripUtils.ts` | Trip date logic (date ranges, bounds, current/most recent trip) |
| `components/map/theme.ts` | Light/dark palettes, exposed to CSS as `--wiml-*` variables |

## Country data

Flags and country highlights need a country code for every place. These files come from
[Natural Earth](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/) (admin-0 map subunits):

- `public/geojson/world.geojson`: a simplified shape for every country and territory
- `components/map/countryNames.generated.ts`: every known name for each country, mapped to its ISO code

To regenerate them, run `node scripts/build-country-data.mjs <natural-earth.geojson>`. Hand-written names
(provinces, short forms such as "UAE") live in `components/map/locationData.ts` and take precedence.
`components/map/flagColors.ts` holds one highlight colour per country. `countryCoverage.test.ts` fails if any
country is missing a shape, a colour or a resolvable name.

## Adding a person

1. Register the subject in `lib/subjects.ts` (ID, display name, welcome copy, page metadata, first-trip strategy).
2. Add their loader in `lib/server/leaderTrips.ts` (a SQLite DB filename via `loadDatabaseTrips(...)` or a static data file under `lib/server/people/`).

Once registered, `/<id>` and `/api/trips?person=<id>` work automatically via `app/[person]/page.tsx`.
