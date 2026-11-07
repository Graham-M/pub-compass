import { test } from "node:test";
import assert from "node:assert/strict";
import { coverageKey, parseTile, staticTileKey, tilesForRadius } from "../lib.js";

test("staticTileKey floors into 0.1° cells, including west of Greenwich", () => {
  assert.equal(staticTileKey(51.51, -0.12), "515_-2");
  assert.equal(staticTileKey(51.5, 0.05), "515_0");
  assert.equal(staticTileKey(51.3, -0.1), "513_-1"); // exact boundaries don't slip down a cell
});

test("coverageKey uses 0.5° cells", () => {
  assert.equal(coverageKey(51.51, -0.12), "103_-1");
});

test("tilesForRadius includes the home tile and neighbours the circle reaches", () => {
  const home = staticTileKey(51.55, -0.15);
  const small = tilesForRadius(51.55, -0.15, 500); // middle of a tile
  assert.deepEqual(small, [home]);

  const edge = tilesForRadius(51.501, -0.199, 2000); // near the SW corner of tile 515_-2
  assert.ok(edge.includes("515_-2"));
  assert.ok(edge.includes("514_-2"), "reaches the tile to the south");
  assert.ok(edge.includes("515_-3"), "reaches the tile to the west");
  assert.ok(edge.includes("514_-3"), "reaches the diagonal tile");
});

test("every point within the radius falls in a returned tile", () => {
  const [lat, lon, r] = [53.4808, -2.2426, 5000];
  const keys = new Set(tilesForRadius(lat, lon, r));
  for (let b = 0; b < 360; b += 15) {
    const dLat = (r * Math.cos((b * Math.PI) / 180)) / 111320;
    const dLon = (r * Math.sin((b * Math.PI) / 180)) / (111320 * Math.cos((lat * Math.PI) / 180));
    assert.ok(keys.has(staticTileKey(lat + dLat * 0.99, lon + dLon * 0.99)), `bearing ${b}`);
  }
});

test("parseTile expands compact rows and names unnamed pubs", () => {
  assert.deepEqual(parseTile([["node/1", "The Crown", 51.5, -0.1, { food: "yes" }], ["way/2", "", 52, 0]]), [
    { id: "node/1", name: "The Crown", lat: 51.5, lon: -0.1, tags: { food: "yes" } },
    { id: "way/2", name: "Unnamed pub", lat: 52, lon: 0, tags: {} },
  ]);
});
