import {
  compassPoint,
  distance,
  formatDistance,
  normalize,
  ordinal,
  pickTarget,
  shortestDelta,
  skipPub,
  sortByDistance,
  unskipLast,
  walkMinutes,
} from "./lib.js";
import { fetchPubs } from "./pubs.js";
import { chips, headline } from "./facts.js";
import { wikiSummary } from "./wiki.js";

const RADII = [2000, 5000];
const REFETCH_AFTER_M = 100;
const ARRIVED_M = 25;
const SKIP_KEY = "pubwhichway.skipped";

const $ = (id) => document.getElementById(id);
const el = {
  start: $("start"),
  main: $("main"),
  findBtn: $("find"),
  needle: $("needle"),
  dial: $("dial"),
  name: $("name"),
  meta: $("meta"),
  maps: $("maps"),
  compass: $("compass"),
  fact: $("fact"),
  factText: $("fact-text"),
  factSource: $("fact-source"),
  chips: $("chips"),
  site: $("site"),
  status: $("status"),
  retry: $("retry"),
  next: $("next"),
  back: $("back"),
  reset: $("reset"),
};

const state = {
  pos: null, // {lat, lon}
  lastFetchPos: null,
  radius: RADII[0],
  pubs: [], // sorted by distance from state.pos
  skipped: loadSkipped(),
  heading: null, // degrees, null = unknown
  hasCompass: false,
  fetching: false,
  fetchNote: null, // progress text while fetching
  error: null,
};

const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isAndroid = /Android/i.test(navigator.userAgent);

// ---------- skip persistence ----------
function loadSkipped() {
  try {
    const v = JSON.parse(sessionStorage.getItem(SKIP_KEY));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function setSkipped(list) {
  state.skipped = list;
  try {
    sessionStorage.setItem(SKIP_KEY, JSON.stringify(list));
  } catch {}
}

// ---------- compass ----------
function screenAngle() {
  return screen.orientation?.angle ?? window.orientation ?? 0;
}
function setHeading(h) {
  state.hasCompass = true;
  state.heading = normalize(h + screenAngle());
}
function startCompass() {
  if ("ondeviceorientationabsolute" in window) {
    // Android / Chrome: alpha is counter-clockwise from north.
    window.addEventListener("deviceorientationabsolute", (e) => {
      if (e.alpha != null) setHeading(360 - e.alpha);
    });
  } else {
    // iOS Safari (webkitCompassHeading), or browsers that flag absolute on the normal event.
    window.addEventListener("deviceorientation", (e) => {
      if (e.webkitCompassHeading != null) setHeading(e.webkitCompassHeading);
      else if (e.absolute && e.alpha != null) setHeading(360 - e.alpha);
    });
  }
  setTimeout(() => {
    if (!state.hasCompass) render();
  }, 3000);
}

async function requestOrientationPermission() {
  const DOE = window.DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission === "function") {
    try {
      return (await DOE.requestPermission()) === "granted";
    } catch {
      return false;
    }
  }
  return true;
}

// ---------- needle animation ----------
let needleAngle = 0;
let dialAngle = 0;
function animate() {
  const target = currentTarget();
  const heading = state.heading ?? 0;
  if (target) {
    needleAngle += shortestDelta(needleAngle, target.pub.bearing - heading) * 0.2;
    el.needle.style.transform = `rotate(${needleAngle}deg)`;
  }
  dialAngle += shortestDelta(dialAngle, -heading) * 0.2;
  el.dial.style.transform = `rotate(${dialAngle}deg)`;
  requestAnimationFrame(animate);
}

// ---------- location + data ----------
function currentTarget() {
  return pickTarget(state.pubs, state.skipped);
}

async function refresh(startRadius = RADII[0]) {
  if (!state.pos || state.fetching) return;
  state.fetching = true;
  state.error = null;
  state.lastFetchPos = { ...state.pos };
  render();
  try {
    for (const radius of RADII.filter((r) => r >= startRadius)) {
      const pubs = await fetchPubs(state.pos.lat, state.pos.lon, radius, (note) => {
        state.fetchNote = note;
        render();
      });
      state.radius = radius;
      state.pubs = sortByDistance(pubs, state.pos.lat, state.pos.lon);
      if (currentTarget()) break;
    }
  } catch (e) {
    console.warn(e);
    state.error =
      "The pub map servers are all swamped right now. Give it a minute and hit Retry.";
  } finally {
    state.fetching = false;
    state.fetchNote = null;
    render();
  }
}

function onPosition(p) {
  state.pos = { lat: p.coords.latitude, lon: p.coords.longitude };
  if (
    !state.lastFetchPos ||
    distance(state.lastFetchPos.lat, state.lastFetchPos.lon, state.pos.lat, state.pos.lon) > REFETCH_AFTER_M
  ) {
    refresh();
  } else {
    state.pubs = sortByDistance(state.pubs, state.pos.lat, state.pos.lon);
    render();
  }
}

function onPositionError(err) {
  state.error =
    err.code === err.PERMISSION_DENIED
      ? "I need your location to find a pub. Enable location for this site and reload."
      : "Can't get your location yet. Try stepping outside, where the pubs are.";
  render();
}

// ---------- UI ----------
function mapsUrl(pub) {
  const label = encodeURIComponent(pub.name);
  if (isIOS) return `https://maps.apple.com/?daddr=${pub.lat},${pub.lon}&q=${label}&dirflg=w`;
  if (isAndroid) return `geo:${pub.lat},${pub.lon}?q=${pub.lat},${pub.lon}(${label})`;
  return `https://www.openstreetmap.org/?mlat=${pub.lat}&mlon=${pub.lon}#map=18/${pub.lat}/${pub.lon}`;
}

// Fact card: only rebuilt when the target pub changes; Wikipedia fills in later if it has anything.
let factFor = null;
function renderFact(pub) {
  if (!pub) {
    factFor = null;
    el.fact.hidden = true;
    return;
  }
  if (factFor === pub.id) return;
  factFor = pub.id;
  el.fact.hidden = false;
  el.factText.textContent = headline(pub);
  el.factSource.hidden = true;
  el.chips.replaceChildren(
    ...chips(pub.tags).map((c) => Object.assign(document.createElement("span"), { className: "chip", textContent: c })),
  );
  const site = /^https?:\/\//i.test(pub.tags?.website || "") ? pub.tags.website : null;
  el.site.hidden = !site;
  if (site) el.site.href = site;

  wikiSummary(pub).then((w) => {
    if (!w || factFor !== pub.id) return;
    el.factText.textContent = w.text;
    el.factSource.href = w.url;
    el.factSource.hidden = false;
  });
}

function render() {
  const target = currentTarget();
  const skippedHere = state.pubs.filter((p) => state.skipped.includes(p.id)).length;

  el.back.disabled = state.skipped.length === 0;
  el.reset.disabled = state.skipped.length === 0;
  el.next.disabled = !target;
  el.needle.hidden = !target;

  let status = "";
  if (state.error) {
    status = state.error;
  } else if (!state.pos) {
    status = "Finding you…";
  } else if (state.fetching && !target) {
    status = state.fetchNote || "Sniffing out pubs…";
  } else if (target && target.pub.dist < ARRIVED_M) {
    status = "🍻 You've arrived. Get them in.";
  } else if (!state.hasCompass && target) {
    status = "No compass on this device — the needle points relative to north (top of screen = north).";
  }

  if (target) {
    const { pub, rank } = target;
    el.name.textContent = pub.name;
    el.meta.textContent = [
      formatDistance(pub.dist),
      `~${walkMinutes(pub.dist)} min walk`,
      compassPoint(pub.bearing),
      rank === 1 ? "nearest" : `${ordinal(rank)} nearest`,
    ].join(" · ");
    el.maps.href = mapsUrl(pub);
    el.maps.hidden = false;
  } else {
    el.maps.hidden = true;
    el.meta.textContent = "";
    if (state.pos && !state.fetching && !state.error) {
      if (state.pubs.length === 0) {
        el.name.textContent = "A pub desert 🏜️";
        status = "No pubs within 5 km. Time to start one?";
      } else {
        el.name.textContent = "You fussy so-and-so 🍺";
        status = `You've turned down all ${skippedHere} pubs within 5 km. Tap Reset to reconsider.`;
      }
    } else {
      el.name.textContent = "…";
    }
  }

  renderFact(target?.pub);
  el.compass.classList.toggle("arrived", !!target && target.pub.dist < ARRIVED_M);
  el.status.textContent = status;
  el.retry.hidden = !(state.error && state.pos);
}

el.findBtn.addEventListener("click", async () => {
  // Must be called directly from the tap on iOS.
  const granted = await requestOrientationPermission();
  el.start.hidden = true;
  el.main.hidden = false;
  if (granted) startCompass();
  render();

  if (!("geolocation" in navigator)) {
    state.error = "This browser can't share your location, so no pub for you.";
    return render();
  }
  const at = new URLSearchParams(location.search).get("at")?.split(",").map(Number);
  if (at?.length === 2 && at.every(Number.isFinite)) {
    onPosition({ coords: { latitude: at[0], longitude: at[1] } }); // ?at=lat,lon for testing
    return requestAnimationFrame(animate);
  }
  navigator.geolocation.watchPosition(onPosition, onPositionError, {
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 30000,
  });
  requestAnimationFrame(animate);
});

el.next.addEventListener("click", () => {
  const target = currentTarget();
  if (!target) return;
  setSkipped(skipPub(state.skipped, target.pub.id));
  if (!currentTarget() && state.radius < RADII[RADII.length - 1]) {
    refresh(RADII[RADII.indexOf(state.radius) + 1]);
  }
  render();
});

el.back.addEventListener("click", () => {
  setSkipped(unskipLast(state.skipped));
  render();
});

el.reset.addEventListener("click", () => {
  setSkipped([]);
  if (state.radius !== RADII[0] && state.pos) refresh();
  render();
});

el.retry.addEventListener("click", () => refresh(state.radius));

// Dial ticks: long every 30°, short every 10°.
(function drawTicks() {
  const g = document.getElementById("ticks");
  for (let a = 0; a < 360; a += 10) {
    if (a % 90 === 0) continue; // letters go there
    const long = a % 30 === 0;
    const t = document.createElementNS("http://www.w3.org/2000/svg", "line");
    t.setAttribute("x1", 100);
    t.setAttribute("x2", 100);
    t.setAttribute("y1", 8);
    t.setAttribute("y2", long ? 20 : 14);
    t.setAttribute("transform", `rotate(${a} 100 100)`);
    t.setAttribute("class", long ? "tick long" : "tick");
    g.append(t);
  }
})();

// ?at=lat,lon skips the button (no compass permission needed) for desktop testing.
if (/[?&]at=/.test(location.search)) el.findBtn.click();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
