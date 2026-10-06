import Layout from "../components/Layout";
import NewsList from "../components/NewsList";
import useNews from "../lib/useNews";

export default function Sport() {
  const { news, loading, error } = useNews("sport");
  return (
    <Layout title="Спорт">
      <NewsList news={news} loading={loading} error={error} />
    </Layout>
  );
}
