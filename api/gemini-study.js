import { callGeminiJson, ensureGeminiConfig, json } from './_lib/gemini.js';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'method_not_allowed' });
  }

  try {
    ensureGeminiConfig();
  } catch (error) {
    return json(res, 500, { error: String(error.message || error) });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const language = body.language === 'ko' ? 'ko' : 'en';
    const topic = String(body.topic || '').trim();
    const title = String(body.title || '').trim();
    const level = String(body.level || '').trim();
    const description = String(body.description || '').trim();
    const count = Math.min(30, Math.max(8, Number(body.count) || (language === 'ko' ? 16 : 18)));
    const prompt = buildVocabularyPrompt({ language, topic, count, title, level, description });
    const result = await callGeminiJson({ prompt, maxOutputTokens: 4096, temperature: 0.5 });

    return json(res, 200, result.parsed);
  } catch (error) {
    return json(res, 500, { error: String(error.message || error) });
  }
}
