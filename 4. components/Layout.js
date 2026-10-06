import Link from "next/link";
import { useRouter } from "next/router";

const TABS = [
  { href: "/", label: "Все Новости" },
  { href: "/main", label: "Главные Новости" },
  { href: "/sport", label: "Спорт" },
  { href: "/games", label: "Игры" },
  { href: "/food", label: "Еда" },
];

export default function Layout({ children, title }) {
  const router = useRouter();

  return (
    <div className="container">
      <header>
        <h1>🇷🇺 Новости России</h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={router.pathname === t.href ? "tab active" : "tab"}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>

      <main>
        <h2>{title}</h2>
        {children}
      </main>

      <footer>© {new Date().getFullYear()} Новости России — данные из открытых RSS-лент</footer>
    </div>
  );
}
