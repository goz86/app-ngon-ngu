function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  return String(value || '')
    .split(/\r?\n|[;|,/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugifyValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pickFirst(row, keys, fallback = '') {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && String(row[key]).trim()) {
      return row[key];
    }
  }
  return fallback;
}

export function buildWordFingerprint(word, language = 'en') {
  const term = slugifyValue(word.term);
  const meaning = slugifyValue(word.meaning);
  const pos = slugifyValue(word.pos || '');
  return `${language}:${term}:${meaning}:${pos}`;
}

export function enrichWordSchema(word, { language = 'en', idPrefix = 'word', index = 0, topic = '', level = '' } = {}) {
  const examples = normalizeList(word.examples || word.example).slice(0, 2);
  const exampleTranslations = normalizeList(word.exampleTranslations || word.example_translations).slice(0, 2);
  const tags = normalizeList(word.tags);
  const collocations = normalizeList(word.collocations);
  const synonyms = normalizeList(word.synonyms);
  const antonyms = normalizeList(word.antonyms);

  return {
    id: word.id || `${idPrefix}_${index + 1}`,
    term: String(word.term || '').trim(),
    meaning: String(word.meaning || '').trim(),
    pos: String(word.pos || 'N').trim(),
    language,
    status: word.status || 'Từ mới',
    examples,
    example: examples[0] || '',
    exampleTranslations,
    topic: String(word.topic || topic || '').trim(),
    level: String(word.level || level || '').trim(),
    family: String(word.family || '').trim(),
    notes: String(word.notes || '').trim(),
    tags,
    collocations,
    synonyms,
    antonyms,
  };
}

export function dedupeWords(words, language = 'en') {
  const seen = new Map();
  const duplicates = [];

  for (const word of words) {
    const fingerprint = buildWordFingerprint(word, language);
    if (!word.term || !word.meaning) continue;

    if (!seen.has(fingerprint)) {
      seen.set(fingerprint, word);
      continue;
    }

    const existing = seen.get(fingerprint);
    seen.set(fingerprint, {
      ...existing,
      examples: [...new Set([...(existing.examples || []), ...(word.examples || [])])].slice(0, 2),
      exampleTranslations: [...new Set([...(existing.exampleTranslations || []), ...(word.exampleTranslations || [])])].slice(0, 2),
      tags: [...new Set([...(existing.tags || []), ...(word.tags || [])])],
      collocations: [...new Set([...(existing.collocations || []), ...(word.collocations || [])])],
      synonyms: [...new Set([...(existing.synonyms || []), ...(word.synonyms || [])])],
      antonyms: [...new Set([...(existing.antonyms || []), ...(word.antonyms || [])])],
      family: existing.family || word.family || '',
      notes: existing.notes || word.notes || '',
      topic: existing.topic || word.topic || '',
      level: existing.level || word.level || '',
    });
    duplicates.push(word);
  }

  return {
    words: [...seen.values()],
    duplicateCount: duplicates.length,
  };
}

export function parseManualWordRows(text, { language = 'en', idPrefix = 'cw', defaultTopic = '', defaultLevel = '' } = {}) {
  const rows = String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [
        term = '',
        pos = 'N',
        meaning = '',
        examples = '',
        exampleTranslations = '',
        level = '',
        topic = '',
        tags = '',
      ] = line.split('|').map((item) => item.trim());

      return {
        term,
        pos,
        meaning,
        examples,
        exampleTranslations,
        level,
        topic,
        tags,
      };
    })
    .map((word, index) =>
      enrichWordSchema(word, {
        language,
        idPrefix,
        index,
        topic: defaultTopic,
        level: defaultLevel,
      }),
    );

  return dedupeWords(rows, language);
}

export function parseImportedSpreadsheetRows(rows, { language = 'en', idPrefix = 'cw', defaultTopic = '', defaultLevel = '' } = {}) {
  const parsedWords = (rows || [])
    .map((row) => ({
      term: pickFirst(row, ['Term', 'term', 'Word', 'word', 'Vocabulary', 'vocabulary', 'Hangul', 'hangul']),
      pos: pickFirst(row, ['POS', 'pos', 'PartOfSpeech', 'part_of_speech', 'Part of Speech'], 'N'),
      meaning: pickFirst(row, ['Meaning', 'meaning', 'Translation', 'translation', 'Vietnamese', 'vietnamese']),
      examples: pickFirst(row, ['Examples', 'examples', 'Example', 'example']),
      exampleTranslations: pickFirst(row, ['ExampleTranslations', 'exampleTranslations', 'example_translations', 'Example Translation']),
      topic: pickFirst(row, ['Topic', 'topic'], defaultTopic),
      level: pickFirst(row, ['Level', 'level'], defaultLevel),
      tags: pickFirst(row, ['Tags', 'tags']),
      family: pickFirst(row, ['Family', 'family']),
      notes: pickFirst(row, ['Notes', 'notes']),
      collocations: pickFirst(row, ['Collocations', 'collocations']),
      synonyms: pickFirst(row, ['Synonyms', 'synonyms']),
      antonyms: pickFirst(row, ['Antonyms', 'antonyms']),
    }))
    .map((word, index) =>
      enrichWordSchema(word, {
        language,
        idPrefix,
        index,
        topic: defaultTopic,
        level: defaultLevel,
      }),
    );

  return dedupeWords(parsedWords, language);
}
