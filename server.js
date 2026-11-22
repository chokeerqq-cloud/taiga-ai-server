const express = require('express');
const app = express();

// Обязательно: Render передает порт в process.env.PORT
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: '10mb' }));

// CORS для браузера
app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Проверка, что сервер живой
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Taiga proxy server is running' });
});

// Прокси для Groq
app.post('/proxy/groq', async (req, res) => {
    try {
        const { apiKey, model, messages, temperature, max_tokens } = req.body;
        if (!apiKey) return res.status(400).json({ error: 'apiKey is required' });

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model || 'openai/gpt-oss-120b',
                messages: messages,
                temperature: temperature ?? 0.7,
                max_tokens: max_tokens || 1024
            })
        });

        const data = await response.json();
        if (!response.ok) return res.status(response.status).json(data);
        res.json(data);
    } catch (err) {
        console.error('Groq error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Прокси для Claude
app.post('/proxy/claude', async (req, res) => {
    try {
        const { apiKey, model, max_tokens, system, messages } = req.body;
        if (!apiKey) return res.status(400).json({ error: 'apiKey is required' });

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model || 'claude-sonnet-4-20250514',
                max_tokens: max_tokens || 1024,
                system: system || '',
                messages: messages
            })
        });

        const data = await response.json();
        if (!response.ok) return res.status(response.status).json(data);
        res.json(data);
    } catch (err) {
        console.error('Claude error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Обязательно 0.0.0.0, иначе Render не сможет определить порт
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
