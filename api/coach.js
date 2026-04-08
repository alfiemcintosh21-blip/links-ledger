// api/coach.js — Vercel serverless function
// Handles text chat AND image analysis (scorecard scanner)
// Supports system prompts for Coach Foxy persona

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in Vercel environment variables' });
  }

  try {
    const { messages, max_tokens, system } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const body = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: max_tokens || 500,
      messages,
    };

    // Add system prompt if provided (used for Coach Foxy persona + player stats)
    if (system) {
      body.system = system;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic error:', data);
      return res.status(response.status).json({ 
        error: data.error?.message || 'Anthropic API error',
        type: data.error?.type 
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('Coach API error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
}
