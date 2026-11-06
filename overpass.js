import { parsePubs, tileFor } from "./lib.js";

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const TTL_MS = 60 * 60 * 1000;
const CLIENT_TIMEOUT_MS = 20000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readCache(key) {
  try {
    const hit = JSON.parse(localStorage.getItem(key));
    if (hit && Date.now() - hit.t < TTL_MS) return hit.pubs;
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

async function query(q) {
  let lastErr;
  for (let i = 0; i < ENDPOINTS.length; i++) {
    if (i > 0) await sleep(2000); // back off before hitting the fallback
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CLIENT_TIMEOUT_MS);
    try {
      const res = await fetch(ENDPOINTS[i], {
        method: "POST",
        body: new URLSearchParams({ data: q }),
        signal: ctrl.signal,
      });
      if (res.ok) return await res.json();
      lastErr = new Error(`Overpass HTTP ${res.status}`);
    } catch (e) {
      lastErr = e;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

/** Pubs within `radius` metres of the ~500 m tile containing (lat, lon). Cached for 1h. */
export async function fetchPubs(lat, lon, radius) {
  const tile = tileFor(lat, lon, radius);
  const cached = readCache(tile.key);
  if (cached) return cached;
  const q = `[out:json][timeout:15];nwr["amenity"="pub"](around:${radius},${tile.lat.toFixed(5)},${tile.lon.toFixed(5)});out center;`;
  const pubs = parsePubs(await query(q));
  writeCache(tile.key, pubs);
  return pubs;
}
