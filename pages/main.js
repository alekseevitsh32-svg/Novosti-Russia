import Layout from "../components/Layout";
import NewsList from "../components/NewsList";
import useNews from "../lib/useNews";

export default function Main() {
  const { news, loading, error } = useNews("main");
  return (
    <Layout title="Главные Новости">
      <NewsList news={news} loading={loading} error={error} />
    </Layout>
  );
}
