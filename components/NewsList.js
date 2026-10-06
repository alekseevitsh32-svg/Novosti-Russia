export default function NewsList({ news, loading, error }) {
  if (loading) return <p className="status">Загрузка новостей…</p>;
  if (error) return <p className="status error">Ошибка: {error}</p>;
  if (!news?.length) return <p className="status">Новостей пока нет.</p>;

  return (
    <div className="grid">
      {news.map((n, i) => (
        <article key={i} className="card">
          <div className="meta">
            <span className="source">{n.source}</span>
            {n.date && (
              <span className="date">
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
          <a className="read" href={n.link} target="_blank" rel="noopener noreferrer">
            Читать →
          </a>
        </article>
      ))}
    </div>
  );
}
