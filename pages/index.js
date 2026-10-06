import { useEffect, useState } from "react";

const TABS = [
  { id: "all", label: "Все Новости" },
  { id: "main", label: "Главные" },
  { id: "war", label: "Война" },
  { id: "sport", label: "Спорт" },
  { id: "games", label: "Игры" },
  { id: "science", label: "Наука" },
  { id: "tech", label: "Технологии" },
  { id: "auto", label: "Авто" },
  { id: "cinema", label: "Кино" },
];

const PLACEHOLDER =
  "https://placehold.co/600x300/1a1e28/3b82f6?text=%D0%9D%D0%BE%D0%B2%D0%BE%D1%81%D1%82%D0%B8";

export default function Home() {
  const [tab, setTab] = useState("all");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // === ПОДПИСКИ ===
  const [subscribers, setSubscribers] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [subBusy, setSubBusy] = useState(false);

  // Загрузка новостей
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

  // Загрузка счётчика подписок
  useEffect(() => {
    // локально помним, подписан ли этот пользователь
    const isSub = localStorage.getItem("subscribed") === "1";
    setSubscribed(isSub);

    fetch("/api/subscribe")
      .then((r) => r.json())
      .then((d) => setSubscribers(d.count || 0))
      .catch(() => {});
  }, []);

  const handleSubscribe = async () => {
    if (subBusy) return;

    if (subscribed) {
      // Отписка — уменьшаем счётчик
      setSubBusy(true);
      try {
        // counterapi умеет /down
        const r = await fetch("/api/subscribe", { method: "POST" }); // на всякий
        // ниже — отдельный запрос down
        const d = await fetch("/api/subscribe?down=1").then((x) => x.json());
        setSubscribers(d.count || 0);
      } catch {}
      localStorage.removeItem("subscribed");
      setSubscribed(false);
      setSubBusy(false);
      return;
    }

    // Подписка
    setSubBusy(true);
    try {
      const r = await fetch("/api/subscribe", { method: "POST" });
      const d = await r.json();
      setSubscribers(d.count || 0);
      localStorage.setItem("subscribed", "1");
      setSubscribed(true);
    } catch {}
    setSubBusy(false);
  };

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
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
        }
        h1 {
          font-size: 28px;
          background: linear-gradient(90deg, #fff, #8ba3c7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .sub-block {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .sub-count {
          font-size: 13px;
          color: #8892a6;
        }
        .sub-count b { color: #60a5fa; font-size: 15px; }
        .btn-sub {
          padding: 10px 18px;
          border-radius: 10px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          background: #3b82f6;
          color: #fff;
        }
        .btn-sub:hover { background: #2563eb; }
        .btn-sub.subscribed {
          background: #1a1e28;
          color: #60a5fa;
          border: 1px solid #3b82f6;
        }
        .btn-sub:disabled { opacity: 0.6; cursor: wait; }
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
        .tab.war.active { background: #dc2626; }
        .tab.war:hover { background: #7f1d1d; color: #fff; }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        .card {
          background: #1a1e28;
          border: 1px solid #232733;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.15s, border-color 0.15s;
        }
        .card:hover { transform: translateY(-2px); border-color: #3b82f6; }
        .card-img {
          width: 100%;
          height: 180px;
          object-fit: cover;
          background: #232733;
          display: block;
        }
        .card-body { padding: 16px; display: flex; flex-direction: column; flex: 1; }
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
        .card-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-top: auto;
        }
        .read { color: #60a5fa; text-decoration: none; font-size: 14px; }
        .btn-sub-small {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #2a3040;
          background: #12151d;
          color: #b8bfcc;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-sub-small:hover { border-color: #3b82f6; color: #60a5fa; }
        .btn-sub-small.done {
          color: #60a5fa;
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }
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
        <div className="header-top">
          <h1>🇷🇺 Новости России</h1>

          <div className="sub-block">
            <span className="sub-count">
              На нас подписаны: <b>{subscribers}</b>
            </span>
            <button
              className={subscribed ? "btn-sub subscribed" : "btn-sub"}
              onClick={handleSubscribe}
              disabled={subBusy}
            >
              {subscribed ? "✓ Вы подписаны" : "Подписаться"}
            </button>
          </div>
        </div>

        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={
                (tab === t.id ? "tab active" : "tab") +
                (t.id === "war" ? " war" : "")
              }
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
            {news.map((n, i) => {
              // у каждой новости свой ключ подписки в localStorage
              const key = "sub_" + (n.link || n.title).slice(0, 80);
              const isSubbed =
                typeof window !== "undefined" &&
                localStorage.getItem(key) === "1";

              return (
                <article key={i} className="card">
                  <img
                    className="card-img"
                    src={n.image || PLACEHOLDER}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      if (e.currentTarget.src !== PLACEHOLDER) {
                        e.currentTarget.src = PLACEHOLDER;
                      }
                    }}
                  />
                  <div className="card-body">
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
                      <a
                        href={n.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {n.title}
                      </a>
                    </h3>
                    {n.description && <p>{n.description}…</p>}

                    <div className="card-actions">
                      <a
                        className="read"
                        href={n.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Читать →
                      </a>
                      <SubscribeButton storageKey={key} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <footer>© {new Date().getFullYear()} Новости России</footer>
      </div>
    </>
  );
}

// Отдельный компонент для подписки на конкретную новость
function SubscribeButton({ storageKey }) {
  const [isSubbed, setIsSubbed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(storageKey) === "1") setIsSubbed(true);
  }, [storageKey]);

  const toggle = () => {
    if (isSubbed) {
      localStorage.removeItem(storageKey);
      setIsSubbed(false);
    } else {
      localStorage.setItem(storageKey, "1");
      setIsSubbed(true);
    }
  };

  return (
    <button
      className={isSubbed ? "btn-sub-small done" : "btn-sub-small"}
      onClick={toggle}
    >
      {isSubbed ? "✓ Подписан" : "🔔 Подписаться"}
    </button>
  );
}
