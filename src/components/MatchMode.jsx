import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function MatchMode({ words }) {
  const [selected, setSelected] = useState([]);
  const [matched, setMatched] = useState([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const isComplete = batchIndex * 6 >= words.length && words.length > 0;

  const cards = useMemo(() => {
    const startIndex = batchIndex * 6;
    const currentWords = words.slice(startIndex, startIndex + 6);
    const newCards = currentWords.flatMap((word) => [
      { id: `${word.id}_term`, type: 'term', text: word.term, matchId: word.id, pos: word.pos },
      { id: `${word.id}_meaning`, type: 'meaning', text: word.meaning, matchId: word.id },
    ]);

    return newCards.sort((a, b) => {
      if (a.type !== b.type) {
        return batchIndex % 2 === 0 ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type);
      }

      return a.id.localeCompare(b.id);
    });
  }, [batchIndex, words]);

  const handleCardClick = (card) => {
    if (matched.includes(card.id) || selected.some((picked) => picked.id === card.id)) {
      return;
    }

    const nextSelected = [...selected, card];
    setSelected(nextSelected);

    if (nextSelected.length !== 2) {
      return;
    }

    if (nextSelected[0].matchId === nextSelected[1].matchId) {
      setTimeout(() => {
        setMatched((prev) => {
          const updated = [...prev, nextSelected[0].id, nextSelected[1].id];
          if (updated.length === cards.length) {
            setTimeout(() => {
              setBatchIndex((value) => value + 1);
              setSelected([]);
              setMatched([]);
            }, 500);
          }
          return updated;
        });
        setSelected([]);
      }, 250);
      return;
    }

    setTimeout(() => setSelected([]), 700);
  };

  if (isComplete) {
    return (
      <div className="card-pro w-full max-w-3xl p-10 text-center">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Bạn đã hoàn thành trò ghép thẻ</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Bạn đã ghép xong toàn bộ {words.length} từ trong bộ này.
        </p>
        <button
          onClick={() => {
            setBatchIndex(0);
            setSelected([]);
            setMatched([]);
          }}
          className="btn-premium btn-primary-pro px-8 py-3"
        >
          Chơi lại
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl flex flex-col items-center">
      <div className="w-full mb-8 flex justify-between items-center px-4">
        <div className="flex flex-col">
          <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            Ghép thẻ
          </h4>
          <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">Ghép từ vựng với nghĩa</div>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-2xl text-sm font-bold shadow-sm border border-primary/5">
          {Math.min(batchIndex * 6, words.length)} / {words.length}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
        {cards.map((card) => {
          const isSelected = selected.some((picked) => picked.id === card.id);
          const isMatched = matched.includes(card.id);
          const isIncorrectPair = selected.length === 2 && isSelected && selected[0].matchId !== selected[1].matchId;
          const isCorrectPair = selected.length === 2 && isSelected && selected[0].matchId === selected[1].matchId;

          return (
            <button
              key={card.id}
              disabled={isMatched}
              onClick={() => handleCardClick(card)}
              className={cn(
                'h-28 sm:h-32 px-4 rounded-[22px] border-2 transition-all duration-300 flex flex-col items-center justify-center text-center relative bg-white dark:bg-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.05)]',
                !isSelected && !isMatched && 'border-slate-200 dark:border-slate-800 hover:border-primary/40 hover:scale-[1.02]',
                isSelected && !isIncorrectPair && !isCorrectPair && 'border-primary text-primary shadow-lg shadow-primary/10 scale-105 z-10',
                isIncorrectPair && 'bg-accent-danger/5 border-accent-danger text-accent-danger',
                isCorrectPair && 'bg-accent-success/5 border-accent-success text-accent-success',
                isMatched && 'opacity-0 scale-90 pointer-events-none',
              )}
            >
              <span
                className={cn(
                  'text-[15px] sm:text-[17px] font-bold leading-tight',
                  card.type === 'term' ? 'text-slate-800 dark:text-white' : 'text-slate-700 dark:text-slate-200',
                )}
              >
                {card.text}
              </span>
              {card.type === 'term' && card.pos && (
                <span className="mt-2 px-2 py-0.5 bg-primary/10 text-[10px] font-black uppercase rounded-full text-primary border border-primary/10">
                  {String(card.pos).toLowerCase()}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
