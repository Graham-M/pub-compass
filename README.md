# 🍺 Pub Compass

A mobile web app whose compass needle points at the nearest pub. Don't fancy it? Tap **Nah, next one**.

- Static PWA: vanilla HTML/CSS/JS, no build step, no backend
- Pub data from OpenStreetMap via the [Overpass API](https://overpass-api.de/) (with `overpass.kumi.systems` as a fallback), cached in `localStorage` per ~500 m tile for 1 hour
- Works on iPhone (Safari) and Android (Chrome); installable to the home screen

## Files

```
index.html            UI
style.css             dark, thumb-friendly styles
app.js                compass, geolocation, skip buttons, rendering
lib.js                pure helpers: bearing, distance, sorting, skip/next selection
overpass.js           Overpass fetch with cache, timeout and fallback
sw.js                 minimal service worker (app shell only; never caches Overpass)
manifest.webmanifest  PWA manifest
icons/                app icons (PNG regenerated with `node tools/make-icons.js`)
tests/                `node --test` unit tests
```

## Run locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
node --test                   # unit tests (Node 18+)
```

Phones only allow geolocation and compass access over HTTPS, so test on a device through GitHub Pages (or a tunnel).

## Deploy to GitHub Pages

1. Push this repo to GitHub (e.g. `pub-compass`).
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**, then select the **main** branch and the **/ (root)** folder, and click **Save**.
4. After a minute the app is live at `https://<user>.github.io/pub-compass/`.
5. On your phone, open it, tap **Find a pub**, and allow location (and motion & orientation on iOS). To install it, use **Share → Add to Home Screen** on iOS or **Install app** on Android.

All paths are relative, so it works from the `/pub-compass/` subpath. After you deploy changes, bump `CACHE` in `sw.js` so installed copies drop the old app-shell cache sooner. It's network-first anyway, so online users get updates straight away.

## Notes

- iOS needs a tap before it will ask for compass permission, which is why there's a **Find a pub** button.
- If your device has no compass, the needle points relative to north, with the top of the screen as north.
- Your skipped pubs are kept for the browser session and survive moving around and refetching. **Back** un-skips the last one and **Reset** clears them all.
