app.post("/chat", async (req, res) => {
  const { message, image, history } = req.body;

  const userContent = [];
  if (message) userContent.push({ type: "text", text: message });
  if (image) userContent.push({
    type: "image_url",
    image_url: { url: "data:image/jpeg;base64," + image }
  });

  const messages = [
    { role: "system", content: "Ты Тайга Айсака, отвечай по-русски." },
    ...(history || []).map(h => ({ role: h.role, content: h.content })),
    { role: "user", content: image ? userContent : (message || "") }
  ];

  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.GROQ_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "qwen/qwen3.8-27b",   // модель со зрением
      messages: messages
    })
  });
  const data = await r.json();
  res.json({ reply: data.choices?.[0]?.message?.content || "" });
});
