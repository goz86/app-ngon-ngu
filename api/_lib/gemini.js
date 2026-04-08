const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || process.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';

function stripCodeFence(text) {
  return String(text || '')
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

function extractGeminiText(payload) {
  return String(payload?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
}

function getReadableGeminiError(status, payload) {
  const message = String(payload?.error?.message || '').trim();

  if (status === 400) return 'Yeu cau gui len Gemini chua hop le.';
  if (status === 403) return message || 'Gemini dang tu choi truy cap. Hay kiem tra key, quota va API restrictions.';
  if (status === 404) return 'Model Gemini hien tai khong ton tai hoac khong kha dung.';
  if (status === 429) return 'Gemini dang gioi han muc goi. Hay doi it phut roi thu lai.';
  if (status >= 500) return 'May chu Gemini dang gap su co tam thoi. Hay thu lai sau.';
  return message || `Gemini loi ${status}`;
}

export function ensureGeminiConfig() {
  if (!GEMINI_API_KEY) {
    throw new Error('missing_server_gemini_key');
  }

  return {
    apiKey: GEMINI_API_KEY,
    model: GEMINI_MODEL,
  };
}

export async function callGeminiJson({ prompt, maxOutputTokens = 2048, temperature = 0.4 }) {
  const { apiKey, model } = ensureGeminiConfig();
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseMimeType: 'application/json',
        },
      }),
    },
  );

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    throw new Error(getReadableGeminiError(response.status, payload));
  }

  const payload = await response.json();
  const text = stripCodeFence(extractGeminiText(payload));
  return {
    model,
    payload,
    text,
    parsed: JSON.parse(text),
  };
}

export function json(res, status, data) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(data));
}
