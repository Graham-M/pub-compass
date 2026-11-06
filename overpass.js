import { parsePubs, tileFor } from "./lib.js";

const PRIMARY = "https://overpass-api.de/api/interpreter";
// Tried together after the primary fails; first good answer wins.
// The primary is retried too, since its 502/429s are often momentary.
const FALLBACKS = [
  "https://overpass.kumi.systems/api/interpreter",
  PRIMARY,
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
const TTL_MS = 60 * 60 * 1000;
const PRIMARY_TIMEOUT_MS = 10000;
const FALLBACK_TIMEOUT_MS = 25000;
const BACKOFF_MS = 1500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readCache(key, maxAge = TTL_MS) {
  try {
    const hit = JSON.parse(localStorage.getItem(key));
    if (hit && Date.now() - hit.t < maxAge) return hit.pubs;
  } catch {}
  return null;
}

function writeCache(key, pubs) {
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), pubs }));
  } catch {
    // Storage full: drop old pub entries and move on.
    try {
      Object.keys(localStorage).filter((k) => k.startsWith("pubs:")).forEach((k) => localStorage.removeItem(k));
    } catch {}
  }
}

async function post(url, q, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "POST", body: new URLSearchParams({ data: q }), signal: ctrl.signal });
    if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function query(q, onStatus) {
  try {
    return await post(PRIMARY, q, PRIMARY_TIMEOUT_MS);
  } catch (e) {
    console.warn("Overpass primary failed:", e);
  }
  onStatus?.("Main map server's busy, trying the backups…");
  await sleep(BACKOFF_MS);
  return Promise.any(FALLBACKS.map((u) => post(u, q, FALLBACK_TIMEOUT_MS)));
}

/** Pubs within `radius` metres of the ~500 m tile containing (lat, lon). Cached for 1h. */
export async function fetchPubs(lat, lon, radius, onStatus) {
  const tile = tileFor(lat, lon, radius);
  const cached = readCache(tile.key);
  if (cached) return cached;
  const q = `[out:json][timeout:15];nwr["amenity"="pub"](around:${radius},${tile.lat.toFixed(5)},${tile.lon.toFixed(5)});out center;`;
  let json;
  try {
    json = await query(q, onStatus);
  } catch (e) {
    // Every server failed: an old answer beats no answer.
    const stale = readCache(tile.key, Infinity);
    if (stale) return stale;
    throw e;
  }
  const pubs = parsePubs(json);
  writeCache(tile.key, pubs);
  return pubs;
}
