import { useEffect, useState } from "react";

const TABS = [
  { id: "all", label: "Все Новости" },
  { id: "main", label: "Главные Новости" },
  { id: "sport", label: "Спорт" },
  { id: "games", label: "Игры" },
  { id: "food", label: "Еда" },
];

export default function Home() {
  const [tab, setTab] = useState("all");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/news?category=${tab}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.error) throw new Error(d.error);
        setNews(d.news || []);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab]);

  return (
    <>
      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
          background: #0f1115;
          color: #e6e8eb;
          line-height: 1.5;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 {
          font-size: 28px;
          margin-bottom: 16px;
          background: linear-gradient(90deg, #fff, #8ba3c7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          border-bottom: 1px solid #232733;
          padding-bottom: 12px;
          margin-bottom: 24px;
        }
        .tab {
          padding: 8px 16px;
          border-radius: 8px;
          background: #1a1e28;
          color: #b8bfcc;
          border: none;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab:hover { background: #232733; color: #fff; }
        .tab.active { background: #3b82f6; color: #fff; }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        .card {
          background: #1a1e28;
          border: 1px solid #232733;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          transition: transform 0.15s, border-color 0.15s;
        }
        .card:hover { transform: translateY(-2px); border-color: #3b82f6; }
        .meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #8892a6;
          margin-bottom: 8px;
        }
        .source { font-weight: 600; color: #60a5fa; }
        .card h3 { font-size: 16px; margin-bottom: 8px; line-height: 1.35; }
        .card h3 a { color: #fff; text-decoration: none; }
        .card h3 a:hover { color: #60a5fa; }
        .card p { font-size: 14px; color: #b8bfcc; flex: 1; margin-bottom: 12px; }
        .read { color: #60a5fa; text-decoration: none; font-size: 14px; }
        .status { text-align: center; padding: 40px; color: #8892a6; }
        .status.error { color: #f87171; }
        footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #232733;
          text-align: center;
          font-size: 13px;
          color: #8892a6;
        }
      `}</style>

      <div className="container">
        <h1>🇷🇺 Новости России</h1>

        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "tab active" : "tab"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {loading && <p className="status">Загрузка новостей…</p>}
        {error && <p className="status error">Ошибка: {error}</p>}
        {!loading && !error && news.length === 0 && (
          <p className="status">Новостей пока нет.</p>
        )}

        {!loading && !error && news.length > 0 && (
          <div className="grid">
            {news.map((n, i) => (
              <article key={i} className="card">
                <div className="meta">
                  <span className="source">{n.source}</span>
                  {n.date && (
                    <span>
                      {new Date(n.date).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <h3>
                  <a href={n.link} target="_blank" rel="noopener noreferrer">
                    {n.title}
                  </a>
                </h3>
                {n.description && <p>{n.description}…</p>}
                <a
                  className="read"
                  href={n.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Читать →
                </a>
              </article>
            ))}
          </div>
        )}

        <footer>© {new Date().getFullYear()} Новости России</footer>
      </div>
    </>
  );
}
