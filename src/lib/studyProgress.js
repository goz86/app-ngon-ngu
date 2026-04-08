const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_STATUS = 'Từ mới';

export const DEFAULT_PROGRESS = {
  masteryLevel: 0,
  easeFactor: 2.5,
  intervalDays: 0,
  reviewCount: 0,
  correctCount: 0,
  incorrectCount: 0,
  streakCount: 0,
  lastResult: 'new',
  lastReviewedAt: null,
  nextReviewAt: null,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function takeUnique(words, limit = Infinity) {
  const seen = new Set();
  const result = [];

  for (const word of words) {
    if (!word?.id || seen.has(word.id)) continue;
    seen.add(word.id);
    result.push(word);
    if (result.length >= limit) break;
  }

  return result;
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getReviewUrgency(word, now = new Date()) {
  const normalized = normalizeWord(word);
  const nextReviewAt = toDate(normalized.nextReviewAt);
  if (!nextReviewAt) return normalized.reviewCount > 0 ? 2 : 0;

  const diffHours = Math.round((now.getTime() - nextReviewAt.getTime()) / (60 * 60 * 1000));
  if (diffHours >= 72) return 6;
  if (diffHours >= 24) return 5;
  if (diffHours >= 0) return 4;
  if (diffHours >= -12) return 3;
  return 1;
}

function getHardScore(word, now = new Date()) {
  const normalized = normalizeWord(word);
  const reviewUrgency = getReviewUrgency(normalized, now);

  return (
    normalized.incorrectCount * 3 +
    (normalized.lastResult === 'unknown' ? 4 : 0) +
    (normalized.easeFactor <= 2 ? 4 : normalized.easeFactor <= 2.2 ? 2 : 0) +
    (normalized.streakCount === 0 && normalized.reviewCount > 0 ? 1 : 0) +
    reviewUrgency
  );
}

function compareByPriority(left, right, now = new Date()) {
  return (
    getHardScore(right, now) - getHardScore(left, now) ||
    getReviewUrgency(right, now) - getReviewUrgency(left, now) ||
    left.masteryLevel - right.masteryLevel ||
    right.reviewCount - left.reviewCount
  );
}

export function normalizeWord(word) {
  const merged = {
    ...word,
    ...DEFAULT_PROGRESS,
    ...Object.fromEntries(
      Object.keys(DEFAULT_PROGRESS).map((key) => [key, word?.[key] ?? DEFAULT_PROGRESS[key]]),
    ),
  };

  return {
    ...merged,
    status: merged.status || DEFAULT_STATUS,
    masteryLevel: Number(merged.masteryLevel || 0),
    easeFactor: Number(merged.easeFactor || 2.5),
    intervalDays: Number(merged.intervalDays || 0),
    reviewCount: Number(merged.reviewCount || 0),
    correctCount: Number(merged.correctCount || 0),
    incorrectCount: Number(merged.incorrectCount || 0),
    streakCount: Number(merged.streakCount || 0),
    lastReviewedAt: merged.lastReviewedAt || null,
    nextReviewAt: merged.nextReviewAt || null,
  };
}

export function hydrateSets(sets, progressMap = {}) {
  return sets.map((set) => ({
    ...set,
    words: set.words.map((word) => {
      const normalized = normalizeWord(word);
      const remote = progressMap[word.id];
      return remote ? normalizeWord({ ...normalized, ...remote }) : normalized;
    }),
  }));
}

export function isWordDueToday(word, now = new Date()) {
  const normalized = normalizeWord(word);
  if (!normalized.nextReviewAt) {
    return normalized.reviewCount > 0 && normalized.masteryLevel < 5;
  }

  return new Date(normalized.nextReviewAt) <= now;
}

export function isWordHard(word, now = new Date()) {
  const normalized = normalizeWord(word);
  return (
    normalized.incorrectCount >= 2 ||
    (normalized.reviewCount >= 3 && normalized.correctCount <= normalized.incorrectCount) ||
    (normalized.reviewCount >= 2 && normalized.lastResult === 'unknown') ||
    (normalized.reviewCount > 0 && normalized.easeFactor <= 2.1) ||
    (normalized.masteryLevel <= 1 && isWordDueToday(normalized, now))
  );
}

export function getWordStage(word, now = new Date()) {
  const normalized = normalizeWord(word);
  const due = isWordDueToday(normalized, now);

  if (normalized.masteryLevel >= 5) return 'mastered';
  if (due && normalized.reviewCount > 0) return 'due';
  if (normalized.masteryLevel >= 3) return 'strong';
  if (normalized.reviewCount > 0 || normalized.masteryLevel > 0) return 'learning';
  return 'new';
}

export function getWordStatusLabel(word, now = new Date()) {
  switch (getWordStage(word, now)) {
    case 'mastered':
      return 'Thành thạo';
    case 'strong':
      return 'Đã nhớ';
    case 'due':
      return 'Cần ôn';
    case 'learning':
      return 'Đang học';
    default:
      return 'Từ mới';
  }
}

export function formatReviewDateLabel(nextReviewAt, now = new Date()) {
  const reviewDate = toDate(nextReviewAt);
  if (!reviewDate) return 'Chưa lên lịch';

  if (reviewDate <= now) return 'Đến hạn ôn';

  const sameDay =
    reviewDate.getFullYear() === now.getFullYear() &&
    reviewDate.getMonth() === now.getMonth() &&
    reviewDate.getDate() === now.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    reviewDate.getFullYear() === tomorrow.getFullYear() &&
    reviewDate.getMonth() === tomorrow.getMonth() &&
    reviewDate.getDate() === tomorrow.getDate();

  if (sameDay) {
    return `Hôm nay, ${reviewDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (isTomorrow) {
    return `Ngày mai, ${reviewDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return reviewDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getNextReviewLabel(word, now = new Date()) {
  const normalized = normalizeWord(word);
  if (!normalized.nextReviewAt) {
    return normalized.reviewCount > 0 ? 'Ôn lại ngay' : 'Chưa lên lịch';
  }

  return formatReviewDateLabel(normalized.nextReviewAt, now);
}

export function summarizeWords(words, now = new Date()) {
  return words.reduce(
    (summary, entry) => {
      const word = normalizeWord(entry);
      const stage = getWordStage(word, now);
      const reviewDate = toDate(word.nextReviewAt);

      summary.total += 1;
      summary[stage] += 1;
      if (isWordHard(word, now)) summary.hard += 1;
      if (isWordDueToday(word, now)) summary.dueToday += 1;

      if (reviewDate && reviewDate > now) {
        if (!summary.nextReviewAt || reviewDate < summary.nextReviewAt) {
          summary.nextReviewAt = reviewDate;
        }
      }

      return summary;
    },
    {
      total: 0,
      new: 0,
      learning: 0,
      due: 0,
      strong: 0,
      mastered: 0,
      hard: 0,
      dueToday: 0,
      nextReviewAt: null,
      readyForNew: 0,
    },
  );
}

export function summarizeSets(sets, now = new Date()) {
  const allWords = sets.flatMap((set) => set.words);
  const summary = summarizeWords(allWords, now);
  const reviewedToday = allWords.filter((word) => {
    if (!word.lastReviewedAt) return false;
    return new Date(word.lastReviewedAt).toDateString() === now.toDateString();
  }).length;

  return {
    ...summary,
    readyForNew: Math.min(summary.new, Math.max(0, 12 - summary.dueToday)),
    nextReviewLabel: formatReviewDateLabel(summary.nextReviewAt, now),
    reviewedToday,
    totalSets: sets.length,
    totalWords: allWords.length,
  };
}

export function summarizeSetProgress(set, now = new Date()) {
  const summary = summarizeWords(set.words, now);
  const learned = summary.strong + summary.mastered;

  return {
    ...summary,
    readyForNew: Math.min(summary.new, Math.max(0, 8 - summary.dueToday)),
    nextReviewLabel: formatReviewDateLabel(summary.nextReviewAt, now),
    learned,
    progressPercent: summary.total ? Math.round((learned / summary.total) * 100) : 0,
  };
}

export function buildStudyQueue(words, now = new Date()) {
  const normalizedWords = words.map((word) => normalizeWord(word));
  const dueToday = [...normalizedWords].filter((word) => isWordDueToday(word, now)).sort((a, b) => compareByPriority(a, b, now));
  const hardWords = [...normalizedWords]
    .filter((word) => isWordHard(word, now))
    .sort((a, b) => compareByPriority(a, b, now));
  const newWords = normalizedWords.filter((word) => getWordStage(word, now) === 'new');
  const learningWords = [...normalizedWords]
    .filter((word) => ['learning', 'strong'].includes(getWordStage(word, now)))
    .sort((a, b) => compareByPriority(a, b, now));

  const recommended = takeUnique(
    [
      ...dueToday.slice(0, 18),
      ...hardWords.slice(0, 10),
      ...learningWords.slice(0, 8),
      ...newWords.slice(0, 6),
      ...normalizedWords,
    ],
    28,
  );

  return {
    recommended,
    today: dueToday,
    hard: hardWords,
    new: newWords,
    all: normalizedWords,
  };
}

export function buildActivitySeries(events, days = 7, now = new Date()) {
  const result = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    const dayEvents = events.filter((event) => String(event.created_at || '').slice(0, 10) === key);
    result.push({
      key,
      label: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
      total: dayEvents.length,
      known: dayEvents.filter((event) => event.result === 'known').length,
      unknown: dayEvents.filter((event) => event.result === 'unknown').length,
    });
  }
  return result;
}

export function reviewWord(word, result, now = new Date()) {
  const normalized = normalizeWord(word);
  const reviewedAt = now.toISOString();

  if (result === 'known') {
    const nextMastery = clamp(normalized.masteryLevel + 1, 0, 5);
    const nextEase = clamp(normalized.easeFactor + 0.15, 1.3, 3.2);
    const intervalSeed = [1, 2, 4, 7, 14, 30][nextMastery] || 30;
    const nextInterval = Math.max(1, Math.round(intervalSeed * nextEase * 0.6));
    const nextReviewAt = new Date(now.getTime() + nextInterval * DAY_IN_MS).toISOString();

    const updatedWord = normalizeWord({
      ...normalized,
      masteryLevel: nextMastery,
      easeFactor: nextEase,
      intervalDays: nextInterval,
      reviewCount: normalized.reviewCount + 1,
      correctCount: normalized.correctCount + 1,
      streakCount: normalized.streakCount + 1,
      lastResult: 'known',
      lastReviewedAt: reviewedAt,
      nextReviewAt,
    });

    return normalizeWord({
      ...updatedWord,
      status: getWordStatusLabel(updatedWord, now),
    });
  }

  const updatedWord = normalizeWord({
    ...normalized,
    masteryLevel: clamp(normalized.masteryLevel - 1, 0, 5),
    easeFactor: clamp(normalized.easeFactor - 0.2, 1.3, 3.2),
    intervalDays: 0,
    reviewCount: normalized.reviewCount + 1,
    incorrectCount: normalized.incorrectCount + 1,
    streakCount: 0,
    lastResult: 'unknown',
    lastReviewedAt: reviewedAt,
    nextReviewAt: reviewedAt,
  });

  return normalizeWord({
    ...updatedWord,
    status: getWordStatusLabel(updatedWord, now),
  });
}

export function progressRowFromWord(userId, set, word) {
  const normalized = normalizeWord(word);

  return {
    user_id: userId,
    word_id: normalized.id,
    set_id: set.id,
    set_title: set.title,
    language: set.language,
    term: normalized.term,
    meaning: normalized.meaning,
    pos: normalized.pos,
    status: getWordStatusLabel(normalized),
    mastery_level: normalized.masteryLevel,
    ease_factor: normalized.easeFactor,
    interval_days: normalized.intervalDays,
    review_count: normalized.reviewCount,
    correct_count: normalized.correctCount,
    incorrect_count: normalized.incorrectCount,
    streak_count: normalized.streakCount,
    last_result: normalized.lastResult,
    last_reviewed_at: normalized.lastReviewedAt,
    next_review_at: normalized.nextReviewAt,
  };
}

export function progressMapFromRows(rows) {
  return Object.fromEntries(
    (rows || []).map((row) => [
      row.word_id,
      {
        masteryLevel: row.mastery_level,
        easeFactor: row.ease_factor,
        intervalDays: row.interval_days,
        reviewCount: row.review_count,
        correctCount: row.correct_count,
        incorrectCount: row.incorrect_count,
        streakCount: row.streak_count,
        lastResult: row.last_result,
        lastReviewedAt: row.last_reviewed_at,
        nextReviewAt: row.next_review_at,
        status: row.status || DEFAULT_STATUS,
      },
    ]),
  );
}
