import { enrichWordSchema } from './vocabularySchema';
import { buildLocalVocabularySet } from './localStudyFallback';

const CLIENT_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';

function stripCodeFence(text) {
  return String(text || '')
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

function extractGeminiText(payload) {
  return String(payload?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
}

function normalizeList(value, limit = 2) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, limit);
  }

  return String(value || '')
    .split(/\r?\n|[;|]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function getReadableGeminiError(status, payload) {
  const message = String(payload?.error?.message || '').trim();

  if (status === 400) return 'Yeu cau gui len Gemini chua hop le.';
  if (status === 403) return message || 'Gemini dang tu choi truy cap. Kiem tra API key, quota va API restrictions.';
  if (status === 404) return 'Model Gemini hien tai khong ton tai hoac khong kha dung.';
  if (status === 429) return 'Gemini dang gioi han muc goi. Hay doi it phut roi thu lai.';
  if (status >= 500) return 'May chu Gemini dang gap su co tam thoi. Hay thu lai sau.';
  return message || `Gemini loi ${status}`;
}

function getDefaultProfile(language) {
  if (language === 'ko') {
    return {
      title: 'Korean: TOPIK 5-6 Advanced Builder',
      topic: 'Xa hoi, thoi su, hoc thuat',
      level: 'TOPIK 5-6',
      description: 'Bo tu nang cao danh cho nguoi hoc TOPIK 5-6, uu tien tu hoc thuat, xa hoi, bao chi va van ban trang trong.',
      count: 16,
    };
  }

  return {
    title: 'English: Beginner Starter Pack',
    topic: 'Everyday communication',
    level: 'Beginner (A1-A2)',
    description: 'Bo tu co ban danh cho nguoi moi bat dau, uu tien tinh huong hang ngay va cau truc de ap dung ngay.',
    count: 18,
  };
}

function buildVocabularyPrompt({ language, topic, count, title, level, description }) {
  if (language === 'ko') {
    return [
      'Task: Create one Korean vocabulary set in strict JSON for an advanced learner.',
      'Target learner: Vietnamese learner at TOPIK level 5-6.',
      `Topic: ${topic}`,
      `Desired title: ${title}`,
      `Level label: ${level}`,
      `Description intent: ${description}`,
      `Word count: ${count}`,
      'Requirements:',
      '- Use advanced Korean vocabulary appropriate for TOPIK 5-6.',
      '- Prefer academic, social issues, current affairs, abstract and formal vocabulary.',
      '- Each word must include natural Korean example sentences.',
      '- meanings and exampleTranslations must be in Vietnamese.',
      '- Keep examples accurate and realistic.',
      '- Avoid duplicate words and avoid beginner vocabulary.',
      '- POS should be concise like N, V, Adj, Adv, Expr.',
      'Return strict JSON with this shape only:',
      '{"title":"","language":"ko","topic":"","level":"","description":"","words":[{"term":"","pos":"","meaning":"","examples":["",""],"exampleTranslations":["",""],"tags":["",""]}]}',
      'Do not use markdown. Do not include any text outside JSON.',
    ].join('\n');
  }

  return [
    'Task: Create one English vocabulary set in strict JSON for a beginner learner.',
    'Target learner: Vietnamese learner who is new to English.',
    `Topic: ${topic}`,
    `Desired title: ${title}`,
    `Level label: ${level}`,
    `Description intent: ${description}`,
    `Word count: ${count}`,
    'Requirements:',
    '- Use beginner-friendly vocabulary around daily life and common communication.',
    '- Keep meanings easy to understand in Vietnamese.',
    '- Each word must include 2 short natural English example sentences.',
    '- exampleTranslations must be Vietnamese explanations matching the examples.',
    '- Avoid obscure, advanced, academic, or rare vocabulary.',
    '- POS should be concise like N, V, Adj, Adv, Expr.',
    'Return strict JSON with this shape only:',
    '{"title":"","language":"en","topic":"","level":"","description":"","words":[{"term":"","pos":"","meaning":"","examples":["",""],"exampleTranslations":["",""],"tags":["",""]}]}',
    'Do not use markdown. Do not include any text outside JSON.',
  ].join('\n');
}

async function callServerStudyGenerator(payload) {
  const response = await fetch('/api/gemini-study', {
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

async function callClientGeminiDirect({ language, topic, count, title, level, description }) {
  if (!CLIENT_GEMINI_API_KEY) {
    throw new Error('missing_gemini_key');
  }

  const prompt = buildVocabularyPrompt({ language, topic, count, title, level, description });
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
          temperature: 0.5,
          maxOutputTokens: 4096,
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

export function hasAiStudyGenerator() {
  return true;
}

export function getAiStudyDefaults(language = 'en') {
  return getDefaultProfile(language);
}

export async function generateVocabularySetWithAI({
  language = 'en',
  topic,
  count,
  title,
  level,
  description,
}) {
  const defaults = getDefaultProfile(language);
  const finalTopic = String(topic || defaults.topic).trim();
  const finalCount = Math.min(30, Math.max(8, Number(count) || defaults.count));
  const finalLevel = String(level || defaults.level).trim();
  const finalTitle = String(title || `${defaults.title} - ${finalTopic}`).trim();
  const finalDescription = String(description || defaults.description).trim();
  const requestPayload = {
    language,
    topic: finalTopic,
    count: finalCount,
    title: finalTitle,
    level: finalLevel,
    description: finalDescription,
  };

  let parsed = null;
  try {
    parsed = await callServerStudyGenerator(requestPayload);
  } catch (error) {
    try {
      if (!CLIENT_GEMINI_API_KEY) {
        throw error;
      }
      parsed = await callClientGeminiDirect(requestPayload);
    } catch {
      return buildLocalVocabularySet(requestPayload);
    }
  }

  const words = Array.isArray(parsed?.words) ? parsed.words : [];
  const idPrefix = `ai_${Date.now()}`;

  return {
    title: String(parsed?.title || finalTitle).trim(),
    language,
    topic: String(parsed?.topic || finalTopic).trim(),
    level: String(parsed?.level || finalLevel).trim(),
    description: String(parsed?.description || finalDescription).trim(),
    words: words
      .map((word, index) =>
        enrichWordSchema(
          {
            ...word,
            examples: normalizeList(word?.examples, 2),
            exampleTranslations: normalizeList(word?.exampleTranslations, 2),
            tags: normalizeList(word?.tags, 4),
          },
          {
            language,
            idPrefix,
            index,
            topic: parsed?.topic || finalTopic,
            level: parsed?.level || finalLevel,
          },
        ),
      )
      .filter((word) => word.term && word.meaning),
  };
}
