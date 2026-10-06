import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "Mozilla/5.0 NewsBot/1.0" },
});

// Общий пул RSS — из него фильтруем по ключевым словам
const POOL = [
  { url: "https://ria.ru/export/rss2/archive/index.xml", name: "РИА Новости" },
  { url: "https://tass.ru/rss/v2.xml", name: "ТАСС" },
  { url: "https://lenta.ru/rss/news", name: "Лента.ру" },
  { url: "https://www.sports.ru/rss/all_news.xml", name: "Sports.ru" },
  { url: "https://rsport.ria.ru/export/rss2/archive/index.xml", name: "РИА Спорт" },
  { url: "https://stopgame.ru/rss/rss_news.xml", name: "StopGame" },
  { url: "https://dtf.ru/rss/games", name: "DTF" },
  { url: "https://nplus1.ru/rss", name: "N+1" },
  { url: "https://habr.com/ru/rss/news/", name: "Хабр" },
  { url: "https://tjournal.ru/rss", name: "TJ" },
  { url: "https://motor.ru/rss/all.xml", name: "Motor.ru" },
  { url: "https://www.film.ru/rss/news", name: "Film.ru" },
];

// Ключевые слова для каждой вкладки
// Если массив пустой — берём всё (для "Все" и "Главные")
const FILTERS = {
  all: [],
  main: [
    "путин", "кремль", "госдума", "правительство", "украин",
    "спецоперац", "сво", "россия", "минобороны", "лавров",
    "санкц", "закон", "президент", "премьер",
  ],
  war: [
    "украин", "сво", "спецоперац", "минобороны", "фронт",
    "всу", "дрон", "бпла", "обстрел", "штурм", "наступлен",
    "мобилизац", "военн", "боец", "артиллер", "ракет",
    "курск", "донецк", "луганск", "запорож", "херсон", "белгород",
  ],
  sport: [
    "футбол", "матч", "олимпиад", "чемпионат", "гол",
    "хокке", "теннис", "бокс", "спорт", "тренер", "команд",
    "рпл", "кубок", "турнир", "атлет", "биатлон", "фигурн",
  ],
  games: [
    "игр", "игров", "релиз", "steam", "playstation", "xbox",
    "nintendo", "геймер", "гейминг", "геймплей", "мод",
    "киберспорт", "разработчик", "студи", "гта", "gta",
    "dota", "cs2", "counter-strike", "minecraft", "roblox",
  ],
  science: [
    "наук", "исследован", "учён", "учен", "открыт", "эксперимент",
    "космос", "nasa", "роскосмос", "марс", "луна", "телескоп",
    "археолог", "динозавр", "днк", "физик", "химик", "биолог",
    "климат", "экспедиц",
  ],
  tech: [
    "технолог", "смартфон", "iphone", "android", "google",
    "apple", "яндекс", "нейросет", "ии ", " ai ", "искусственн",
    "чип", "процессор", "гаджет", "интернет", "приложен",
    "софт", "программ", "разработ", "хакер", "утечк",
  ],
  auto: [
    "авто", "машин", "автомобил", "lada", "лада", "автоваз",
    "tesla", "электромобил", "двигател", "бензин", "шин",
    "дтп", "водител", "гибдд", "дорог", "кроссовер", "седан",
  ],
  cinema: [
    "фильм", "кино", "сериал", "актёр", "актер", "режиссёр",
    "режиссер", "премьер", "трейлер", "оскар", "нетфликс",
    "netflix", "боевик", "комеди", "драм", "прокат",
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

async function fetchFeed(source) {
  try {
    const feed = await parser.parseURL(source.url);
    return (feed.items || []).slice(0, 30).map((item) => ({
      title: item.title || "Без заголовка",
      link: item.link || "#",
      description: cleanText(
        item.contentSnippet || item.summary || item.content || ""
      ),
      image: extractImage(item),
      date: item.pubDate || item.isoDate || "",
      source: source.name,
    }));
  } catch (e) {
    console.error(`Упал ${source.name}:`, e.message);
    return [];
  }
}

function matches(text, keywords) {
  if (!keywords.length) return true;
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

export default async function handler(req, res) {
  const category = (req.query.category || "all").toString();
  const keywords = FILTERS[category] ?? [];

  try {
    // Параллельно тянем всё, что есть
    const results = await Promise.all(POOL.map((s) => fetchFeed(s)));

    let news = [];
    for (const arr of results) news = news.concat(arr);

    // Сортировка
    news.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    // Дедупликация ДО фильтрации
    const seen = new Set();
    news = news.filter((n) => {
      const key = n.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Фильтр по ключевым словам (для "Все Новости" — без фильтра)
    if (category !== "all") {
      news = news.filter((n) =>
        matches(n.title + " " + n.description, keywords)
      );
    }

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
