import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "Mozilla/5.0 NewsBot/1.0" },
});

const SOURCES = {
  main: [
    "https://ria.ru/export/rss2/archive/index.xml",
    "https://tass.ru/rss/v2.xml",
    "https://lenta.ru/rss/news",
  ],
  war: [
    "https://ria.ru/export/rss2/archive/index.xml",
    "https://tass.ru/rss/v2.xml",
    "https://rg.ru/xml/index.xml",
  ],
  sport: [
    "https://www.sports.ru/rss/all_news.xml",
    "https://rsport.ria.ru/export/rss2/archive/index.xml",
  ],
  games: [
    "https://stopgame.ru/rss/rss_news.xml",
    "https://dtf.ru/rss/games",
  ],
  science: [
    "https://nplus1.ru/rss",
    "https://ria.ru/export/rss2/archive/index.xml",
  ],
  tech: [
    "https://habr.com/ru/rss/news/",
    "https://tjournal.ru/rss",
  ],
  auto: [
    "https://www.zr.ru/rss/feed/",
    "https://motor.ru/rss/all.xml",
  ],
  cinema: [
    "https://www.kinopoisk.ru/rss/news/",
    "https://www.film.ru/rss/news",
  ],
  all: [
    "https://ria.ru/export/rss2/archive/index.xml",
    "https://tass.ru/rss/v2.xml",
    "https://lenta.ru/rss/news",
    "https://www.sports.ru/rss/all_news.xml",
    "https://stopgame.ru/rss/rss_news.xml",
    "https://nplus1.ru/rss",
    "https://habr.com/ru/rss/news/",
    "https://motor.ru/rss/all.xml",
  ],
};

function cleanText(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, "")
    .trim()
    .slice(0, 200);
}

function extractImage(item) {
  if (item.enclosure?.url) return item.enclosure.url;

  const media = item["media:content"] || item.mediaContent;
  if (media) {
    if (Array.isArray(media) && media[0]?.$?.url) return media[0].$.url;
    if (media.$?.url) return media.$.url;
  }

  const thumb = item["media:thumbnail"];
  if (thumb?.$?.url) return thumb.$.url;
  if (Array.isArray(thumb) && thumb[0]?.$?.url) return thumb[0].$.url;

  const html =
    item["content:encoded"] ||
    item.content ||
    item.description ||
    item.summary ||
    "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match && match[1]) return match[1];

  return null;
}

async function fetchRss(url) {
  const feed = await parser.parseURL(url);
  return (feed.items || []).slice(0, 15).map((item) => ({
    title: item.title || "Без заголовка",
    link: item.link || "#",
    description: cleanText(
      item.contentSnippet || item.summary || item.content || ""
    ),
    image: extractImage(item),
    date: item.pubDate || item.isoDate || "",
    source: feed.title || new URL(url).hostname,
  }));
}

export default async function handler(req, res) {
  const category = (req.query.category || "main").toString();
  const feeds = SOURCES[category] || SOURCES.main;

  try {
    const results = await Promise.allSettled(feeds.map((u) => fetchRss(u)));

    let news = [];
    for (const r of results) {
      if (r.status === "fulfilled") news = news.concat(r.value);
      else console.error("Источник упал:", r.reason?.message || r.reason);
    }

    news.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const seen = new Set();
    news = news.filter((n) => {
      const key = n.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res
      .status(200)
      .json({ category, count: news.length, news: news.slice(0, 40) });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Ошибка загрузки новостей", details: String(err) });
  }
}
