import Layout from "../components/Layout";
import NewsList from "../components/NewsList";
import useNews from "../lib/useNews";

export default function Home() {
  const { news, loading, error } = useNews("all");
  return (
    <Layout title="Все Новости">
      <NewsList news={news} loading={loading} error={error} />
    </Layout>
  );
}
