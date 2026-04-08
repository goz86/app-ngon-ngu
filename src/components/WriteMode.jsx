import React, { useState } from 'react';
import { ArrowLeftRight, ChevronRight, Lightbulb, Volume2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function formatPos(pos) {
  const map = {
    n: 'Danh từ',
    noun: 'Danh từ',
    v: 'Động từ',
    verb: 'Động từ',
    adj: 'Tính từ',
    adjective: 'Tính từ',
    adv: 'Trạng từ',
    adverb: 'Trạng từ',
    prep: 'Giới từ',
    pron: 'Đại từ',
    conj: 'Liên từ',
    det: 'Từ hạn định',
    num: 'Số từ',
    ord: 'Số thứ tự',
  };

  return map[String(pos || '').trim().toLowerCase()] || pos || 'Từ vựng';
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

export default function WriteMode({ words, playAudio, lang, showHint = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isReverseMode, setIsReverseMode] = useState(false);

  const currentWord = words[currentIndex];
  const progress = words.length ? ((currentIndex + 1) / words.length) * 100 : 0;
  const targetLangText = lang === 'ko' ? 'TIẾNG HÀN' : 'TIẾNG ANH';

  if (!currentWord) {
    return (
      <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl text-slate-500">
        Không có từ vựng.
      </div>
    );
  }

  const promptText = showHint
    ? isReverseMode
      ? currentWord.term
      : currentWord.meaning
    : currentWord.meaning;
  const answerText = showHint
    ? isReverseMode
      ? currentWord.meaning
      : currentWord.term
    : currentWord.term;
  const directionLabel = showHint
    ? isReverseMode
      ? 'TIẾNG ANH'
      : targetLangText
    : targetLangText;
  const helperDirection = showHint
    ? isReverseMode
      ? `Tiếng Anh ${String.fromCharCode(8250)} Nghĩa tiếng Việt`
      : `Nghĩa tiếng Việt ${String.fromCharCode(8250)} ${targetLangText}`
    : `Nghĩa tiếng Việt ${String.fromCharCode(8250)} ${targetLangText}`;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (normalizeText(inputVal) === normalizeText(answerText)) {
      setFeedback('correct');

      setTimeout(() => {
        if (currentIndex < words.length - 1) {
          setCurrentIndex((index) => index + 1);
          setInputVal('');
          setFeedback(null);
          return;
        }

        alert(showHint ? 'Bạn đã hoàn thành bài điền từ vựng.' : 'Bạn đã hoàn thành bài luyện viết.');
        setCurrentIndex(0);
        setInputVal('');
        setFeedback(null);
      }, 700);

      return;
    }

    setFeedback('incorrect');
    setTimeout(() => setFeedback(null), 700);
  };

  return (
    <div className="card-pro w-full max-w-2xl px-5 py-10 sm:p-12 flex flex-col items-center relative overflow-hidden transition-all">
      <div className="w-full mb-10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] sm:text-[11px] font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            {showHint ? `Điền ${directionLabel}` : `Chép ${targetLangText}`}
          </span>
          <span className="text-xs font-bold text-primary">
            {currentIndex + 1} / {words.length}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-4 mb-4">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase flex items-center gap-2 text-center">
          {helperDirection.includes('›')
            ? helperDirection
            : (
              <>
                Nghĩa tiếng Việt <ChevronRight size={10} strokeWidth={4} /> {directionLabel}
              </>
            )}
        </p>
        {showHint && (
          <button
            type="button"
            onClick={() => {
              setIsReverseMode((value) => !value);
              setInputVal('');
              setFeedback(null);
            }}
            className="btn-premium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2"
          >
            <ArrowLeftRight size={15} /> Đảo chiều
          </button>
        )}
      </div>

      <div className="bg-primary/5 dark:bg-primary/10 w-full min-h-[160px] sm:min-h-[180px] p-6 sm:p-10 rounded-3xl text-center mb-8 sm:mb-10 border border-primary/10 relative group">
        <h2
          className={cn(
            'font-bold text-slate-800 dark:text-white leading-tight',
            promptText.length > 20 ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl',
          )}
        >
          {promptText}
        </h2>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-sm">
          {!showHint && (
            <span className="text-sm font-bold text-slate-700">
              {currentWord.term} ({String(currentWord.pos || '').toLowerCase()})
            </span>
          )}
          {showHint && (
            <span className="text-sm font-bold text-slate-700">
              {String(currentWord.pos || '').toLowerCase()}
            </span>
          )}
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs font-semibold text-primary">{formatPos(currentWord.pos)}</span>
        </div>
        {!showHint && (
          <button
            onClick={() => playAudio(currentWord.term, lang)}
            className="absolute bottom-4 right-4 w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center text-primary hover:bg-primary hover:text-white"
          >
            <Volume2 size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 sm:space-y-8">
        <input
          type="text"
          value={inputVal}
          onChange={(event) => setInputVal(event.target.value)}
          placeholder={
            showHint
              ? `Nhập ${isReverseMode ? 'nghĩa tiếng Việt' : `từ ${targetLangText.toLowerCase()}`}...`
              : `Nhập từ ${targetLangText.toLowerCase()}...`
          }
          autoFocus
          className={cn(
            'input-pro text-center text-xl font-bold',
            feedback === 'correct' && 'border-accent-success ring-2 ring-accent-success/20',
            feedback === 'incorrect' && 'border-accent-danger ring-2 ring-accent-danger/20',
          )}
        />

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => playAudio(currentWord.term, lang)}
            className="btn-premium btn-secondary-pro flex-1 sm:flex-initial py-3 dark:bg-slate-800"
          >
            <Lightbulb size={18} /> Gợi ý phát âm
          </button>
          <button type="submit" className="btn-premium btn-primary-pro flex-1 sm:flex-initial py-3 text-lg">
            Kiểm tra
          </button>
        </div>
      </form>
    </div>
  );
}
