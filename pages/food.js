import Layout from "../components/Layout";
import NewsList from "../components/NewsList";
import useNews from "../lib/useNews";

export default function Food() {
  const { news, loading, error } = useNews("food");
  return (
    <Layout title="Еда">
      <NewsList news={news} loading={loading} error={error} />
    </Layout>
  );
}
