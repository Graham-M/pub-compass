// Opening lines of a pub's Wikipedia article, if it has one (wikipedia= or wikidata= tag).
const cache = new Map(); // pub id -> Promise<{text, url} | null>

async function json(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function articleFor(tags) {
  // wikipedia=en:Title (language prefix is optional in practice)
  const m = /^(?:([a-z-]{2,12}):)?(.+)$/.exec(tags.wikipedia || "");
  if (m) return { lang: m[1] || "en", title: m[2] };
  if (/^Q\d+$/.test(tags.wikidata || "")) {
    const d = await json(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${tags.wikidata}&props=sitelinks&sitefilter=enwiki&format=json&origin=*`,
    );
    const title = d.entities?.[tags.wikidata]?.sitelinks?.enwiki?.title;
    if (title) return { lang: "en", title };
  }
  return null;
}

function trim(text, max = 260) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = cut.lastIndexOf(". ");
  return end > 80 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "") + "…";
}

export function wikiSummary(pub) {
  const tags = pub.tags || {};
  if (!tags.wikipedia && !tags.wikidata) return Promise.resolve(null);
  if (!cache.has(pub.id)) {
    const p = (async () => {
      const a = await articleFor(tags);
      if (!a) return null;
      const s = await json(
        `https://${a.lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(a.title.replace(/ /g, "_"))}`,
      );
      if (s.type !== "standard" || !s.extract) return null;
      return { text: trim(s.extract), url: s.content_urls?.mobile?.page || s.content_urls?.desktop?.page };
    })().catch(() => null);
    cache.set(pub.id, p);
  }
  return cache.get(pub.id);
}
