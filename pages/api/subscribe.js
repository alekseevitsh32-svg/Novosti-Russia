const NAMESPACE = "novosti-russia";
const COUNTER = "subscribers";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const action = req.query.down ? "down" : "up";

    // POST = подписка (up), GET = чтение, GET ?down=1 = отписка
    if (req.method === "POST" || req.query.down) {
      const r = await fetch(
        `https://api.counterapi.dev/v1/${NAMESPACE}/${COUNTER}/${action}`
      );
      const data = await r.json();
      return res.status(200).json({ count: data.count || 0 });
    }

    const r = await fetch(
      `https://api.counterapi.dev/v1/${NAMESPACE}/${COUNTER}/`
    );
    const data = await r.json();
    return res.status(200).json({ count: data.count || 0 });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ count: 0, error: true });
  }
}
