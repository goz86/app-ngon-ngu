import React, { Suspense, lazy, startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle,
  Copy,
  Edit3,
  Mic,
  Pencil,
} from 'lucide-react';
import { read, utils } from 'xlsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { demoData } from './data';
import { enrichWordSchema, parseImportedSpreadsheetRows } from './lib/vocabularySchema';
import ProfileCard from './components/ProfileCard';
import AppSidebar from './components/AppSidebar';
import AppTopBar from './components/AppTopBar';
import FlashcardWorkspace from './components/FlashcardWorkspace';
import {
  buildStudyQueue,
  DEFAULT_STATUS,
  buildActivitySeries,
  formatReviewDateLabel,
  getNextReviewLabel,
  getWordStatusLabel,
  hydrateSets,
  isWordDueToday,
  progressMapFromRows,
  progressRowFromWord,
  reviewWord,
  summarizeSetProgress,
  summarizeSets,
  summarizeWords,
} from './lib/studyProgress';
import {
  getCurrentUser,
  isSupabaseEnabled,
  onAuthStateChange,
  signInWithEmail,
  signInWithGoogle,
  signInWithPassword,
  signOutUser,
  signUpWithEmail,
} from './lib/supabaseClient';
import {
  deleteUserSet,
  fetchSharedSetBySlug,
  fetchStudyEvents,
  fetchUserProfile,
  fetchUserProgress,
  fetchUserSets,
  fetchWordExamples,
  insertStudyEvent,
  replaceWordExamples,
  subscribeToUserChannel,
  upsertUserProfile,
  upsertUserProgress,
  upsertUserSet,
} from './lib/progressRepository';
import { generateExamplesWithAI, getAiExampleModel, hasAiExampleGenerator } from './lib/aiExampleGenerator';

const STORAGE_KEY = 'vocab-study-pwa.sets';
const THEME_KEY = 'vocab-study-pwa.dark-mode';
const SESSION_KEY = 'vocab-study-pwa.last-session';
const EVENTS_KEY = 'vocab-study-pwa.study-events';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const QuizMode = lazy(() => import('./components/QuizMode'));
const MatchMode = lazy(() => import('./components/MatchMode'));
const WriteMode = lazy(() => import('./components/WriteMode'));
const ListeningMode = lazy(() => import('./components/ListeningMode'));
const AuthPage = lazy(() => import('./components/AuthPage'));
const StatsDashboard = lazy(() => import('./components/StatsDashboard'));
const TodayDashboard = lazy(() => import('./components/TodayDashboard'));
const CreateSetModal = lazy(() => import('./components/CreateSetModal'));

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function deriveSetTopic(title, language) {
  const text = String(title || '').toLowerCase();
  if (text.includes('number')) return 'Số đếm';
  if (text.includes('meeting') || text.includes('document')) return 'Công việc';
  if (text.includes('bank') || text.includes('finance')) return 'Tài chính';
  if (text.includes('travel') || text.includes('airport')) return 'Du lịch';
  if (text.includes('it') || text.includes('technology')) return 'Công nghệ';
  if (text.includes('marketing')) return 'Marketing';
  if (text.includes('topik')) return 'TOPIK';
  return language === 'ko' ? 'Tiếng Hàn' : 'Tiếng Anh';
}

function formatSetTitle(title) {
  if (!title) return 'Bộ từ vựng';
  if (/^English:\s*1000 Common Words\s*(\d+)/i.test(title)) {
    const match = title.match(/^English:\s*1000 Common Words\s*(\d+)/i);
    return '1000 từ thông dụng ' + String(match?.[1] ?? '').padStart(2, '0');
  }
  if (/^English:\s*Numbers 0-100 \+ Ordinals/i.test(title)) return 'Số đếm 0-100';
  if (/^Korean:\s*TOPIK 5-6 Advanced\s*(\d+)/i.test(title)) {
    const match = title.match(/^Korean:\s*TOPIK 5-6 Advanced\s*(\d+)/i);
    return 'TOPIK nâng cao ' + String(match?.[1] ?? '').padStart(2, '0');
  }
  return title.replace(/^English:\s*/i, '').replace(/^Korean:\s*/i, '').trim();
}

function legacyMakeExampleSentences(word, set) {
  const topic = deriveSetTopic(set.title, set.language);
  if (set.language === 'ko') {
    return [
      `${word.term} (${word.pos}) là từ quan trọng trong chủ đề ${topic}.`,
      `Hãy thử đặt một câu ngắn dùng từ "${word.term}" ngay bây giờ.`,
      `Ghi nhớ nghĩa "${word.meaning}" để áp dụng vào các tình huống thực tế.`,
    ];
  }
  return [
    `The word "${word.term}" (${word.pos}) is exceptionally useful in ${topic.toLowerCase()}.`,
    `Try to incorporate "${word.term}" into your next conversation to master its usage.`,
    `Understanding the nuance of "${word.term}" will greatly improve your vocabulary skills.`
  ];
}

void legacyMakeExampleSentences;

function normalizeExampleList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  return String(value || '')
    .split(/\r?\n|[;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isLegacyGeneratedExample(example, word, set) {
  const text = String(example || '').trim().toLowerCase();
  const term = String(word?.term || '').trim().toLowerCase();
  const topic = deriveSetTopic(set?.title, set?.language).toLowerCase();

  return [
    `the word "${term}"`,
    `try to incorporate "${term}"`,
    `understanding the nuance of "${term}"`,
    `${term} (${String(word?.pos || '').trim().toLowerCase()})`,
    `trong chủ đề ${topic}`,
    `sử dụng từ "${term}"`,
    `ghi nhớ nghĩa`,
    `is useful in ${topic}`,
  ].some((pattern) => text.includes(pattern));
}

function buildNumberExamples(term) {
  const normalized = String(term || '').trim().toLowerCase();
  const exampleMap = {
    zero: ['I have zero unread messages.', 'The answer is zero.'],
    one: ['I need one more minute.', 'She bought one notebook.'],
    two: ['We have two classes today.', 'Two students stayed after school.'],
    three: ['Three people joined the meeting.', 'I called her three times.'],
    four: ['There are four chairs in the room.', 'He waited for four days.'],
    five: ['She drank five glasses of water.', 'We studied for five hours.'],
    six: ['Six buses stop here every day.', 'He has six cousins.'],
    seven: ['Seven teams entered the contest.', 'I woke up at seven.'],
    eight: ['Eight pages are missing.', 'They arrived in eight minutes.'],
    nine: ['Nine students passed the test.', 'The office opens at nine.'],
    ten: ['Ten people signed up early.', 'I need ten more dollars.'],
    first: ['She finished first in the race.', 'This is my first visit here.'],
    second: ['He came second in the contest.', 'Please read the second paragraph.'],
    third: ['We met on the third day.', 'She lives on the third floor.'],
    fourth: ['Today is the fourth lesson.', 'He finished in fourth place.'],
    fifth: ['This is my fifth attempt.', 'She sat in the fifth row.'],
  };

  if (exampleMap[normalized]) {
    return exampleMap[normalized];
  }

  if (normalized.endsWith('th') || normalized.endsWith('st') || normalized.endsWith('nd') || normalized.endsWith('rd')) {
    return [
      `She finished ${normalized} in the competition.`,
      `This is the ${normalized} item on the list.`,
    ];
  }

  return [
    `The number is ${normalized}.`,
    `Please count to ${normalized}.`,
  ];
}

function makeExampleSentences(word, set) {
  const providedExamples = [
    ...normalizeExampleList(word?.examples),
    ...normalizeExampleList(word?.example),
  ].filter((example) => example && !isLegacyGeneratedExample(example, word, set));

  const uniqueExamples = [...new Set(providedExamples)];
  if (uniqueExamples.length >= 2) {
    return uniqueExamples.slice(0, 2);
  }

  const isNumbersSet = /^English:\s*Numbers 0-100 \+ Ordinals/i.test(set?.title || '');
  if (set?.language === 'en' && isNumbersSet) {
    return [...uniqueExamples, ...buildNumberExamples(word?.term)].slice(0, 2);
  }

  return uniqueExamples.slice(0, 2);
}

function buildFallbackExamples(word, set) {
  const term = String(word?.term || '').trim();
  const meaning = String(word?.meaning || '').trim().toLowerCase();
  const topic = deriveSetTopic(set?.title, set?.language).toLowerCase();

  if (!term) return [];

  if (set?.language === 'ko') {
    return [
      `${term} là từ xuất hiện nhiều trong chủ đề ${topic}.`,
      `Hãy thử tự đặt một câu với "${term}" để nhớ nghĩa ${meaning}.`,
    ];
  }

  return [
    `I used the word "${term}" in a sentence about ${topic}.`,
    `This example helps me remember that "${term}" means ${meaning}.`,
  ];
}

function normalizeGeneratedExamples(examples, word, set) {
  const uniqueExamples = [...new Set(normalizeExampleList(examples))].slice(0, 2);
  return uniqueExamples.length > 0 ? uniqueExamples : buildFallbackExamples(word, set);
}

function buildFallbackExampleTranslations(examples, word) {
  return examples.map(
    (example) => `Ví dụ này minh họa cách dùng "${word.term}" với nghĩa "${word.meaning}" trong ngữ cảnh: ${example}`,
  );
}

async function fetchVietnameseExampleTranslations(examples, word, set) {
  if (!examples.length) return [];

  if (set?.language !== 'en') {
    return buildFallbackExampleTranslations(examples, word);
  }

  try {
    const translations = [];

    for (const example of examples) {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(example)}&langpair=en|vi`,
      );
      if (!response.ok) throw new Error(`MyMemory ${response.status}`);

      const payload = await response.json();
      const translatedText = String(payload?.responseData?.translatedText || '').trim();
      translations.push(translatedText || `Nghĩa tiếng Việt: ${word.meaning}`);
    }

    return translations;
  } catch {
    return buildFallbackExampleTranslations(examples, word);
  }
}

async function fetchExamplesForWord(word, set) {
  if (set?.language === 'ko' && hasAiExampleGenerator()) {
    const generated = await generateExamplesWithAI({
      term: word.term,
      meaning: word.meaning,
      pos: word.pos,
      language: set.language,
    });

    const examples = normalizeGeneratedExamples(generated.examples, word, set);
    const translations =
      generated.translations.length > 0
        ? generated.translations.slice(0, examples.length)
        : await fetchVietnameseExampleTranslations(examples, word, set);

    return { examples, translations };
  }

  const examples = await fetchFreeExamplesForWord(word, set);
  const translations = await fetchVietnameseExampleTranslations(examples, word, set);
  return { examples, translations };
}

async function fetchFreeExamplesForWord(word, set) {
  if (!word?.term) {
    return buildFallbackExamples(word, set);
  }

  if (set?.language !== 'en') {
    return buildFallbackExamples(word, set);
  }

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.term)}`);
    if (!response.ok) throw new Error(`Dictionary API ${response.status}`);

    const payload = await response.json();
    const examples = [];

    for (const entry of Array.isArray(payload) ? payload : []) {
      for (const meaning of entry?.meanings || []) {
        for (const definition of meaning?.definitions || []) {
          if (definition?.example) {
            examples.push(definition.example);
          }
        }
      }
    }

    return normalizeGeneratedExamples(examples, word, set);
  } catch {
    return buildFallbackExamples(word, set);
  }
}

function prepareWord(word, index = 0, set = {}) {
  const base = enrichWordSchema(word, {
    language: set.language || word.language || 'en',
    idPrefix: 'word',
    index,
    topic: set.topic || '',
    level: set.level || '',
  });
  const examples = makeExampleSentences(base, set);
  const exampleTranslations = normalizeExampleList(base.exampleTranslations || word.exampleTranslations || word.example_translations).slice(0, 2);

  return {
    ...base,
    status: word.status || DEFAULT_STATUS,
    ...word,
    examples,
    example: examples[0] || '',
    exampleTranslations,
  };
}

function prepareSet(set, overrides = {}) {
  const merged = { ...set, ...overrides };
  const result = {
    ...merged,
    title: merged.title || 'Bộ từ vựng mới',
    language: merged.language || 'en',
    topic: merged.topic || deriveSetTopic(merged.title, merged.language),
    level: merged.level || '',
    description: merged.description || '',
    isCustom: Boolean(merged.isCustom),
    isPublic: Boolean(merged.isPublic),
    shareSlug: merged.shareSlug || null,
  };

  result.words = (merged.words || []).map((word, index) => prepareWord(word, index, result));
  return result;
}

function buildInitialSets() {
  return demoData.map((set) => prepareSet(set, { isCustom: false }));
}

function loadStoredSets() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return hydrateSets(buildInitialSets());
    const parsed = JSON.parse(stored);
    return hydrateSets(Array.isArray(parsed) && parsed.length > 0 ? parsed.map((set) => prepareSet(set)) : buildInitialSets());
  } catch {
    return hydrateSets(buildInitialSets());
  }
}

function loadStoredDarkMode() {
  try {
    return localStorage.getItem(THEME_KEY) === 'true';
  } catch {
    return false;
  }
}

function loadLocalEvents() {
  try {
    const stored = localStorage.getItem(EVENTS_KEY);
    const parsed = JSON.parse(stored || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadLastSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function mergeSets(existingSets, incomingSets) {
  const order = existingSets.map((set) => set.id);
  const map = new Map(existingSets.map((set) => [set.id, prepareSet(set)]));

  incomingSets.forEach((set) => {
    const prepared = prepareSet(set);
    if (!map.has(prepared.id)) order.push(prepared.id);
    map.set(prepared.id, prepared);
  });

  return order.map((id) => map.get(id)).filter(Boolean);
}

function mapUserSetRowToSet(row) {
  return prepareSet({
    id: row.id,
    title: row.title,
    language: row.language,
    topic: row.topic,
    level: row.level,
    description: row.description,
    words: Array.isArray(row.words) ? row.words : [],
    isCustom: true,
    isPublic: row.is_public,
    shareSlug: row.share_slug,
  });
}

function mapSetToUserRow(userId, set) {
  return {
    id: set.id,
    user_id: userId,
    title: set.title,
    language: set.language,
    topic: set.topic,
    level: set.level || null,
    description: set.description || null,
    words: set.words.map((word) => ({
      id: word.id,
      term: word.term,
      pos: word.pos,
      meaning: word.meaning,
      example: word.example || '',
      examples: normalizeExampleList(word.examples || word.example).slice(0, 2),
      exampleTranslations: normalizeExampleList(word.exampleTranslations || word.example_translations).slice(0, 2),
      topic: word.topic || set.topic || '',
      level: word.level || set.level || '',
      tags: Array.isArray(word.tags) ? word.tags : [],
      family: word.family || '',
      notes: word.notes || '',
      collocations: Array.isArray(word.collocations) ? word.collocations : [],
      synonyms: Array.isArray(word.synonyms) ? word.synonyms : [],
      antonyms: Array.isArray(word.antonyms) ? word.antonyms : [],
    })),
    is_public: Boolean(set.isPublic),
    share_slug: set.shareSlug || null,
  };
}

function mergeWordExamplesIntoSets(existingSets, exampleRows) {
  if (!exampleRows?.length) return existingSets;

  const grouped = exampleRows.reduce((map, row) => {
    const key = `${row.set_id}::${row.word_id}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
    return map;
  }, new Map());

  return existingSets.map((set) => {
    let changed = false;
    const words = set.words.map((word) => {
      const rows = grouped.get(`${set.id}::${word.id}`);
      if (!rows?.length) return word;

      const sorted = [...rows].sort((left, right) => left.position - right.position);
      const examples = sorted.map((row) => row.example_text).filter(Boolean).slice(0, 2);
      const exampleTranslations = sorted.map((row) => row.example_translation).filter(Boolean).slice(0, 2);
      changed = true;

      return {
        ...word,
        examples,
        example: examples[0] || '',
        exampleTranslations,
      };
    });

    return changed ? prepareSet({ ...set, words }) : set;
  });
}

function buildWordExampleRows(userId, set, word, examples, translations) {
  const normalizedExamples = normalizeExampleList(examples).slice(0, 2);
  const normalizedTranslations = normalizeExampleList(translations).slice(0, 2);
  const source = set.language === 'ko' && hasAiExampleGenerator() ? 'gemini' : 'dictionary_api';
  const model = source === 'gemini' ? getAiExampleModel() : null;

  return normalizedExamples.map((example, index) => ({
    user_id: userId,
    set_id: set.id,
    word_id: word.id,
    language: set.language,
    term: word.term,
    meaning: word.meaning,
    example_text: example,
    example_translation: normalizedTranslations[index] || '',
    source,
    model,
    position: index,
    is_active: true,
  }));
}

function buildWeeklySeries(events, weeks = 8) {
  const now = new Date();
  const series = [];
  for (let offset = weeks - 1; offset >= 0; offset -= 1) {
    const start = new Date(now);
    start.setDate(now.getDate() - offset * 7 - 6);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    const bucket = events.filter((event) => {
      const createdAt = new Date(event.created_at);
      return createdAt >= start && createdAt <= end;
    });
    series.push({
      key: start.toISOString(),
      label: `Tuần ${weeks - offset}`,
      total: bucket.length,
      known: bucket.filter((item) => item.result === 'known').length,
      unknown: bucket.filter((item) => item.result === 'unknown').length,
    });
  }
  return series;
}

function getResumeLabel(sets, session) {
  if (!session?.setId) return '';
  const targetSet = sets.find((set) => set.id === session.setId);
  if (!targetSet) return '';
  return `${formatSetTitle(targetSet.title)} • ${session.tab === 'flashcard' ? 'Flashcard' : 'Chế độ khác'}`;
}

function buildPosOptions(sets, language) {
  return [...new Set(
    sets
      .filter((set) => set.language === language)
      .flatMap((set) => set.words.map((word) => String(word.pos || '').trim().toUpperCase()))
      .filter(Boolean),
  )].sort();
}

function getReadableErrorMessage(error) {
  const message = String(error?.message || error?.details || error || '').trim();
  if (!message) return 'Lỗi không xác định';
  return message.replace(/\s+/g, ' ');
}

export default function App() {
  const [sets, setSets] = useState(loadStoredSets);
  const [langFilter, setLangFilter] = useState(sets[0]?.language ?? 'en');
  const [activeSetId, setActiveSetId] = useState(() => loadLastSession()?.setId || sets[0]?.id || demoData[0].id);
  const [activeTab, setActiveTab] = useState(() => loadLastSession()?.tab || 'flashcard');
  const [currentWordIndex, setCurrentWordIndex] = useState(() => loadLastSession()?.wordIndex || 0);
  const [isMeaningVisible, setIsMeaningVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(loadStoredDarkMode);
  const [isCopyingStarted, setIsCopyingStarted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDueTodayOnly, setShowDueTodayOnly] = useState(false);
  const [studyQueueMode, setStudyQueueMode] = useState('recommended');
  const [statusFilter, setStatusFilter] = useState('all');
  const [posFilter, setPosFilter] = useState('all');
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showCreateSetModal, setShowCreateSetModal] = useState(false);
  const [syncState, setSyncState] = useState(isSupabaseEnabled ? 'Sẵn sàng đồng bộ Supabase' : 'Đang dùng dữ liệu cục bộ');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [studyEvents, setStudyEvents] = useState(loadLocalEvents);
  const [exampleHistory, setExampleHistory] = useState([]);
  const [audioSettings, setAudioSettings] = useState({ accent: 'en-US', autoPlay: false, rate: 1 });
  const [exampleGeneration, setExampleGeneration] = useState({
    currentWordId: null,
    currentWordTerm: '',
    isBulkRunning: false,
    completed: 0,
    total: 0,
  });
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const fileInputRef = useRef(null);
  const activeWordRef = useRef(null);
  const pendingSyncRef = useRef(new Map());
  const syncTimerRef = useRef(null);
  const realtimeCleanupRef = useRef(() => {});

  const posOptions = useMemo(() => buildPosOptions(sets, langFilter), [sets, langFilter]);

  const filteredSets = useMemo(() => {
    const keyword = deferredSearchTerm.trim().toLowerCase();
    return sets.filter((set) => {
      if (set.language !== langFilter) return false;
      const matchingWords = set.words.filter((word) => {
        const statusLabel = getWordStatusLabel(word).toLowerCase();
        const haystack = `${word.term} ${word.meaning} ${word.pos} ${statusLabel} ${word.example || ''} ${set.topic || ''}`.toLowerCase();
        const matchesKeyword = !keyword || haystack.includes(keyword) || formatSetTitle(set.title).toLowerCase().includes(keyword);
        const matchesStatus = statusFilter === 'all' || statusLabel === statusFilter;
        const matchesPos = posFilter === 'all' || String(word.pos || '').trim().toUpperCase() === posFilter;
        const matchesDue = !showDueTodayOnly || isWordDueToday(word);
        return matchesKeyword && matchesStatus && matchesPos && matchesDue;
      });
      if (matchingWords.length > 0) return true;
      if (!keyword) return false;
      return `${formatSetTitle(set.title)} ${set.topic || ''}`.toLowerCase().includes(keyword);
    });
  }, [deferredSearchTerm, langFilter, posFilter, sets, showDueTodayOnly, statusFilter]);

  const fallbackSet = filteredSets[0] || sets.find((set) => set.language === langFilter) || sets[0];
  const activeSet = sets.find((set) => set.id === activeSetId) || fallbackSet;
  const activeWordsBase = useMemo(() => {
    if (!activeSet) return [];
    return activeSet.words.filter((word) => {
      const keyword = deferredSearchTerm.trim().toLowerCase();
      const statusLabel = getWordStatusLabel(word).toLowerCase();
      const matchesKeyword =
        !keyword ||
        `${word.term} ${word.meaning} ${word.pos} ${word.example || ''} ${statusLabel}`.toLowerCase().includes(keyword) ||
        formatSetTitle(activeSet.title).toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === 'all' || statusLabel === statusFilter;
      const matchesPos = posFilter === 'all' || String(word.pos || '').trim().toUpperCase() === posFilter;
      return matchesKeyword && matchesStatus && matchesPos;
    });
  }, [activeSet, deferredSearchTerm, posFilter, statusFilter]);

  const studyQueues = useMemo(() => buildStudyQueue(activeWordsBase), [activeWordsBase]);
  const queueOptions = useMemo(
    () => [
      { id: 'recommended', label: 'Đề xuất', count: studyQueues.recommended.length },
      { id: 'today', label: 'Ôn hôm nay', count: studyQueues.today.length },
      { id: 'hard', label: 'Từ khó', count: studyQueues.hard.length },
      { id: 'new', label: 'Từ mới', count: studyQueues.new.length },
      { id: 'all', label: 'Tất cả', count: studyQueues.all.length },
    ],
    [studyQueues],
  );
  const words = useMemo(() => studyQueues[studyQueueMode] || [], [studyQueueMode, studyQueues]);
  const currentWord = words[currentWordIndex] || words[0] || null;
  const wordSummary = summarizeWords(words);
  const currentWordNextReviewLabel = currentWord ? getNextReviewLabel(currentWord) : formatReviewDateLabel(null);
  const globalSummary = summarizeSets(sets);
  const dailySeries = useMemo(() => buildActivitySeries(studyEvents, 7), [studyEvents]);
  const weeklySeries = useMemo(() => buildWeeklySeries(studyEvents, 8), [studyEvents]);
  const lastSession = loadLastSession();

  const setDetails = useMemo(
    () =>
      sets
        .filter((set) => {
          if (set.language !== langFilter) return false;
          // Apply status and POS filters to the sets in the stats view as well
          const matchingWords = set.words.filter((word) => {
            const statusLabel = getWordStatusLabel(word).toLowerCase();
            const matchesStatus = statusFilter === 'all' || statusLabel === statusFilter;
            const matchesPos = posFilter === 'all' || String(word.pos || '').trim().toUpperCase() === posFilter;
            return matchesStatus && matchesPos;
          });
          return statusFilter === 'all' && posFilter === 'all' ? true : matchingWords.length > 0;
        })
        .map((set) => {
          const summary = summarizeSetProgress(set);
          return {
            id: set.id,
            title: formatSetTitle(set.title),
            language: set.language,
            topic: set.topic || deriveSetTopic(set.title, set.language),
            description: set.description,
            isCustom: set.isCustom,
            shareSlug: set.shareSlug,
            ...summary,
          };
        })
        .sort((a, b) => b.dueToday - a.dueToday || b.hard - a.hard || b.learned - a.learned),
    [langFilter, sets, statusFilter, posFilter],
  );

  const tabs = [
    { id: 'today', label: 'Hôm nay', icon: CalendarDays },
    { id: 'flashcard', label: 'Học từ mới', icon: BookOpen },
    { id: 'typing', label: 'Chép từ vựng', icon: Edit3 },
    { id: 'quiz', label: 'Trắc nghiệm', icon: CheckCircle },
    { id: 'match', label: 'Ghép thẻ', icon: Copy },
    { id: 'fill', label: 'Điền từ vựng', icon: Pencil },
    { id: 'listening', label: 'Luyện nghe', icon: Mic },
    { id: 'stats', label: 'Thống kê', icon: BarChart3 },
  ];
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem(THEME_KEY, String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
  }, [sets]);

  useEffect(() => {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(studyEvents.slice(0, 300)));
  }, [studyEvents]);

  useEffect(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ setId: activeSetId, tab: activeTab, wordIndex: currentWordIndex }));
  }, [activeSetId, activeTab, currentWordIndex]);

  useEffect(() => {
    if (activeWordRef.current && activeTab === 'flashcard') {
      if (window.innerWidth < 1280) return;
      activeWordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentWordIndex, activeSetId, activeTab, searchTerm, statusFilter, posFilter, studyQueueMode]);

  useEffect(() => {
    if (currentWordIndex >= words.length) setCurrentWordIndex(0);
  }, [currentWordIndex, words.length]);

  useEffect(() => {
    if (activeSet && !filteredSets.some((set) => set.id === activeSet.id) && fallbackSet) {
      setActiveSetId(fallbackSet.id);
      setCurrentWordIndex(0);
    }
  }, [activeSet, fallbackSet, filteredSets]);

  useEffect(() => {
    if (!audioSettings.autoPlay || activeTab !== 'flashcard' || !currentWord || !activeSet) return;
    playAudio(currentWord.term, activeSet.language, audioSettings);
  }, [activeSet, activeTab, audioSettings, currentWord]);

  useEffect(() => {
    if (!isSupabaseEnabled) return;

    async function loadAuthData(currentUser) {
      realtimeCleanupRef.current();
      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setExampleHistory([]);
        setSyncState('Hãy đăng nhập để đồng bộ dữ liệu');
        return;
      }

      try {
        setUser(currentUser);
        setSyncState('Đang tải dữ liệu từ Supabase...');
        const [rowsResult, profileResult, eventsResult, setsResult, examplesResult] = await Promise.allSettled([
          fetchUserProgress(currentUser.id),
          fetchUserProfile(currentUser.id),
          fetchStudyEvents(currentUser.id),
          fetchUserSets(currentUser.id),
          fetchWordExamples(currentUser.id),
        ]);

        const rows = rowsResult.status === 'fulfilled' ? rowsResult.value : [];
        const remoteProfile = profileResult.status === 'fulfilled' ? profileResult.value : null;
        const events = eventsResult.status === 'fulfilled' ? eventsResult.value : [];
        const remoteSets = setsResult.status === 'fulfilled' ? setsResult.value : [];
        const remoteExamples = examplesResult.status === 'fulfilled' ? examplesResult.value : [];

        const mergedSets = mergeWordExamplesIntoSets(
          mergeSets(sets, remoteSets.map(mapUserSetRowToSet)),
          remoteExamples,
        );
        setSets(hydrateSets(mergedSets, progressMapFromRows(rows)));
        setExampleHistory(remoteExamples.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 12));
        setProfile(
          remoteProfile || {
            id: currentUser.id,
            display_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || '',
            avatar_url: currentUser.user_metadata?.avatar_url || '',
            study_goal: '20 từ mỗi ngày',
          },
        );
        setStudyEvents(events);

        const failures = [
          ['tiến độ học', rowsResult],
          ['hồ sơ', profileResult],
          ['lịch sử học', eventsResult],
          ['bộ từ cá nhân', setsResult],
          ['ví dụ AI', examplesResult],
        ]
          .filter(([, result]) => result.status === 'rejected')
          .map(([label, result]) => `${label}: ${getReadableErrorMessage(result.reason)}`);

        if (failures.length > 0) {
          setSyncState(`Supabase lỗi ở ${failures[0]}. App vẫn dùng dữ liệu cục bộ cho phần này.`);
        } else {
          setSyncState('Đồng bộ dữ liệu thành công');
        }

        realtimeCleanupRef.current = subscribeToUserChannel(currentUser.id, {
          onProgressChange: async () => {
            const latest = await fetchUserProgress(currentUser.id);
            setSets((prev) => hydrateSets(prev, progressMapFromRows(latest)));
          },
          onProfileChange: async () => {
            const latest = await fetchUserProfile(currentUser.id);
            if (latest) setProfile(latest);
          },
          onStudyEvent: async () => {
            const latest = await fetchStudyEvents(currentUser.id);
            setStudyEvents(latest);
          },
          onUserSetChange: async () => {
            const [latestSets, latestExamples] = await Promise.all([
              fetchUserSets(currentUser.id),
              fetchWordExamples(currentUser.id),
            ]);
            setSets((prev) => mergeWordExamplesIntoSets(mergeSets(prev, latestSets.map(mapUserSetRowToSet)), latestExamples));
          },
          onWordExamplesChange: async () => {
            const latest = await fetchWordExamples(currentUser.id);
            setSets((prev) => mergeWordExamplesIntoSets(prev, latest));
            setExampleHistory(latest.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 12));
          },
        });
      } catch (error) {
        console.error(error);
        setSyncState(`Không thể đồng bộ với Supabase: ${getReadableErrorMessage(error)}`);
      }
    }

    getCurrentUser().then(loadAuthData).catch((error) => {
      console.error(error);
      setSyncState('Không thể kết nối Supabase');
    });

    const unsubscribe = onAuthStateChange(loadAuthData);
    return () => {
      unsubscribe();
      realtimeCleanupRef.current();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedSlug = params.get('shared');
    if (!sharedSlug || !isSupabaseEnabled) return;
    fetchSharedSetBySlug(sharedSlug).then((row) => {
      if (!row) return;
      const sharedSet = mapUserSetRowToSet(row);
      setSets((prev) => mergeSets(prev, [sharedSet]));
      setLangFilter(sharedSet.language);
      setActiveSetId(sharedSet.id);
      setActiveTab('flashcard');
      setSyncState(`Đã tải bộ từ chia sẻ ${sharedSet.title}`);
    }).catch(console.error);
  }, []);

  const queueProgressSync = (set, word) => {
    if (!user) return;
    pendingSyncRef.current.set(word.id, progressRowFromWord(user.id, set, word));
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      const rows = [...pendingSyncRef.current.values()];
      pendingSyncRef.current.clear();
      if (!rows.length) return;
      try {
        await upsertUserProgress(rows);
        setSyncState('Đồng bộ dữ liệu thành công');
      } catch (error) {
        console.error(error);
        setSyncState('Không thể đồng bộ tiến độ, dữ liệu vẫn lưu cục bộ');
      }
    }, 700);
  };

  const syncCustomSet = async (set) => {
    if (!user || !set?.isCustom) return;
    try {
      await upsertUserSet(mapSetToUserRow(user.id, set));
      setSyncState('Đã đồng bộ bộ từ cá nhân');
    } catch (error) {
      console.error(error);
      setSyncState('Không thể đồng bộ bộ từ cá nhân');
    }
  };

  const persistWordExamples = async (set, word, examples, translations) => {
    if (!user || !set || !word) return;

    try {
      await replaceWordExamples({
        userId: user.id,
        setId: set.id,
        wordId: word.id,
        rows: buildWordExampleRows(user.id, set, word, examples, translations),
      });
      const latest = await fetchWordExamples(user.id);
      setExampleHistory(latest.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 12));
    } catch (error) {
      console.error(error);
      setSyncState('Ví dụ AI đã tạo nhưng chưa lưu được lên Supabase.');
    }
  };

  const resetStudyProgress = () => {
    setCurrentWordIndex(0);
    setIsMeaningVisible(false);
    setIsCopyingStarted(false);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleStudyQueueChange = (mode) => {
    setStudyQueueMode(mode);
    resetStudyProgress();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      try {
        const workbook = read(target.result, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = utils.sheet_to_json(worksheet);
        if (!rows.length) return;
        const createdAt = Date.now();
        const isKorean = /korean|ko|topik/i.test(file.name);
        const defaultLanguage = isKorean ? 'ko' : 'en';
        const defaultTopic = deriveSetTopic(file.name, defaultLanguage);
        const defaultLevel = /topik\s*([1-6])/i.test(file.name)
          ? `TOPIK ${file.name.match(/topik\s*([1-6])/i)?.[1]}`
          : /ielts|toeic|oxford|academic/i.test(file.name)
            ? file.name.replace(/\.[^/.]+$/, '')
            : '';
        const parsed = parseImportedSpreadsheetRows(rows, {
          language: defaultLanguage,
          idPrefix: `cw_${createdAt}`,
          defaultTopic,
          defaultLevel,
        });
        const newSet = prepareSet({
          id: `custom_${createdAt}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          language: defaultLanguage,
          topic: defaultTopic,
          level: defaultLevel,
          description: `Bộ từ nhập từ Excel${parsed.duplicateCount ? ` • đã gộp ${parsed.duplicateCount} dòng trùng` : ''}`,
          isCustom: true,
          words: parsed.words,
        });
        setSets((prev) => mergeSets(prev, [newSet]));
        setLangFilter(newSet.language);
        setActiveSetId(newSet.id);
        setSearchTerm('');
        resetStudyProgress();
        syncCustomSet(newSet);
        setSyncState(
          parsed.duplicateCount
            ? `Đã import ${parsed.words.length} từ và gộp ${parsed.duplicateCount} dòng trùng`
            : `Đã import ${parsed.words.length} từ mới`,
        );
      } catch {
        alert('Không thể đọc file Excel. Hãy kiểm tra lại định dạng cột.');
      }
    };
    reader.readAsBinaryString(file);
    event.target.value = '';
  };

  const playAudio = (text, langCode, settings = audioSettings) => {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode === 'ko' ? 'ko-KR' : settings.accent || 'en-US';
    utterance.rate = settings.rate || 1;
    window.speechSynthesis.speak(utterance);
  };

  const handleReviewAction = (result) => {
    if (!activeSet || !currentWord) return;
    const actualIndex = activeSet.words.findIndex((word) => word.id === currentWord.id);
    if (actualIndex < 0) return;
    const updatedWord = reviewWord(currentWord, result);

    setSets((prev) =>
      prev.map((set) =>
        set.id !== activeSet.id
          ? set
          : { ...set, words: set.words.map((word, index) => (index === actualIndex ? updatedWord : word)) },
      ),
    );

    const eventPayload = {
      id: `event_${Date.now()}_${currentWord.id}`,
      set_id: activeSet.id,
      word_id: currentWord.id,
      term: currentWord.term,
      result,
      source_mode: 'flashcard',
      mastery_level: updatedWord.masteryLevel,
      created_at: new Date().toISOString(),
    };

    setStudyEvents((prev) => [eventPayload, ...prev].slice(0, 300));
    if (user) {
      queueProgressSync(activeSet, updatedWord);
      insertStudyEvent({ user_id: user.id, ...eventPayload }).catch(console.error);
    }
    if (currentWordIndex < words.length - 1) setCurrentWordIndex((index) => index + 1);
    setIsMeaningVisible(false);
  };

  const updateExamplesForWord = (setId, wordId, examples, exampleTranslations = []) => {
    let updatedSet = null;

    setSets((prev) =>
      prev.map((set) => {
        if (set.id !== setId) return set;
        updatedSet = prepareSet({
          ...set,
          words: set.words.map((word) =>
            word.id === wordId
              ? {
                  ...word,
                  examples,
                  example: examples[0] || '',
                  exampleTranslations,
                }
              : word,
          ),
        });
        return updatedSet;
      }),
    );

    return updatedSet;
  };

  const handleGenerateExamplesForCurrentWord = async () => {
    if (!activeSet || !currentWord) return;

    setExampleGeneration({
      currentWordId: currentWord.id,
      currentWordTerm: currentWord.term,
      isBulkRunning: false,
      completed: 0,
      total: 1,
    });

    try {
      const { examples, translations } = await fetchExamplesForWord(currentWord, activeSet);
      const updatedSet = updateExamplesForWord(activeSet.id, currentWord.id, examples, translations);
      await persistWordExamples(activeSet, currentWord, examples, translations);

      if (updatedSet && user && updatedSet.isCustom) {
        await syncCustomSet(updatedSet);
      }

      setIsMeaningVisible(true);
      setSyncState(`Đã tạo ví dụ cho từ "${currentWord.term}"`);
    } catch (error) {
      setSyncState(`Không thể tạo ví dụ cho từ hiện tại: ${String(error?.message || 'Lỗi không xác định')}`);
    } finally {
      setExampleGeneration({ currentWordId: null, currentWordTerm: '', isBulkRunning: false, completed: 0, total: 0 });
    }
  };

  const handleGenerateExamplesForSet = async () => {
    if (!activeSet) return;

    const priorityIds = new Set(words.map((word) => word.id));
    const targets = [...activeSet.words]
      .filter((word) => normalizeExampleList(word.examples || word.example).length === 0)
      .sort((left, right) => {
        const leftPriority = priorityIds.has(left.id) ? 0 : 1;
        const rightPriority = priorityIds.has(right.id) ? 0 : 1;
        return leftPriority - rightPriority;
      });
    if (targets.length === 0) {
      setSyncState('Bộ từ này đã có ví dụ cho tất cả các từ');
      return;
    }

    setExampleGeneration({
      currentWordId: null,
      currentWordTerm: '',
      isBulkRunning: true,
      completed: 0,
      total: targets.length,
    });

    let latestSet = activeSet;

    try {
      for (let index = 0; index < targets.length; index += 1) {
        const word = targets[index];
        const { examples, translations } = await fetchExamplesForWord(word, activeSet);
        latestSet = updateExamplesForWord(activeSet.id, word.id, examples, translations) || latestSet;
        await persistWordExamples(activeSet, word, examples, translations);
        setExampleGeneration({
          currentWordId: word.id,
          currentWordTerm: word.term,
          isBulkRunning: true,
          completed: index + 1,
          total: targets.length,
        });
      }

      if (latestSet && user && latestSet.isCustom) {
        await syncCustomSet(latestSet);
      }

      setSyncState(`Đã tạo ví dụ cho ${targets.length} từ trong bộ hiện tại`);
    } catch (error) {
      setSyncState(`Không thể tạo ví dụ hàng loạt: ${String(error?.message || 'Lỗi không xác định')}`);
    } finally {
      setExampleGeneration({ currentWordId: null, currentWordTerm: '', isBulkRunning: false, completed: 0, total: 0 });
    }
  };

  const handleEmailSignIn = async (email, password) => {
    if (password) {
      await signInWithPassword(email, password);
    } else {
      await signInWithEmail(email);
      setSyncState('Đã gửi magic link đăng nhập vào email của bạn');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      setSyncState(`Lỗi đăng nhập Google: ${error.message}`);
    }
  };

  const handleEmailSignUp = async (email, password) => {
    await signUpWithEmail(email, password);
    setSyncState('Đã tạo tài khoản, hãy kiểm tra email để xác nhận');
  };

  const handleSignOut = async () => {
    await signOutUser();
    realtimeCleanupRef.current();
    setUser(null);
    setProfile(null);
    setSyncState('Đã đăng xuất khỏi Supabase');
    setShowAuthPage(false);
  };

  const handleLangFilterChange = (lang) => {
    setLangFilter(lang);
    setSearchTerm('');
    setStatusFilter('all');
    setPosFilter('all');
    setStudyQueueMode('recommended');
    resetStudyProgress();
    const firstInLang = sets.find((set) => set.language === lang);
    if (firstInLang) setActiveSetId(firstInLang.id);
  };

  const handleSelectSet = (setId) => {
    setActiveSetId(setId);
    setStudyQueueMode('recommended');
    resetStudyProgress();
  };

  const handleTabChange = (tabId) => {
    startTransition(() => {
      setActiveTab(tabId);
      resetStudyProgress();
    });
  };

  const handleResumeLearning = () => {
    const session = loadLastSession();
    if (!session?.setId) return;
    setActiveSetId(session.setId);
    setActiveTab(session.tab || 'flashcard');
    setCurrentWordIndex(session.wordIndex || 0);
    setShowDueTodayOnly(false);
    setStudyQueueMode('recommended');
    setSidebarOpen(false);
  };

  const handleCreateSet = (payload) => {
    const createdAt = Date.now();
    const newSet = prepareSet({
      id: `custom_${createdAt}`,
      title: payload.title,
      language: payload.language,
      topic: payload.topic,
      level: payload.level,
      description: payload.description,
      isCustom: true,
      words: payload.words,
    });
    setSets((prev) => mergeSets(prev, [newSet]));
    setLangFilter(newSet.language);
    setActiveSetId(newSet.id);
    setActiveTab('flashcard');
    setShowCreateSetModal(false);
    resetStudyProgress();
    syncCustomSet(newSet);
  };

  const handleSaveProfile = async (draft) => {
    if (!user) {
      setShowAuthPage(true);
      return;
    }
    try {
      setProfileSaving(true);
      const saved = await upsertUserProfile({
        id: user.id,
        display_name: draft.display_name,
        avatar_url: draft.avatar_url,
        study_goal: draft.study_goal,
        preferred_language: langFilter,
      });
      setProfile(saved);
      setSyncState('Đã lưu hồ sơ học tập');
    } catch (error) {
      console.error(error);
      setSyncState('Không thể lưu hồ sơ');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleOpenSet = (item) => {
    setActiveSetId(item.id);
    setActiveTab('flashcard');
    setCurrentWordIndex(0);
    setShowDueTodayOnly(false);
    setStudyQueueMode('recommended');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShareSet = async (item) => {
    const set = sets.find((entry) => entry.id === item.id);
    if (!set) return;
    if (!set.isCustom) {
      setSyncState('Hiện chỉ có thể chia sẻ bộ từ cá nhân hoặc bộ đã import');
      return;
    }
    if (!user) {
      setShowAuthPage(true);
      setSyncState('Đăng nhập để chia sẻ bộ từ');
      return;
    }
    const shareSlug = set.shareSlug || `${slugify(set.title)}-${set.id.slice(-6)}`;
    const updatedSet = { ...set, isPublic: true, shareSlug };
    setSets((prev) => prev.map((entry) => (entry.id === set.id ? updatedSet : entry)));
    try {
      await upsertUserSet(mapSetToUserRow(user.id, updatedSet));
      const shareUrl = `${window.location.origin}?shared=${shareSlug}`;
      await navigator.clipboard.writeText(shareUrl);
      setSyncState('Đã tạo link chia sẻ và sao chép vào clipboard');
    } catch (error) {
      console.error(error);
      setSyncState('Không thể tạo link chia sẻ');
    }
  };

  const handleDeleteCustomSet = async (setId = activeSet?.id) => {
    const targetSet = sets.find((set) => set.id === setId);
    if (!targetSet?.isCustom) return;

    const nextSet =
      sets.find((set) => set.id !== targetSet.id && set.language === langFilter) ||
      sets.find((set) => set.id !== targetSet.id) ||
      null;

    setSets((prev) => prev.filter((set) => set.id !== targetSet.id));
    if (nextSet) {
      setActiveSetId(nextSet.id);
      resetStudyProgress();
    }
    if (user) {
      try {
        await deleteUserSet(targetSet.id, user.id);
        setSyncState('Đã xóa bộ từ cá nhân');
      } catch (error) {
        console.error(error);
        setSyncState('Không thể xóa bộ từ trên Supabase');
      }
    }
  };

  const profileCard = null;
  const activeSetTitle = formatSetTitle(activeSet?.title);
  const loadingPanel = (
    <div className="card-pro w-full max-w-3xl p-8 text-center text-sm text-slate-500 dark:text-slate-300">
      Đang tải giao diện học tập...
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50 font-inter dark:bg-slate-950">
      <Suspense fallback={null}>
        <CreateSetModal open={showCreateSetModal} onClose={() => setShowCreateSetModal(false)} onCreate={handleCreateSet} />
      </Suspense>

      <AppSidebar
        sidebarOpen={sidebarOpen}
        langFilter={langFilter}
        allSets={sets}
        activeSetId={activeSetId}
        activeSet={activeSet}
        formatSetTitle={formatSetTitle}
        fileInputRef={fileInputRef}
        onClose={() => setSidebarOpen(false)}
        onLangFilterChange={handleLangFilterChange}
        onSelectSet={handleSelectSet}
        onFileUpload={handleFileUpload}
        onDeleteCustomSet={handleDeleteCustomSet}
        onOpenCreateSet={() => setShowCreateSetModal(true)}
      />

      <div className="flex min-h-screen flex-col transition-all duration-300 lg:pl-80">
        <AppTopBar
          activeSetTitle={activeSetTitle}
          activeTab={activeTab}
          darkMode={darkMode}
          profile={profile}
          searchTerm={searchTerm}
          showAuthMenu={showAuthPage && Boolean(user)}
          syncState={syncState}
          tabs={tabs}
          user={user}
          onOpenSidebar={() => setSidebarOpen(true)}
          onSearchChange={setSearchTerm}
          onToggleDarkMode={() => setDarkMode((value) => !value)}
          onTabChange={handleTabChange}
          onAuthButtonClick={() => (user ? setShowAuthPage((value) => !value) : setShowAuthPage(true))}
          onOpenProfileSettings={() => {
            setShowAuthPage(false);
            setShowProfileSettings(true);
          }}
          onOpenStats={() => handleTabChange('stats')}
          onSignOut={handleSignOut}
        />

        <main className="flex flex-1 flex-col items-center gap-6 p-4 sm:p-8">
          {activeTab === 'today' ? (
            <Suspense fallback={loadingPanel}>
              <TodayDashboard
                activeSetTitle={activeSetTitle}
                queueOptions={queueOptions}
                queueMode={studyQueueMode}
                summary={globalSummary}
                resumeLabel={getResumeLabel(sets, lastSession)}
                onSelectQueue={(mode) => {
                  handleStudyQueueChange(mode);
                  handleTabChange('flashcard');
                }}
                onOpenFlashcard={() => handleTabChange('flashcard')}
                onOpenStats={() => handleTabChange('stats')}
              />
            </Suspense>
          ) : activeTab === 'stats' ? (
            <Suspense fallback={loadingPanel}>
              <StatsDashboard
                summary={globalSummary}
                activeSetTitle={activeSetTitle}
                dailySeries={dailySeries}
                weeklySeries={weeklySeries}
                setDetails={setDetails}
                exampleHistory={exampleHistory}
                onOpenSet={handleOpenSet}
                onShareSet={handleShareSet}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                posFilter={posFilter}
                setPosFilter={setPosFilter}
                showDueTodayOnly={showDueTodayOnly}
                setShowDueTodayOnly={setShowDueTodayOnly}
                posOptions={posOptions}
                resetStudyProgress={resetStudyProgress}
              />
            </Suspense>
          ) : (
            <div className="flex w-full max-w-6xl flex-col items-center pb-20">
              {activeTab === 'flashcard' && currentWord ? (
                <FlashcardWorkspace
                  activeSet={activeSet}
                  activeSetTitle={activeSetTitle}
                  activeWordRef={activeWordRef}
                  audioSettings={audioSettings}
                  currentWord={currentWord}
                  currentWordIndex={currentWordIndex}
                  currentWordNextReviewLabel={currentWordNextReviewLabel}
                  formatStatusLabel={getWordStatusLabel}
                  isMeaningVisible={isMeaningVisible}
                  onAccentChange={(accent) => setAudioSettings((prev) => ({ ...prev, accent }))}
                  onAudioRateToggle={() => setAudioSettings((prev) => ({ ...prev, rate: prev.rate === 1 ? 0.78 : 1 }))}
                  onAutoPlayToggle={() => setAudioSettings((prev) => ({ ...prev, autoPlay: !prev.autoPlay }))}
                  onMeaningToggle={() => setIsMeaningVisible((value) => !value)}
                  onPlayAudio={() => playAudio(currentWord.term, activeSet.language)}
                  onQueueModeChange={handleStudyQueueChange}
                  onGenerateExamplesForCurrentWord={handleGenerateExamplesForCurrentWord}
                  onGenerateExamplesForSet={handleGenerateExamplesForSet}
                  onReview={handleReviewAction}
                  onSelectWord={(index) => {
                    if (index < 0 || index >= words.length) return;
                    setCurrentWordIndex(index);
                    setIsMeaningVisible(false);
                  }}
                  onShareSet={() => handleShareSet({ id: activeSet.id })}
                  exampleGeneration={exampleGeneration}
                  queueMode={studyQueueMode}
                  queueOptions={queueOptions}
                  words={words}
                />
              ) : null}

              {activeTab === 'flashcard' && !currentWord ? (
                <div className="card-pro w-full max-w-3xl p-10 text-center">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Không có từ phù hợp với bộ lọc hiện tại</h3>
                  <p className="mt-2 text-slate-500">Hãy đổi trạng thái, từ loại hoặc tắt bộ lọc ôn hôm nay để tiếp tục học.</p>
                </div>
              ) : null}

              {activeTab === 'typing' ? (
                !isCopyingStarted ? (
                  <div className="card-pro flex w-full max-w-4xl flex-col items-center p-5 text-center sm:p-10">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                      <Pencil size={32} />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">Chép từ vựng</h2>
                    <p className="mb-8 max-w-md text-sm text-slate-500 sm:text-base">Chọn từ chưa thuộc và bắt đầu chép để ghi nhớ từ mới lâu hơn.</p>
                    <div className="mb-8 grid w-full grid-cols-2 gap-2 sm:mb-12 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                      {activeWordsBase.slice(0, 12).map((word) => (
                        <div key={word.id} className="control-chip rounded-2xl px-4 py-4 text-center shadow-sm">
                          <div className="truncate text-sm font-bold text-slate-800 dark:text-slate-100 sm:text-base">
                            {word.term} ({String(word.pos || '').toLowerCase()})
                          </div>
                          <div className="mt-1 truncate text-[11px] text-slate-500">{word.meaning}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setIsCopyingStarted(true)} className="btn-premium btn-primary-pro w-full px-12 py-4 text-base sm:w-auto sm:text-lg">
                      Bắt đầu chép ({activeWordsBase.length} từ)
                    </button>
                  </div>
                ) : (
                  <Suspense fallback={loadingPanel}>
                    <WriteMode key={`${activeSetId}-typing`} words={activeWordsBase} playAudio={playAudio} lang={activeSet.language} showHint={false} />
                  </Suspense>
                )
              ) : null}

              {activeTab === 'quiz' ? (
                <Suspense fallback={loadingPanel}>
                  <div className="w-full max-w-3xl">
                    <QuizMode key={`${activeSetId}-quiz`} words={activeWordsBase} playAudio={playAudio} lang={activeSet.language} />
                  </div>
                </Suspense>
              ) : null}

              {activeTab === 'match' ? (
                <Suspense fallback={loadingPanel}>
                  <div className="w-full max-w-5xl">
                    <MatchMode key={`${activeSetId}-match`} words={activeWordsBase} />
                  </div>
                </Suspense>
              ) : null}

              {activeTab === 'fill' ? (
                <Suspense fallback={loadingPanel}>
                  <div className="w-full max-w-xl">
                    <WriteMode key={`${activeSetId}-fill`} words={activeWordsBase} playAudio={playAudio} lang={activeSet.language} showHint />
                  </div>
                </Suspense>
              ) : null}

              {activeTab === 'listening' ? (
                <Suspense fallback={loadingPanel}>
                  <div className="w-full max-w-xl">
                    <ListeningMode key={`${activeSetId}-listening`} words={activeWordsBase} playAudio={playAudio} lang={activeSet.language} />
                  </div>
                </Suspense>
              ) : null}
            </div>
          )}
        </main>
      </div>

      {showAuthPage && !user ? (
        <Suspense fallback={null}>
          <AuthPage onSignIn={handleEmailSignIn} onSignUp={handleEmailSignUp} onGoogleSignIn={handleGoogleSignIn} onBack={() => setShowAuthPage(false)} />
        </Suspense>
      ) : null}
      {sidebarOpen ? <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-[2px] transition-opacity lg:hidden" /> : null}
    </div>
  );
}
