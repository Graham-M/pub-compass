import { test } from "node:test";
import assert from "node:assert/strict";
import { chips, headline, nameFact, normaliseName } from "../facts.js";
import { compassPoint, pickTags, walkMinutes } from "../lib.js";

const pub = (name, tags = {}, id = "node/1") => ({ id, name, tags });

test("normaliseName folds case, ampersands and punctuation", () => {
  assert.equal(normaliseName("The Rose & Crown"), "the rose and crown");
  assert.equal(normaliseName("King's  Head."), "kings head");
});

test("name trivia matches common names with or without 'The' and suffixes", () => {
  assert.match(nameFact("The Red Lion"), /most common pub name/);
  assert.match(nameFact("Red Lion Inn"), /most common pub name/);
  assert.match(nameFact("ROYAL OAK"), /Charles II/);
  assert.match(nameFact("The King's Head"), /Henry VIII/);
  assert.match(nameFact("The Kings Head Hotel"), /Henry VIII/);
});

test("specific names beat general ones", () => {
  assert.match(nameFact("Rose & Crown"), /Tudor rose/);
  assert.match(nameFact("The Crown"), /loyalty/);
  assert.match(nameFact("Swan With Two Necks"), /two nicks/);
  assert.match(nameFact("The Black Swan"), /royal birds/);
});

test("generic patterns: Ye Olde, Arms, Inn", () => {
  assert.match(nameFact("Ye Olde Cheshire Cheese"), /thorn/);
  assert.match(nameFact("The Bricklayers Arms"), /coat of arms/);
  assert.match(nameFact("The Dog Inn"), /beds and stabling/);
  assert.equal(nameFact("The Blue Bowl"), null);
  assert.equal(nameFact(""), null);
});

test("headline priority: old start_date > Wetherspoon > old_name > name trivia > brewery > fallback", () => {
  assert.equal(headline(pub("Red Lion", { start_date: "c.1720" })), "Pouring since 1720.");
  assert.match(headline(pub("The Moon Under Water", { brand: "Wetherspoon" })), /Tim Martin/);
  assert.equal(headline(pub("The Plough", { old_name: "The Bull;The Ox" })), "Formerly known as The Bull.");
  assert.match(headline(pub("The Royal Oak", { brewery: "Fuller's" })), /Charles II/);
  assert.equal(headline(pub("The Blue Bowl", { brewery: "Harvey's;Various;Dark Star" })), "Pours Harvey's, Dark Star.");
  assert.equal(headline(pub("The Blue Bowl", { start_date: "1998" })), "Open since 1998.");
  const fb = headline(pub("The Blue Bowl", {}, "way/99"));
  assert.ok(fb.length > 0);
  assert.equal(headline(pub("The Blue Bowl", {}, "way/99")), fb, "fallback is stable per pub");
});

test("chips from tags", () => {
  assert.deepEqual(chips({ real_ale: "yes", food: "no", beer_garden: "yes", listed_status: "Grade II*" }), [
    "🛢️ Real ale",
    "🌳 Outdoor seating",
    "📜 Grade II* listed",
  ]);
  assert.deepEqual(chips({ heritage: "2" }), ["📜 Listed building"]);
  assert.deepEqual(chips(), []);
});

test("pickTags keeps only whitelisted keys", () => {
  assert.deepEqual(pickTags({ name: "x", amenity: "pub", food: "yes", website: "https://a.b", phone: "1" }), {
    food: "yes",
    website: "https://a.b",
  });
  assert.deepEqual(pickTags(undefined), {});
});

test("walkMinutes and compassPoint", () => {
  assert.equal(walkMinutes(10), 1);
  assert.equal(walkMinutes(800), 10);
  assert.deepEqual([0, 44, 46, 90, 180, 270, 337, 359].map(compassPoint), ["N", "NE", "NE", "E", "S", "W", "NW", "N"]);
});
