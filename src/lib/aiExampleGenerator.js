const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
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

export function hasAiExampleGenerator() {
  return Boolean(GEMINI_API_KEY);
}

export function getAiExampleModel() {
  return GEMINI_MODEL;
}

export async function generateExamplesWithAI({ term, meaning, pos, language }) {
  if (!GEMINI_API_KEY) {
    throw new Error('missing_gemini_key');
  }

  const prompt =
    language === 'ko'
      ? [
          'Nhiệm vụ: tạo đúng 2 câu ví dụ BẰNG TIẾNG HÀN tự nhiên cho từ vựng sau.',
          'Không được dùng tiếng Trung, tiếng Anh hay romaja trong trường examples.',
          `Từ: ${term}`,
          `Nghĩa tiếng Việt: ${meaning}`,
          `Từ loại: ${pos || 'không rõ'}`,
          'Chỉ trả về JSON hợp lệ đúng cấu trúc: {"examples":["câu tiếng Hàn 1","câu tiếng Hàn 2"],"translations":["giải thích tiếng Việt 1","giải thích tiếng Việt 2"]}',
          'Mỗi phần tử trong examples phải là tiếng Hàn tự nhiên.',
          'Mỗi phần tử trong translations phải là tiếng Việt dễ hiểu, giải thích đúng câu ví dụ tương ứng.',
          'Không markdown. Không viết gì ngoài JSON.',
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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 600,
          responseMimeType: 'application/json',
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`gemini_${response.status}`);
  }

  const payload = await response.json();
  const text = stripCodeFence(extractGeminiText(payload));
  const parsed = JSON.parse(text);

  return {
    examples: normalizeStringList(parsed.examples),
    translations: normalizeStringList(parsed.translations),
  };
}
