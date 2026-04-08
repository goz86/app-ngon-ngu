import { buildLocalExamples } from './localStudyFallback';

const CLIENT_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';

function stripCodeFence(text) {
  return String(text || '')
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 2);
}

function extractGeminiText(payload) {
  return String(payload?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
}

function getReadableGeminiError(status, payload) {
  const message = String(payload?.error?.message || '').trim();
  if (status === 403) return message || 'Gemini dang tu choi truy cap. Kiem tra API key, quota va API restrictions.';
  if (status === 404) return 'Model Gemini hien tai khong ton tai hoac khong kha dung.';
  if (status === 429) return 'Gemini dang gioi han muc goi. Hay doi it phut roi thu lai.';
  if (status >= 500) return 'May chu Gemini dang gap su co tam thoi. Hay thu lai sau.';
  return message || `Gemini loi ${status}`;
}

function buildPrompt({ term, meaning, pos, language }) {
  return language === 'ko'
    ? [
        'Task: create exactly 2 natural Korean example sentences for the vocabulary item below.',
        'Do not use English, Chinese, or romaja in the examples field.',
        `Word: ${term}`,
        `Vietnamese meaning: ${meaning}`,
        `Part of speech: ${pos || 'unknown'}`,
        'Return strict JSON only with this shape:',
        '{"examples":["korean sentence 1","korean sentence 2"],"translations":["vietnamese explanation 1","vietnamese explanation 2"]}',
        'Each example must be natural Korean.',
        'Each translation must be a clear Vietnamese explanation for the matching example.',
        'Do not use markdown. Do not write anything outside the JSON.',
      ].join('\n')
    : [
        'Create exactly 2 natural example sentences for this vocabulary word.',
        `Word: ${term}`,
        `Vietnamese meaning: ${meaning}`,
        `Part of speech: ${pos || 'unknown'}`,
        'Return strict JSON with this shape: {"examples":["...","..."],"translations":["...","..."]}',
        'Each item in "translations" must be a short Vietnamese explanation for the matching example sentence.',
        'Do not use markdown and do not write anything outside the JSON.',
      ].join('\n');
}

async function callServerExamples(payload) {
  const response = await fetch('/api/gemini-examples', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    throw new Error(String(data?.error || `server_${response.status}`));
  }

  return response.json();
}

async function callClientGeminiDirect({ term, meaning, pos, language }) {
  if (!CLIENT_GEMINI_API_KEY) {
    throw new Error('missing_gemini_key');
  }

  const prompt = buildPrompt({ term, meaning, pos, language });
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(CLIENT_GEMINI_API_KEY)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 600,
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
  return JSON.parse(text);
}

export function hasAiExampleGenerator() {
  return true;
}

export function getAiExampleModel() {
  return GEMINI_MODEL;
}

export async function generateExamplesWithAI({ term, meaning, pos, language }) {
  const requestPayload = { term, meaning, pos, language };

  let parsed = null;
  try {
    parsed = await callServerExamples(requestPayload);
  } catch (error) {
    try {
      if (!CLIENT_GEMINI_API_KEY) {
        throw error;
      }
      parsed = await callClientGeminiDirect(requestPayload);
    } catch {
      const fallback = buildLocalExamples({ term, meaning, pos, language });
      return {
        examples: normalizeStringList(fallback.examples),
        translations: normalizeStringList(fallback.translations),
      };
    }
  }

  return {
    examples: normalizeStringList(parsed.examples),
    translations: normalizeStringList(parsed.translations),
  };
}
