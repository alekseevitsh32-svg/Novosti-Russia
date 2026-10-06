import Parser from "rss-parser";
import * as cheerio from "cheerio";

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
  sport: [
    "https://www.sports.ru/rss/all_news.xml",
    "https://rsport.ria.ru/export/rss2/archive/index.xml",
  ],
  games: [
    "https://stopgame.ru/rss/rss_news.xml",
    "https://dtf.ru/rss/games",
  ],
  food: [
    "https://ria.ru/export/rss2/archive/index.xml",
  ],
  all: [
    "https://ria.ru/export/rss2/archive/index.xml",
    "https://tass.ru/rss/v2.xml",
    "https://lenta.ru/rss/news",
    "https://www.sports.ru/rss/all_news.xml",
    "https://stopgame.ru/rss/rss_news.xml",
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

async function fetchRss(url) {
  const feed = await parser.parseURL(url);
  return (feed.items || []).slice(0, 15).map((item) => ({
    title: item.title || "Без заголовка",
    link: item.link || "#",
    description: cleanText(
      item.contentSnippet || item.summary || item.content || ""
    ),
    date: item.pubDate || item.isoDate || "",
    source: feed.title || new URL(url).hostname,
  }));
}

// ===== HTML-парсер для еды =====

async function fetchHtml(url, selectorFn, sourceName) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept-Language": "ru-RU,ru;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  return selectorFn($, url, sourceName);
}

async function parseGastronom() {
  return fetchHtml(
    "https://www.gastronom.ru/",
    ($, baseUrl, source) => {
      const items = [];
      $("a").each((_, el) => {
        if (items.length >= 20) return;
        const href = $(el).attr("href");
        const text = $(el).text().trim();
        if (
          href &&
          text.length > 25 &&
          text.length < 150 &&
          /\/recipe\/|\/news\/|\/article\//.test(href)
        ) {
          const full = href.startsWith("http")
            ? href
            : "https://www.gastronom.ru" + href;
          if (!items.find((i) => i.link === full)) {
            items.push({
              title: text,
              link: full,
              description: "",
              date: new Date().toISOString(),
              source,
            });
          }
        }
      });
      return items;
    },
    "Гастрономъ"
  );
}

async function parseEda() {
  return fetchHtml(
    "https://eda.ru/",
    ($, baseUrl, source) => {
      const items = [];
      $("a").each((_, el) => {
        if (items.length >= 20) return;
        const href = $(el).attr("href");
        const text = $(el).text().trim();
        if (
          href &&
          text.length > 25 &&
          text.length < 150 &&
          /\/recipes\/|\/media\//.test(href)
        ) {
          const full = href.startsWith("http")
            ? href
            : "https://eda.ru" + href;
          if (!items.find((i) => i.link === full)) {
            items.push({
              title: text,
              link: full,
              description: "",
              date: new Date().toISOString(),
              source,
            });
          }
        }
      });
      return items;
    },
    "Eda.ru"
  );
}

// ================================

export default async function handler(req, res) {
  const category = (req.query.category || "main").toString();
  const feeds = SOURCES[category] || SOURCES.main;

  try {
    let tasks = feeds.map((url) => fetchRss(url));

    if (category === "food") {
      tasks.push(parseGastronom(), parseEda());
    }

    const results = await Promise.allSettled(tasks);

    let news = [];
    for (const r of results) {
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        news = news.concat(r.value);
      } else if (r.status === "rejected") {
        console.error("Источник упал:", r.reason?.message || r.reason);
      }
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
