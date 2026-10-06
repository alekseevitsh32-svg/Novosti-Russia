import Layout from "../components/Layout";
import NewsList from "../components/NewsList";
import useNews from "../lib/useNews";

export default function Games() {
  const { news, loading, error } = useNews("games");
  return (
    <Layout title="Игры">
      <NewsList news={news} loading={loading} error={error} />
    </Layout>
  );
}
