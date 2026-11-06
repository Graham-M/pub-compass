// Pub data source: static tiles on GitHub Pages where we have them, live Overpass elsewhere.
import { coverageKey, distance, parseTile, tilesForRadius } from "./lib.js";
import { fetchPubs as fetchOverpass } from "./overpass.js";

let metaPromise = null;
const tileCache = new Map();

function loadMeta() {
  metaPromise ??= fetch("data/meta.json")
    .then((r) => {
      if (!r.ok) throw new Error(`meta.json HTTP ${r.status}`);
      return r.json();
    })
    .then((m) => ({ tiles: new Set(m.tiles), coverage: new Set(m.coverage) }))
    .catch((e) => {
      metaPromise = null; // try again next time
      console.warn(e);
      return null;
    });
  return metaPromise;
}

function loadTile(key) {
  if (!tileCache.has(key)) {
    const p = fetch(`data/tiles/${key}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`tile ${key} HTTP ${r.status}`);
        return r.json();
      })
      .then(parseTile)
      .catch((e) => {
        tileCache.delete(key);
        throw e;
      });
    tileCache.set(key, p);
  }
  return tileCache.get(key);
}

/** Pubs within `radius` metres of (lat, lon). */
export async function fetchPubs(lat, lon, radius, onStatus) {
  const meta = await loadMeta();
  if (!meta || !meta.coverage.has(coverageKey(lat, lon))) {
    return fetchOverpass(lat, lon, radius, onStatus);
  }
  const keys = tilesForRadius(lat, lon, radius).filter((k) => meta.tiles.has(k));
  const tiles = await Promise.all(keys.map(loadTile));
  return tiles.flat().filter((p) => distance(lat, lon, p.lat, p.lon) <= radius);
}
