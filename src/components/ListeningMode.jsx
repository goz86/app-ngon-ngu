import React, { useState } from 'react';
import { Check, HelpCircle, Volume2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function ListeningMode({ words, playAudio, lang }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [feedback, setFeedback] = useState(null);

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

  const handleSubmit = (event) => {
    event.preventDefault();

    if (inputVal.trim().toLowerCase() === currentWord.term.toLowerCase()) {
      setFeedback('correct');

      setTimeout(() => {
        if (currentIndex < words.length - 1) {
          setCurrentIndex((index) => index + 1);
          setInputVal('');
          setFeedback(null);
          return;
        }

        alert('Bạn đã hoàn thành bài luyện nghe.');
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
    <div className="card-pro w-full max-w-xl px-5 py-10 sm:p-16 flex flex-col items-center relative overflow-hidden transition-all">
      <div className="w-full mb-10 sm:mb-12">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] sm:text-[11px] font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            Luyện nghe {targetLangText}
          </span>
          <span className="text-xs font-bold text-primary">
            {currentIndex + 1} / {words.length}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <button
        onClick={() => playAudio(currentWord.term, lang)}
        className="group relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-primary text-white flex items-center justify-center shadow-premium transition-all hover:scale-105 active:scale-95 mb-8 sm:mb-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 animate-ping group-hover:block hidden" />
        <Volume2 size={64} className="group-hover:scale-110 transition-transform" />
      </button>

      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-8 sm:mb-10 text-center">
        Nghe audio và điền {targetLangText}
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-8 sm:space-y-10 flex flex-col items-center">
        <div className="w-full relative group">
          <input
            type="text"
            value={inputVal}
            onChange={(event) => setInputVal(event.target.value)}
            placeholder={`Gõ nội dung ${targetLangText.toLowerCase()}...`}
            className={cn(
              'input-pro text-center text-lg sm:text-xl font-bold tracking-tight',
              feedback === 'correct' && 'border-accent-success ring-2 ring-accent-success/20',
              feedback === 'incorrect' && 'border-accent-danger ring-2 ring-accent-danger/20',
            )}
          />
          {feedback === 'correct' && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-accent-success animate-bounce">
              <Check />
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => alert(`Nghĩa: ${currentWord.meaning}`)}
            className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors flex items-center gap-2"
          >
            <HelpCircle size={14} /> Gợi ý nghĩa
          </button>
          <button type="submit" className="btn-premium btn-primary-pro px-10 sm:px-12 py-3.5 sm:py-4 text-base sm:text-lg">
            Kiểm tra
          </button>
        </div>
      </form>
    </div>
  );
}
