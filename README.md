# 🍺 pubwhichway

A mobile web app whose compass needle points at the nearest pub. Don't fancy it? Tap **Nah, next one**.

- Static PWA: vanilla HTML/CSS/JS, no build step, no backend
- Pub data for Great Britain is pre-built from OpenStreetMap into small static tiles in `data/`, served by GitHub Pages itself. No live API, no rate limits.
- Outside Great Britain it falls back to the live [Overpass API](https://overpass-api.de/), with backup servers and a 1-hour `localStorage` cache.
- A "Did you know?" fact for every pub: the opening of its Wikipedia article if it has one, otherwise history from its OpenStreetMap tags or the story behind its name (Royal Oak, White Hart, Chequers…), plus badges like 🛢️ Real ale and 🔥 Real fire
- Works on iPhone (Safari) and Android (Chrome); installable to the home screen

## Files

```
index.html            UI
style.css             dark, thumb-friendly styles
app.js                compass, geolocation, skip buttons, rendering
lib.js                pure helpers: bearing, distance, sorting, skip/next selection
facts.js              pub-name trivia, tag badges, headline fact picker
wiki.js               Wikipedia summary lookup (via wikipedia/wikidata tags), cached
pubs.js               picks the data source: static tiles, or Overpass outside coverage
overpass.js           live Overpass fetch with cache, timeouts and backup servers
data/                 generated pub tiles (0.1° cells) + meta.json. Don't edit by hand
tools/build-pubs.sh   rebuilds data/ from a fresh OpenStreetMap extract
sw.js                 minimal service worker (app shell only; never caches Overpass)
manifest.webmanifest  PWA manifest
icons/                app icons (PNG regenerated with `node tools/make-icons.js`) and og.jpg,
                      the link-preview image (regenerated from tools/og.html with tools/make-og.sh)
tests/                `node --test` unit tests
```

## Run locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
node --test                   # unit tests (Node 18+)
```

Phones only allow geolocation and compass access over HTTPS, so test on a device through GitHub Pages (or a tunnel).
On a desktop, add `?at=lat,lon` to fake your position and skip the button, e.g. `http://localhost:8000/?at=52.9497,-1.1544`.

## Refreshing the pub data

The data is a snapshot, so re-run this every month or so (or when a new local opens):

```sh
sudo port install osmium-tool    # or: brew install osmium-tool (one-off)
tools/build-pubs.sh              # downloads ~2.2 GB into .osm/ (git-ignored), rebuilds data/
git add data && git commit -m "Refresh pub data" && git push
```

To cover more of the map, add Geofabrik region names to `REGIONS` in `tools/build-pubs.sh`.

## Deploy to GitHub Pages

1. Push this repo to GitHub (e.g. `pubwhichway`).
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**, then select the **main** branch and the **/ (root)** folder, and click **Save**.
4. After a minute the app is live at `https://<user>.github.io/pubwhichway/`.
5. On your phone, open it, tap **Find a pub**, and allow location (and motion & orientation on iOS). To install it, use **Share → Add to Home Screen** on iOS or **Install app** on Android.

The live site is https://pubwhichway.co.uk/ (custom domain set in Settings → Pages; the `CNAME` file is managed by GitHub).
All paths are relative, so it also works from a `/pubwhichway/` subpath. The one exception is the Open Graph tags in `index.html`, which must be absolute URLs for link previews. After you deploy changes, bump `CACHE` in `sw.js` so installed copies drop the old app-shell cache sooner. It's network-first anyway, so online users get updates straight away.

## Notes

- iOS needs a tap before it will ask for compass permission, which is why there's a **Find a pub** button.
- If your device has no compass, the needle points relative to north, with the top of the screen as north.
- Pub data © OpenStreetMap contributors, available under the ODbL. Wikipedia extracts are CC BY-SA and link back to the article.
- Name trivia is about the name, never invented facts about a particular pub. Add more in `NAME_TRIVIA` in `facts.js`.
- Your skipped pubs are kept for the browser session and survive moving around and refetching. **Back** un-skips the last one and **Reset** clears them all.
