// Turns osmium GeoJSON-seq exports into static tiles for the app.
// Usage: node tools/build-tiles.js a-pubs.geojsonseq [b-pubs.geojsonseq ...]
// Writes data/tiles/<latIdx>_<lonIdx>.json and data/meta.json (replacing any previous tiles).
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { coverageKey, pickTags, staticTileKey } from "../lib.js";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("usage: node tools/build-tiles.js <file.geojsonseq>...");
  process.exit(1);
}

const TYPES = { n: "node", w: "way", r: "relation" };
const round = (x) => Math.round(x * 1e6) / 1e6;

/** Centre of a geometry's bounding box (good enough for a pub building). */
function centre(geometry) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  (function walk(c) {
    if (typeof c[0] === "number") {
      minX = Math.min(minX, c[0]); maxX = Math.max(maxX, c[0]);
      minY = Math.min(minY, c[1]); maxY = Math.max(maxY, c[1]);
    } else c.forEach(walk);
  })(geometry.coordinates);
  return [(minY + maxY) / 2, (minX + maxX) / 2];
}

const pubs = new Map(); // dedupes pubs that appear in more than one extract
for (const file of files) {
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const s = line.replace(/^\x1e/, "").trim();
    if (!s) continue;
    const f = JSON.parse(s);
    const m = /^([nwra])(\d+)$/.exec(f.id ?? "");
    if (!m || !f.geometry) continue;
    let id;
    if (m[1] === "a") {
      // osmium area ids: way id * 2, or relation id * 2 + 1 (multipolygon pubs only appear this way)
      const n = BigInt(m[2]);
      id = n % 2n ? `relation/${(n - 1n) / 2n}` : `way/${n / 2n}`;
    } else {
      id = `${TYPES[m[1]]}/${m[2]}`;
    }
    if (pubs.has(id)) continue;
    const [lat, lon] = centre(f.geometry);
    const tags = pickTags(f.properties);
    const row = [id, f.properties?.name ?? "", round(lat), round(lon)];
    if (Object.keys(tags).length) row.push(tags);
    pubs.set(id, row);
  }
}

const tiles = new Map();
for (const row of pubs.values()) {
  const key = staticTileKey(row[2], row[3]);
  if (!tiles.has(key)) tiles.set(key, []);
  tiles.get(key).push(row);
}

const dir = new URL("../data/", import.meta.url);
rmSync(new URL("tiles/", dir), { recursive: true, force: true });
mkdirSync(new URL("tiles/", dir), { recursive: true });
for (const [key, rows] of tiles) {
  rows.sort((a, b) => a[0].localeCompare(b[0])); // stable output = small git diffs on refresh
  writeFileSync(new URL(`tiles/${key}.json`, dir), JSON.stringify(rows));
}

const coverage = new Set([...pubs.values()].map((r) => coverageKey(r[2], r[3])));
writeFileSync(
  new URL("meta.json", dir),
  JSON.stringify({
    generated: new Date().toISOString(),
    source: "OpenStreetMap contributors (ODbL), via Geofabrik extracts",
    count: pubs.size,
    tiles: [...tiles.keys()].sort(),
    coverage: [...coverage].sort(),
  }),
);
console.log(`${pubs.size} pubs -> ${tiles.size} tiles, ${coverage.size} coverage cells`);
