import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Sparkles, Wand2, X } from 'lucide-react';
import { parseManualWordRows } from '../lib/vocabularySchema';
import { generateVocabularySetWithAI, getAiStudyDefaults, hasAiStudyGenerator } from '../lib/aiStudyGenerator';

function serializeRows(words) {
  return (words || [])
    .map((word) =>
      [
        word.term || '',
        word.pos || 'N',
        word.meaning || '',
        (word.examples || []).join('; '),
        (word.exampleTranslations || []).join('; '),
        word.level || '',
        word.topic || '',
        Array.isArray(word.tags) ? word.tags.join(', ') : '',
      ].join(' | '),
    )
    .join('\n');
}

export default function CreateSetModal({ open, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('en');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState('');
  const [aiCount, setAiCount] = useState(18);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const aiDefaults = useMemo(() => getAiStudyDefaults(language), [language]);

  const parsed = useMemo(
    () =>
      parseManualWordRows(rows, {
        language,
        idPrefix: `cw_${Date.now()}`,
        defaultTopic: topic,
        defaultLevel: level,
      }),
    [language, level, rows, topic],
  );

  useEffect(() => {
    if (!open) return;
    setTopic((current) => current || aiDefaults.topic);
    setLevel((current) => current || aiDefaults.level);
    setDescription((current) => current || aiDefaults.description);
    setAiCount(aiDefaults.count);
  }, [aiDefaults, open]);

  const handleLanguageChange = (nextLanguage) => {
    const nextDefaults = getAiStudyDefaults(nextLanguage);
    setLanguage(nextLanguage);
    setTopic(nextDefaults.topic);
    setLevel(nextDefaults.level);
    setDescription(nextDefaults.description);
    setAiCount(nextDefaults.count);
  };

  if (!open) return null;

  const resetForm = () => {
    setTitle('');
    setLanguage('en');
    setTopic('');
    setLevel('');
    setDescription('');
    setRows('');
    setAiCount(18);
    setAiError('');
  };

  const handleCreate = () => {
    if (!title.trim() || parsed.words.length === 0) return;

    onCreate({
      title: title.trim(),
      language,
      topic: topic.trim() || aiDefaults.topic,
      level: level.trim() || aiDefaults.level,
      description: description.trim(),
      words: parsed.words,
    });

    resetForm();
  };

  const handleGenerateWithAi = async () => {
    try {
      setAiLoading(true);
      setAiError('');

      const generated = await generateVocabularySetWithAI({
        language,
        topic: topic.trim() || aiDefaults.topic,
        count: aiCount,
        title: title.trim() || '',
        level: level.trim() || aiDefaults.level,
        description: description.trim() || aiDefaults.description,
      });

      if (!generated.words.length) {
        throw new Error('Gemini chưa trả về bộ từ hợp lệ.');
      }

      setTitle(generated.title);
      setTopic(generated.topic);
      setLevel(generated.level);
      setDescription(generated.description);
      setRows(serializeRows(generated.words));

      onCreate(generated);
      resetForm();
    } catch (error) {
      if (String(error?.message || '').includes('missing_gemini_key')) {
        setAiError('Chưa tìm thấy Gemini API key trong môi trường Vite.');
      } else {
        setAiError(`Gemini chưa tạo được bộ từ: ${String(error?.message || error)}`);
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-[30px] border border-slate-200 bg-white p-4 shadow-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black text-slate-400">{'Bộ từ cá nhân'}</p>
            <h2 className="mt-1.5 text-xl font-bold text-slate-900 sm:text-2xl">{'Tạo bộ từ trực tiếp trên web'}</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              {'Mỗi dòng theo mẫu '}
              <span className="font-semibold text-slate-700">term | pos | meaning | examples | exampleTranslations | level | topic | tags</span>.
            </p>
          </div>
          <button onClick={onClose} className="rounded-2xl bg-slate-100 p-3 text-slate-500 transition hover:bg-slate-200">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 rounded-[24px] border border-primary/15 bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-[11px] font-black text-primary">
                <Sparkles size={13} />
                {'Gemini Studio'}
              </div>
              <h3 className="mt-2.5 text-base font-bold text-slate-900 sm:text-lg">{'Tạo nhanh bộ từ đúng trình độ'}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                {language === 'en'
                  ? 'Tiếng Anh sẽ mặc định tạo cho người mới bắt đầu, ưu tiên từ vựng giao tiếp và tình huống hằng ngày.'
                  : 'Tiếng Hàn sẽ mặc định tạo cho người học TOPIK 5-6, ưu tiên từ vựng nâng cao, học thuật và xã hội.'}
              </p>
            </div>

            <div className="rounded-2xl bg-white/80 px-3.5 py-3 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-primary/10 md:max-w-[240px]">
              <div>
                {'Mức mặc định: '}<span className="font-extrabold text-slate-900">{aiDefaults.level}</span>
              </div>
              <div className="mt-1">{'Mỗi từ sẽ cố gắng có 2 ví dụ nếu Gemini trả về đầy đủ.'}</div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="space-y-2">
              <span className="text-xs font-black text-slate-400">{'Số lượng từ AI'}</span>
              <select
                value={aiCount}
                onChange={(event) => setAiCount(Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-primary"
              >
                <option value={12}>{'12 từ'}</option>
                <option value={18}>{'18 từ'}</option>
                <option value={24}>{'24 từ'}</option>
              </select>
            </label>

            <button
              onClick={handleGenerateWithAi}
              disabled={!hasAiStudyGenerator() || aiLoading}
              className="btn-premium mt-auto flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {aiLoading ? 'Gemini đang tạo...' : 'Tạo nhanh bằng Gemini'}
            </button>
          </div>

          {aiError ? <div className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{aiError}</div> : null}
          {!hasAiStudyGenerator() ? (
            <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              {'Chưa tìm thấy `VITE_GEMINI_API_KEY`, nên nút tạo nhanh bằng AI sẽ chưa hoạt động.'}
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-black text-slate-400">{'Tên bộ từ'}</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-primary focus:bg-white"
              placeholder={aiDefaults.title}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black text-slate-400">{'Ngôn ngữ'}</span>
            <select
              value={language}
              onChange={(event) => handleLanguageChange(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-primary focus:bg-white"
            >
              <option value="en">{'Tiếng Anh'}</option>
              <option value="ko">{'Tiếng Hàn'}</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black text-slate-400">{'Chủ đề'}</span>
            <input
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-primary focus:bg-white"
              placeholder={aiDefaults.topic}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black text-slate-400">{'Trình độ'}</span>
            <input
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-primary focus:bg-white"
              placeholder={aiDefaults.level}
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-black text-slate-400">{'Mô tả'}</span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-primary focus:bg-white"
              placeholder={aiDefaults.description}
            />
          </label>
        </div>

        <label className="mt-4 block space-y-2">
          <span className="text-xs font-black text-slate-400">{'Danh sách từ'}</span>
          <textarea
            value={rows}
            onChange={(event) => setRows(event.target.value)}
            className="min-h-[180px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium outline-none transition focus:border-primary focus:bg-white sm:min-h-[220px]"
            placeholder={
              'hello | Expr | xin chào | Hello, how are you?; Hello, everyone. | Xin chào, bạn khỏe không?; Xin chào mọi người. | Beginner (A1-A2) | Everyday communication | greeting,common\n분석하다 | V | phân tích | 데이터를 분석해야 합니다.; 문제를 차분히 분석해 보세요. | Cần phải phân tích dữ liệu.; Hãy thử bình tĩnh phân tích vấn đề. | TOPIK 5-6 | Xã hội, học thuật | topik,academic'
            }
          />
        </label>

        <div className="mt-4 flex flex-col gap-4 rounded-[24px] bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-bold text-slate-700">{parsed.words.length} {'từ hợp lệ'}</div>
            <div className="mt-1 text-xs text-slate-500">
              {parsed.duplicateCount > 0 ? `Đã tự gộp ${parsed.duplicateCount} dòng trùng. ` : ''}
              {'App sẽ giữ lại metadata như level, topic, tags, ví dụ và giải thích nếu bạn nhập đủ.'}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-white">
              {'Đóng'}
            </button>
            <button onClick={handleCreate} className="btn-premium rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20">
              <Plus size={16} />
              {'Tạo bộ từ'}
            </button>
          </div>
        </div>

        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
          <Sparkles size={14} />
          {'Bộ từ tạo mới sẽ sẵn sàng cho import lớn, tạo ví dụ AI và đồng bộ Supabase khi bạn đăng nhập.'}
        </div>
      </div>
    </div>
  );
}
