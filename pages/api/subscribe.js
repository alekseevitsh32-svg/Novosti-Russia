// Бесплатный глобальный счётчик через counterapi.dev
// Документация: https://counterapi.dev
const NAMESPACE = "novosti-russia";
const COUNTER = "subscribers";

export default async function handler(req, res) {
  // CORS, чтобы работало с любого домена
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    if (req.method === "POST") {
      // Увеличить счётчик
      const r = await fetch(
        `https://api.counterapi.dev/v1/${NAMESPACE}/${COUNTER}/up`,
        { method: "GET" } // counterapi делает up через GET
      );
      const data = await r.json();
      return res.status(200).json({ count: data.count || 0 });
    }

    // GET — просто прочитать текущее значение
    const r = await fetch(
      `https://api.counterapi.dev/v1/${NAMESPACE}/${COUNTER}/`
    );
    const data = await r.json();
    return res.status(200).json({ count: data.count || 0 });
  } catch (err) {
    console.error(err);
    // Если counterapi недоступен — вернём заглушку, чтобы фронт не падал
    return res.status(200).json({ count: 0, error: true });
  }
}
