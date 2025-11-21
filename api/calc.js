import fetch from "node-fetch";
import products from "../../products.json" assert { type: "json" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { prompt } = req.body;

    // Генерим токен
    const auth = Buffer.from(
      `${process.env.GIGACHAT_CLIENT_ID}:${process.env.GIGACHAT_CLIENT_SECRET}`
    ).toString("base64");

    const tokenReq = await fetch(
      "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "RqUID": crypto.randomUUID()
        },
        body: "scope=GIGACHAT_API_PERS"
      }
    );

    if (!tokenReq.ok) {
      const errText = await tokenReq.text();
      console.log("Ошибка токена:", errText);
      return res.status(500).json({ error: "Ошибка токена", details: errText });
    }

    const tokenData = await tokenReq.json();
    const token = tokenData.access_token;

    // Отправляем запрос в GigaChat
    const reply = await fetch(
      "https://gigachat.devices.sberbank.ru/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          model: "GigaChat",
          messages: [
            {
              role: "system",
              content: `Ты бот. Вот список товаров: ${JSON.stringify(products)}`
            },
            { role: "user", content: prompt }
          ]
        })
      }
    );

    const data = await reply.json();
    res.status(200).json(data);

  } catch (e) {
    console.error("SERVER ERROR:", e);
    res.status(500).json({ error: e.message });
  }
}
