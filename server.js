
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.get("/", (req, res) => {
  res.json({
    name: "Taiga AI Server",
    status: "online",
    version: "1.0.0"
  });
});

app.post("/chat", async (req, res) => {
  try {
    if (!GROQ_API_KEY) {
      return res.status(500).json({
        error: "Server API key is not configured"
      });
    }

    const messages = req.body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Messages are required"
      });
    }

    if (messages.length > 40) {
      return res.status(400).json({
        error: "Too many messages"
      });
    }

    const safeMessages = messages.map(message => {
      if (
        !["system", "user", "assistant"].includes(message.role) ||
        typeof message.content !== "string"
      ) {
        throw new Error("Invalid message format");
      }

      return {
        role: message.role,
        content: message.content.slice(0, 12000)
      };
    });

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: safeMessages,
          temperature: 0.7,
          max_tokens: 900
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Groq API error"
      });
    }

    res.json({
      reply: data.choices?.[0]?.message?.content || ""
    });

  } catch (error) {
    console.error("Taiga server error:", error.message);

    res.status(500).json({
      error: "Internal server error"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Taiga AI server running on port ${PORT}`);
});
