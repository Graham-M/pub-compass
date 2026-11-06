Build "Pub Compass": a mobile web app (iPhone + Android) where a compass needle points to the nearest pub.

Stack:
- Static PWA (vanilla JS/HTML/CSS, no framework) hosted on GitHub Pages using "Deploy from a branch" (main, root). No build step, no GitHub Actions.
- No backend: query the OpenStreetMap Overpass API directly from the browser (it supports CORS, no API keys)

Overpass:
- Query nwr["amenity"="pub"] within 2km (widen to 5km if none) using `out center`. Keep the full result list sorted by distance client-side.
- Cache results in localStorage keyed on coords rounded to ~500m tiles, 1h TTL.
- On 429 or timeout, back off and retry against overpass.kumi.systems as a fallback. Show a friendly error if both fail.

"Not that one" feature:
- Add a "Nah, next one" button that skips the current target and points to the next-nearest pub.
- Keep a skipped set of OSM IDs in sessionStorage. Skipped pubs stay skipped even as the user moves and the list is re-sorted or refetched.
- Add a "Back" button to un-skip the last pub, and a "Reset" button to clear all skips.
- Show the position, e.g. "3rd nearest". If every pub in range is skipped, widen the search radius. If none remain, show a fun message.

Client:
- A "Find a pub" button is required, because iOS DeviceOrientationEvent.requestPermission() must be called from a user gesture.
- iOS: use deviceorientation with webkitCompassHeading. Android: use deviceorientationabsolute with heading = 360 - alpha. Show a fallback message if no compass is available.
- geolocation.watchPosition with high accuracy. Re-sort by distance as the user moves, and refetch only after moving >100m.
- Compute the great-circle bearing client-side and rotate the needle by (bearing - heading), smoothing the wraparound at 0/360.
- Display pub name, distance and an "open in maps" link (Apple Maps URL on iOS, geo: URI on Android).
- PWA manifest and a minimal service worker so it installs to the home screen. Don't cache Overpass responses in the service worker.
- Use relative paths throughout, so it works when served from a GitHub Pages project subpath (/<repo>/).
- Large, simple UI with a dark theme and thumb-friendly buttons.

Deliverables: project structure, frontend, and a short README with Pages setup steps. Include unit tests for the bearing function and the skip/next selection logic, runnable locally with `node --test`. Keep it minimal. This is a fun side project.
