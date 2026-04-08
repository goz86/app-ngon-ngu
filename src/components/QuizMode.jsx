import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, Check, HelpCircle, RefreshCw, Volume2, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function stableOrder(value) {
  return [...value].sort((a, b) => a.id.localeCompare(b.id));
}

export default function QuizMode({ words, playAudio, lang }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isReverseMode, setIsReverseMode] = useState(false);

  const currentWord = words[currentIndex];
  const progress = words.length ? ((currentIndex + 1) / words.length) * 100 : 0;

  const options = useMemo(() => {
    if (!currentWord || words.length < 4) {
      return [];
    }

    const orderedPool = stableOrder(words.filter((word) => word.id !== currentWord.id));
    const start = currentIndex % orderedPool.length;
    const wrongWords = orderedPool.slice(start, start + 3);

    if (wrongWords.length < 3) {
      wrongWords.push(...orderedPool.slice(0, 3 - wrongWords.length));
    }

    return stableOrder([...wrongWords, currentWord]).sort((a, b) => {
      if (a.id === currentWord.id) {
        return currentIndex % 2 === 0 ? -1 : 1;
      }

      if (b.id === currentWord.id) {
        return currentIndex % 2 === 0 ? 1 : -1;
      }

      return a.id.localeCompare(b.id);
    });
  }, [currentIndex, currentWord, words]);

  if (!currentWord || words.length < 4) {
    return (
      <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500">
        Cần ít nhất 4 từ để chơi trắc nghiệm.
      </div>
    );
  }

  const handleSelect = (option) => {
    if (selected) {
      return;
    }

    setSelected(option);

    if (option.id === currentWord.id) {
      setTimeout(() => {
        if (currentIndex < words.length - 1) {
          setCurrentIndex((index) => index + 1);
          setSelected(null);
          setShowMeaning(false);
          return;
        }

        alert('Bạn đã hoàn thành bài trắc nghiệm.');
        setCurrentIndex(0);
        setSelected(null);
        setShowMeaning(false);
      }, 800);
    }
  };

  const labels = ['A', 'B', 'C', 'D'];
  const promptText = isReverseMode ? currentWord.meaning : currentWord.term;

  return (
    <div className="card-pro w-full max-w-3xl overflow-hidden flex flex-col items-center p-8 sm:p-12 relative">
      <div className="w-full mb-10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            Trắc nghiệm
          </span>
          <span className="text-xs font-bold text-primary">
            {currentIndex + 1} / {words.length}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-5">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-800 dark:text-white tracking-tight leading-tight">
            {promptText}
          </h2>
          {!isReverseMode && (
            <button
              onClick={() => playAudio(currentWord.term, lang)}
              className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
            >
              <Volume2 size={18} />
            </button>
          )}
        </div>
        <div className="mt-4 text-primary font-bold text-sm tracking-widest uppercase opacity-70 italic">
          {isReverseMode ? 'Chọn từ tiếng Anh đúng' : 'Chọn nghĩa đúng'}
        </div>
        {showMeaning && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Gợi ý: {isReverseMode ? currentWord.term : currentWord.meaning}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
        {options.map((option, index) => {
          const isCorrect = option.id === currentWord.id;
          const isSelected = selected?.id === option.id;
          const optionText = isReverseMode ? option.term : option.meaning;

          return (
            <button
              key={option.id}
              disabled={Boolean(selected)}
              onClick={() => handleSelect(option)}
              className={cn(
                'group flex min-h-[104px] items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-left relative overflow-hidden sm:gap-4 sm:p-5',
                !selected && 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-primary/50 hover:bg-primary/5',
                selected && isCorrect && 'border-accent-success bg-accent-success/5 text-accent-success shadow-lg shadow-accent-success/10',
                selected && isSelected && !isCorrect && 'border-accent-danger bg-accent-danger/5 text-accent-danger shadow-lg shadow-accent-danger/10',
                selected && !isSelected && !isCorrect && 'opacity-40 grayscale',
              )}
            >
              <div
                className={cn(
                  'h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl font-bold text-sm transition-colors',
                  !selected && 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-primary group-hover:text-white',
                  selected && isCorrect && 'bg-accent-success text-white',
                  selected && isSelected && !isCorrect && 'bg-accent-danger text-white',
                  selected && !isSelected && !isCorrect && 'bg-slate-100 dark:bg-slate-800 text-slate-400',
                )}
              >
                {labels[index]}
              </div>
              <span className="text-[15px] font-semibold leading-snug sm:text-[17px]">{optionText}</span>

              {selected && isCorrect && (
                <div className="absolute top-3 right-3 text-accent-success">
                  <Check size={16} />
                </div>
              )}
              {selected && isSelected && !isCorrect && (
                <div className="absolute top-3 right-3 text-accent-danger">
                  <X size={16} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-12 w-full flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-8 opacity-90">
        <button
          onClick={() => {
            setCurrentIndex((index) => (index + 1 < words.length ? index + 1 : 0));
            setSelected(null);
            setShowMeaning(false);
          }}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-primary transition-colors"
        >
          <RefreshCw size={14} /> Bỏ qua
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsReverseMode((value) => !value)}
            className="btn-premium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2.5"
          >
            <ArrowLeftRight size={16} /> Đảo chiều
          </button>
          <button
            onClick={() => setShowMeaning((value) => !value)}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-all"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
