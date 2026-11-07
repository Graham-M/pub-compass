import { test } from "node:test";
import assert from "node:assert/strict";
import { ordinal, parsePubs, pickTarget, skipPub, sortByDistance, tileFor, unskipLast } from "../lib.js";

// Pubs due north of (0, 0) at increasing distances.
const pubs = [
  { id: "node/3", name: "Three", lat: 0.003, lon: 0 },
  { id: "node/1", name: "One", lat: 0.001, lon: 0 },
  { id: "way/2", name: "Two", lat: 0.002, lon: 0 },
];

test("sortByDistance orders nearest first and adds dist/bearing", () => {
  const s = sortByDistance(pubs, 0, 0);
  assert.deepEqual(s.map((p) => p.name), ["One", "Two", "Three"]);
  assert.ok(Math.abs(s[0].bearing) < 0.01);
  assert.ok(s[0].dist > 100 && s[0].dist < 120);
});

test("pickTarget returns nearest with rank 1 when nothing is skipped", () => {
  const t = pickTarget(sortByDistance(pubs, 0, 0), []);
  assert.equal(t.pub.name, "One");
  assert.equal(t.rank, 1);
});

test("skipping moves to the next nearest and rank reflects overall position", () => {
  const s = sortByDistance(pubs, 0, 0);
  let skipped = skipPub([], "node/1");
  assert.deepEqual(pickTarget(s, skipped).rank, 2);
  skipped = skipPub(skipped, "way/2");
  const t = pickTarget(s, skipped);
  assert.equal(t.pub.name, "Three");
  assert.equal(t.rank, 3);
  assert.equal(`${ordinal(t.rank)} nearest`, "3rd nearest");
});

test("all skipped -> null", () => {
  const s = sortByDistance(pubs, 0, 0);
  assert.equal(pickTarget(s, ["node/1", "way/2", "node/3"]), null);
  assert.equal(pickTarget([], []), null);
});

test("skips persist through re-sorting after the user moves", () => {
  const skipped = ["node/1"];
  // Move north past all of them: now Three is nearest, One is furthest.
  const s = sortByDistance(pubs, 0.004, 0);
  assert.deepEqual(s.map((p) => p.name), ["Three", "Two", "One"]);
  const t = pickTarget(s, skipped);
  assert.equal(t.pub.name, "Three");
  assert.equal(t.rank, 1);
  // Skipped pub is still skipped even though it was re-sorted to the end.
  assert.equal(pickTarget(s, ["node/3", "way/2", ...skipped]), null);
});

test("skips for pubs not in the current list are ignored, not lost", () => {
  const s = sortByDistance(pubs, 0, 0);
  const skipped = ["node/999"];
  assert.equal(pickTarget(s, skipped).pub.name, "One");
});

test("skipPub is idempotent; unskipLast undoes the most recent skip", () => {
  let skipped = skipPub([], "a");
  skipped = skipPub(skipped, "b");
  skipped = skipPub(skipped, "b");
  assert.deepEqual(skipped, ["a", "b"]);
  assert.deepEqual(unskipLast(skipped), ["a"]);
  assert.deepEqual(unskipLast([]), []);
});

test("ordinal", () => {
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 101].map(ordinal), [
    "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "101st",
  ]);
});

test("parsePubs handles nodes, ways (center) and missing names", () => {
  const out = parsePubs({
    elements: [
      { type: "node", id: 1, lat: 1, lon: 2, tags: { name: "The Crown", real_ale: "yes", amenity: "pub", phone: "0" } },
      { type: "way", id: 2, center: { lat: 3, lon: 4 }, tags: {} },
      { type: "relation", id: 3, tags: { name: "No coords" } },
    ],
  });
  assert.deepEqual(out, [
    { id: "node/1", name: "The Crown", lat: 1, lon: 2, tags: { real_ale: "yes" } },
    { id: "way/2", name: "Unnamed pub", lat: 3, lon: 4, tags: {} },
  ]);
});

test("tileFor buckets nearby points together", () => {
  const a = tileFor(51.499, -0.12, 2000);
  const b = tileFor(51.4995, -0.1203, 2000);
  const c = tileFor(51.52, -0.12, 2000);
  assert.equal(a.key, b.key);
  assert.notEqual(a.key, c.key);
  assert.notEqual(a.key, tileFor(51.5, -0.12, 5000).key);
});
