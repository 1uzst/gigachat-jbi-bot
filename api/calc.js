import fetch from "node-fetch";
import path from "path";
import { promises as fs } from "fs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { prompt } = req.body;

    // Загружаем products.json
    const productsPath = path.join(process.cwd(), "products.json");
    const products = JSON.parse(await fs.readFile(productsPath, "utf8"));

    // Получаем токен GigaChat из переменных окружения
    const apiToken = process.env.GIGACHAT_API_TOKEN;

    if (!apiToken) {
      return res.status(500).json({ error: "API Token is missing" });
    }

    // Запрос в GigaChat API
    const reply = await fetch("https://gigachat.devices.sberbank.ru/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiToken}` // Используем API Token для авторизации
      },
      body: JSON.stringify({
        model: "GigaChat",
        messages: [
          { role: "system", content: `Ты бот. Вот список товаров: ${JSON.stringify(products)}` },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await reply.json();
    res.status(200).json(data);

  } catch (e) {
    console.error("SERVER ERROR:", e);
    res.status(500).json({ error: e.message });
  }
}
