import { test } from "node:test";
import assert from "node:assert/strict";
import { bearing, distance, normalize, shortestDelta } from "../lib.js";

const near = (actual, expected, tol = 0.5) =>
  assert.ok(Math.abs(actual - expected) <= tol, `expected ${actual} ≈ ${expected}`);

test("cardinal bearings", () => {
  near(bearing(0, 0, 1, 0), 0);
  near(bearing(0, 0, 0, 1), 90);
  near(bearing(0, 0, -1, 0), 180);
  near(bearing(0, 0, 0, -1), 270);
});

test("bearing is always in [0, 360)", () => {
  const b = bearing(51.5, -0.1, 51.6, -0.2); // north-west
  assert.ok(b >= 0 && b < 360);
  assert.ok(b > 270 && b < 360);
});

test("great-circle bearing London -> New York", () => {
  // Known initial bearing ≈ 288.3°
  near(bearing(51.5074, -0.1278, 40.7128, -74.006), 288.3, 1);
});

test("distance: 1 degree of latitude ≈ 111.2 km", () => {
  near(distance(0, 0, 1, 0), 111195, 100);
  assert.equal(distance(51.5, -0.1, 51.5, -0.1), 0);
});

test("normalize", () => {
  assert.equal(normalize(-90), 270);
  assert.equal(normalize(720), 0);
  assert.equal(normalize(365), 5);
});

test("shortestDelta smooths the 0/360 wrap", () => {
  assert.equal(shortestDelta(350, 10), 20);
  assert.equal(shortestDelta(10, 350), -20);
  assert.equal(shortestDelta(0, 180), 180);
  assert.equal(shortestDelta(720 + 5, 0), -5); // works with unbounded accumulated angles
});
