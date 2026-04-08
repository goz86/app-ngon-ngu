import { englishCommonWordEntries } from '../datasets/englishCommonWords.js';
import { topikAdvancedWordEntries } from '../datasets/topikAdvancedWords.js';
import { enrichWordSchema } from './vocabularySchema';

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

function stableHash(value) {
  return [...String(value || '')].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function pickWindow(entries, count, seed) {
  if (!entries.length) return [];
  const safeCount = Math.min(entries.length, Math.max(1, count));
  const maxStart = Math.max(0, entries.length - safeCount);
  const start = maxStart > 0 ? seed % (maxStart + 1) : 0;
  return entries.slice(start, start + safeCount);
}

function koreanStem(term) {
  const text = String(term || '').trim();
  return text.endsWith('다') ? text.slice(0, -1) : text;
}

function buildKoreanExamples(term, meaning, pos) {
  const cleanPos = String(pos || '').toUpperCase();
  const stem = koreanStem(term);

  if (cleanPos === 'N') {
    return {
      examples: [
        `${term}의 중요성이 최근 더 크게 강조되고 있다.`,
        `현실적인 대안을 찾으려면 ${term}에 대한 이해가 필요하다.`,
      ],
      translations: [
        `Gần đây tầm quan trọng của "${meaning}" được nhấn mạnh hơn.`,
        `Muốn tìm phương án thực tế thì cần hiểu rõ "${meaning}".`,
      ],
    };
  }

  if (cleanPos === 'ADJ') {
    if (term.endsWith('하다')) {
      const root = term.slice(0, -2);
      return {
        examples: [
          `${root}한 태도가 오히려 더 좋은 평가를 받았다.`,
          `생활이 ${stem}면 불필요한 지출을 줄일 수 있다.`,
        ],
        translations: [
          `Thái độ "${meaning}" lại nhận được đánh giá tốt hơn.`,
          `Nếu cuộc sống "${meaning}" thì có thể giảm chi tiêu không cần thiết.`,
        ],
      };
    }

    return {
      examples: [
        `상황이 ${stem}면 신중하게 판단해야 한다.`,
        `그의 설명은 생각보다 ${stem} 보였다.`,
      ],
      translations: [
        `Nếu tình huống "${meaning}" thì cần phán đoán thận trọng.`,
        `Lời giải thích của anh ấy trông "${meaning}" hơn tôi nghĩ.`,
      ],
    };
  }

  if (cleanPos === 'V' || cleanPos === 'PHR') {
    return {
      examples: [
        `문제를 해결하려면 먼저 ${stem}야 한다.`,
        `현장을 정확히 ${stem}면 더 나은 판단이 가능하다.`,
      ],
      translations: [
        `Muốn giải quyết vấn đề thì trước hết phải "${meaning}".`,
        `Nếu "${meaning}" hiện trường một cách chính xác thì có thể đưa ra 판단 tốt hơn.`,
      ],
    };
  }

  return {
    examples: [
      `${term}은 실제 담화에서 자주 등장하는 표현이다.`,
      `이 개념을 이해하면 ${term}의 쓰임을 더 쉽게 파악할 수 있다.`,
    ],
    translations: [
      `"${term}" là cách diễn đạt xuất hiện thường xuyên trong ngữ cảnh thực tế.`,
      `Nếu hiểu khái niệm này thì sẽ nắm cách dùng "${term}" dễ hơn.`,
    ],
  };
}

function buildEnglishExamples(term, meaning, pos) {
  const cleanPos = String(pos || '').toUpperCase();

  if (cleanPos === 'N') {
    return {
      examples: [
        `This ${term} is part of my daily routine.`,
        `I need to understand this ${term} better.`,
      ],
      translations: [
        `Từ này minh họa "${meaning}" trong thói quen hằng ngày.`,
        `Tôi cần hiểu rõ hơn nghĩa "${meaning}".`,
      ],
    };
  }

  if (cleanPos === 'V') {
    return {
      examples: [
        `I often ${term} when I study English.`,
        `We should ${term} step by step.`,
      ],
      translations: [
        `Tôi thường "${meaning}" khi học tiếng Anh.`,
        `Chúng ta nên "${meaning}" từng bước.`,
      ],
    };
  }

  if (cleanPos === 'ADJ') {
    return {
      examples: [
        `The task looks ${term} for a beginner.`,
        `She felt ${term} after the lesson.`,
      ],
      translations: [
        `Bài tập trông "${meaning}" đối với người mới bắt đầu.`,
        `Cô ấy cảm thấy "${meaning}" sau buổi học.`,
      ],
    };
  }

  return {
    examples: [
      `I use "${term}" in simple conversations.`,
      `This word helps me say "${meaning}" more naturally.`,
    ],
    translations: [
      `Tôi dùng "${term}" trong các cuộc hội thoại đơn giản.`,
      `Từ này giúp tôi diễn đạt "${meaning}" tự nhiên hơn.`,
    ],
  };
}

export function buildLocalExamples({ term, meaning, pos, language }) {
  return language === 'ko' ? buildKoreanExamples(term, meaning, pos) : buildEnglishExamples(term, meaning, pos);
}

export function buildLocalVocabularySet({
  language = 'en',
  topic = '',
  count = 18,
  title = '',
  level = '',
  description = '',
}) {
  const source = language === 'ko' ? topikAdvancedWordEntries : englishCommonWordEntries.slice(0, 400);
  const defaults =
    language === 'ko'
      ? {
          title: 'Korean: TOPIK 5-6 Local Builder',
          topic: 'Xa hoi, thoi su, hoc thuat',
          level: 'TOPIK 5-6',
          description: 'Bo tu fallback noi bo danh cho TOPIK 5-6 khi AI tam thoi khong kha dung.',
        }
      : {
          title: 'English: Beginner Local Starter',
          topic: 'Everyday communication',
          level: 'Beginner (A1-A2)',
          description: 'Bo tu fallback noi bo danh cho nguoi moi bat dau khi AI tam thoi khong kha dung.',
        };

  const finalTopic = String(topic || defaults.topic).trim();
  const finalLevel = String(level || defaults.level).trim();
  const finalDescription = String(description || defaults.description).trim();
  const finalTitle = String(title || `${defaults.title} - ${finalTopic}`).trim();
  const safeCount = Math.min(30, Math.max(8, Number(count) || 18));
  const seed = stableHash(`${language}:${finalTopic}:${finalTitle}:${finalLevel}`);
  const entries = pickWindow(source, safeCount, seed);
  const idPrefix = `local_${Date.now()}`;

  return {
    title: finalTitle,
    language,
    topic: finalTopic,
    level: finalLevel,
    description: finalDescription,
    words: entries.map(([term, pos, meaning], index) => {
      const localExamples = buildLocalExamples({ term, meaning, pos, language });
      return enrichWordSchema(
        {
          term,
          pos,
          meaning,
          examples: normalizeList(localExamples.examples, 2),
          exampleTranslations: normalizeList(localExamples.translations, 2),
          tags: [language === 'ko' ? 'topik' : 'beginner', 'fallback'],
        },
        {
          language,
          idPrefix,
          index,
          topic: finalTopic,
          level: finalLevel,
        },
      );
    }),
  };
}
