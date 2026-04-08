import { callGeminiJson, ensureGeminiConfig, json } from './_lib/gemini.js';

function buildPrompt({ term, meaning, pos, language }) {
  if (language === 'ko') {
    return [
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
    ].join('\n');
  }

  return [
    'Create exactly 2 natural example sentences for this vocabulary word.',
    `Word: ${term}`,
    `Vietnamese meaning: ${meaning}`,
    `Part of speech: ${pos || 'unknown'}`,
    'Return strict JSON with this shape: {"examples":["...","..."],"translations":["...","..."]}',
    'Each item in "translations" must be a short Vietnamese explanation for the matching example sentence.',
    'Do not use markdown and do not write anything outside the JSON.',
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
    const prompt = buildPrompt({
      term: String(body.term || '').trim(),
      meaning: String(body.meaning || '').trim(),
      pos: String(body.pos || '').trim(),
      language: body.language === 'ko' ? 'ko' : 'en',
    });

    const result = await callGeminiJson({ prompt, maxOutputTokens: 600, temperature: 0.2 });
    return json(res, 200, result.parsed);
  } catch (error) {
    return json(res, 500, { error: String(error.message || error) });
  }
}
