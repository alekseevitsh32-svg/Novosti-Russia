import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "Mozilla/5.0 NewsBot/1.0" },
});

// RSS-источники по категориям
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
    "https://www.gastronom.ru/rss.xml",
    "https://eda.ru/rss",
  ],
  all: [
    "https://ria.ru/export/rss2/archive/index.xml",
    "https://tass.ru/rss/v2.xml",
    "https://lenta.ru/rss/news",
    "https://www.sports.ru/rss/all_news.xml",
    "https://stopgame.ru/rss/rss_news.xml",
  ],
};

// Простая очистка HTML из описания
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

export default async function handler(req, res) {
  const category = (req.query.category || "main").toString();
  const feeds = SOURCES[category] || SOURCES.main;

  try {
    const results = await Promise.allSettled(
      feeds.map(async (url) => {
        const feed = await parser.parseURL(url);
        return (feed.items || []).slice(0, 15).map((item) => ({
          title: item.title || "Без заголовка",
          link: item.link || "#",
          description: cleanText(item.contentSnippet || item.content || item.summary),
          date: item.pubDate || item.isoDate || "",
          source: feed.title || new URL(url).hostname,
        }));
      })
    );

    let news = [];
    for (const r of results) {
      if (r.status === "fulfilled") news = news.concat(r.value);
    }

    // Сортировка по дате (свежие сверху)
    news.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    // Убираем дубликаты по заголовку
    const seen = new Set();
    news = news.filter((n) => {
      const key = n.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json({ category, count: news.length, news: news.slice(0, 40) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка загрузки новостей", details: String(err) });
  }
}
