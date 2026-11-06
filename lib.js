// Pure helpers (no DOM) so they can be unit-tested with `node --test`.

const EARTH_RADIUS_M = 6371000;
const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

/** Normalise any angle into [0, 360). */
export function normalize(deg) {
  return ((deg % 360) + 360) % 360;
}

/** Initial great-circle bearing from point 1 to point 2, degrees clockwise from true north. */
export function bearing(lat1, lon1, lat2, lon2) {
  const p1 = toRad(lat1);
  const p2 = toRad(lat2);
  const dl = toRad(lon2 - lon1);
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return normalize(toDeg(Math.atan2(y, x)));
}

/** Haversine distance in metres. */
export function distance(lat1, lon1, lat2, lon2) {
  const dp = toRad(lat2 - lat1);
  const dl = toRad(lon2 - lon1);
  const a =
    Math.sin(dp / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Signed shortest rotation (-180, 180] to get from `from` to `to`. Smooths the 359 -> 0 wrap. */
export function shortestDelta(from, to) {
  const d = normalize(to - from);
  return d > 180 ? d - 360 : d;
}

/** Turn an Overpass `out center` response into [{id, name, lat, lon}]. */
export function parsePubs(json) {
  return (json.elements || [])
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (lat == null || lon == null) return null;
      return { id: `${el.type}/${el.id}`, name: el.tags?.name || "Unnamed pub", lat, lon };
    })
    .filter(Boolean);
}

/** Returns a new array of pubs with `dist` (m) and `bearing` (deg) from the given point, nearest first. */
export function sortByDistance(pubs, lat, lon) {
  return pubs
    .map((p) => ({
      ...p,
      dist: distance(lat, lon, p.lat, p.lon),
      bearing: bearing(lat, lon, p.lat, p.lon),
    }))
    .sort((a, b) => a.dist - b.dist);
}

/**
 * Pick the nearest pub not in `skipped`.
 * Returns { pub, rank } where rank is the 1-based position in the full sorted list
 * (so skipping the two nearest gives rank 3, "3rd nearest"), or null if all are skipped.
 */
export function pickTarget(sorted, skipped) {
  const skip = new Set(skipped);
  const i = sorted.findIndex((p) => !skip.has(p.id));
  return i === -1 ? null : { pub: sorted[i], rank: i + 1 };
}

/** Skip list is an ordered array (a stack) so "Back" can undo the most recent skip. */
export function skipPub(skipped, id) {
  return skipped.includes(id) ? skipped : [...skipped, id];
}

export function unskipLast(skipped) {
  return skipped.slice(0, -1);
}

export function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formatDistance(m) {
  if (m < 1000) return `${Math.round(m / 10) * 10 || Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

/**
 * Snap a position to a ~500 m tile. Queries are centred on the tile centre so that
 * everyone in the same tile shares one cache entry.
 */
export function tileFor(lat, lon, radius) {
  const step = 0.0045; // ~500 m of latitude
  const latIdx = Math.round(lat / step);
  const cLat = latIdx * step;
  const lonStep = step / Math.max(0.01, Math.cos(toRad(cLat)));
  const lonIdx = Math.round(lon / lonStep);
  return { key: `pubs:${radius}:${latIdx}:${lonIdx}`, lat: cLat, lon: lonIdx * lonStep };
}

// ---------- static tiles (data/tiles/<latIdx>_<lonIdx>.json, 0.1° cells) ----------
export const TILE_DEG = 0.1;
export const COVERAGE_DEG = 0.5;

const cellKey = (lat, lon, deg) => `${Math.floor(lat / deg + 1e-9)}_${Math.floor(lon / deg + 1e-9)}`;

/** Key of the 0.1° static tile containing a point. */
export function staticTileKey(lat, lon) {
  return cellKey(lat, lon, TILE_DEG);
}

/** Key of the coarse 0.5° cell used to decide whether static data covers a point. */
export function coverageKey(lat, lon) {
  return cellKey(lat, lon, COVERAGE_DEG);
}

/** Keys of every static tile that a circle of `radius` metres around the point touches. */
export function tilesForRadius(lat, lon, radius) {
  const dLat = radius / 111320;
  const dLon = radius / (111320 * Math.max(0.01, Math.cos(toRad(lat))));
  const keys = [];
  const idx = (v) => Math.floor(v / TILE_DEG + 1e-9); // same rounding as staticTileKey
  for (let y = idx(lat - dLat); y <= idx(lat + dLat); y++) {
    for (let x = idx(lon - dLon); x <= idx(lon + dLon); x++) {
      keys.push(`${y}_${x}`);
    }
  }
  return keys;
}

/** Tile rows are compact [id, name, lat, lon] arrays. */
export function parseTile(rows) {
  return rows.map(([id, name, lat, lon]) => ({ id, name: name || "Unnamed pub", lat, lon }));
}
