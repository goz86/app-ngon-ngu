import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  List,
  LoaderCircle,
  Settings2,
  Share2,
  Sparkles,
  Volume2,
  WandSparkles,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function FlashcardWorkspace({
  activeSet,
  activeSetTitle,
  activeWordRef,
  audioSettings,
  currentWord,
  currentWordIndex,
  currentWordNextReviewLabel,
  exampleGeneration,
  formatStatusLabel,
  isMeaningVisible,
  onAccentChange,
  onAudioRateToggle,
  onAutoPlayToggle,
  onGenerateExamplesForCurrentWord,
  onGenerateExamplesForSet,
  onMeaningToggle,
  onPlayAudio,
  onQueueModeChange,
  onReview,
  onSelectWord,
  onShareSet,
  queueMode,
  queueOptions,
  words,
}) {
  const [mobileAudioOpen, setMobileAudioOpen] = useState(false);
  const [mobileWordListOpen, setMobileWordListOpen] = useState(false);

  const { rememberedCount, learningCount, missingExampleCount } = useMemo(
    () =>
      words.reduce(
        (summary, word) => {
          const label = formatStatusLabel(word);
          if (label === 'Đã nhớ' || label === 'Thành thạo') summary.rememberedCount += 1;
          if (label === 'Đang học' || label === 'Cần ôn') summary.learningCount += 1;
          if (!(word.examples || []).length && !word.example) summary.missingExampleCount += 1;
          return summary;
        },
        { rememberedCount: 0, learningCount: 0, missingExampleCount: 0 },
      ),
    [formatStatusLabel, words],
  );

  const isGeneratingCurrentWord = exampleGeneration.currentWordId === currentWord.id && !exampleGeneration.isBulkRunning;
  const isBulkGenerating = exampleGeneration.isBulkRunning;
  const bulkProgressPercent =
    exampleGeneration.total > 0 ? Math.round((exampleGeneration.completed / exampleGeneration.total) * 100) : 0;

  return (
    <div className="flex w-full max-w-[1240px] flex-col gap-4 xl:gap-7">
      <div className="workspace-panel mx-auto w-full max-w-4xl rounded-[30px] p-3 sm:rounded-[34px] sm:p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="block truncate font-display text-[10px] font-extrabold uppercase tracking-[0.32em] text-slate-400">
                
              </span>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="stat-pill inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-200">
                  {formatStatusLabel(currentWord)}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                  Lần ôn tiếp theo: {currentWordNextReviewLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeSet.isCustom ? (
                <button
                  onClick={onShareSet}
                  className="control-chip flex h-10 w-10 items-center justify-center rounded-2xl"
                  aria-label="Chia sẻ bộ từ"
                >
                  <Share2 size={16} />
                </button>
              ) : null}
              <button
                onClick={() => setMobileAudioOpen((value) => !value)}
                className="control-chip flex h-10 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-bold sm:hidden"
              >
                <Settings2 size={15} />
                Âm thanh
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {queueOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onQueueModeChange(option.id)}
                className={cn(
                  'whitespace-nowrap rounded-full border px-3 py-2 text-xs font-bold transition-all',
                  queueMode === option.id
                    ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                    : 'control-chip text-slate-600 dark:text-slate-200',
                )}
              >
                {option.label} {option.count}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="surface-muted rounded-2xl px-3 py-2">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Tiến độ</div>
              <div className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                {currentWordIndex + 1}/{words.length}
              </div>
            </div>
            <div className="surface-muted rounded-2xl px-3 py-2">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Đã nhớ</div>
              <div className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-300">{rememberedCount}</div>
            </div>
            <div className="surface-muted rounded-2xl px-3 py-2">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Đang học</div>
              <div className="mt-1 text-sm font-bold text-sky-600 dark:text-sky-300">{learningCount}</div>
            </div>
            <div className="surface-muted rounded-2xl px-3 py-2">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Thiếu ví dụ</div>
              <div className="mt-1 text-sm font-bold text-amber-600 dark:text-amber-300">{missingExampleCount}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-500 transition-all duration-300"
            style={{ width: `${words.length ? ((currentWordIndex + 1) / words.length) * 100 : 0}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {activeSet.language === 'en' ? (
            <select
              value={audioSettings.accent}
              onChange={(event) => onAccentChange(event.target.value)}
              className="control-chip hidden rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none dark:text-slate-200 sm:block"
            >
              <option value="en-US">Giọng Mỹ</option>
              <option value="en-GB">Giọng Anh</option>
            </select>
          ) : null}

          <button
            onClick={onAutoPlayToggle}
            className={cn(
              'rounded-2xl border px-3 py-2 text-xs font-bold backdrop-blur-sm',
              audioSettings.autoPlay
                ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                : 'control-chip text-slate-700 dark:text-slate-200',
            )}
          >
            Tự phát âm
          </button>

          <button
            onClick={onAudioRateToggle}
            className={cn(
              'rounded-2xl border px-3 py-2 text-xs font-bold backdrop-blur-sm',
              audioSettings.rate !== 1
                ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                : 'control-chip text-slate-700 dark:text-slate-200',
            )}
          >
            Tốc độ chậm
          </button>

          <button
            onClick={onGenerateExamplesForCurrentWord}
            disabled={isGeneratingCurrentWord || isBulkGenerating}
            className="control-chip flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-60 dark:text-slate-200"
          >
            {isGeneratingCurrentWord ? <LoaderCircle size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Tạo ví dụ
          </button>

          <button
            onClick={onGenerateExamplesForSet}
            disabled={isBulkGenerating}
            className="control-chip flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-60 dark:text-slate-200"
          >
            {isBulkGenerating ? <LoaderCircle size={14} className="animate-spin" /> : <WandSparkles size={14} />}
            {isBulkGenerating ? `Đang tạo ${exampleGeneration.completed}/${exampleGeneration.total}` : 'Tạo ví dụ cho cả bộ'}
          </button>
        </div>

        {isBulkGenerating ? (
          <div className="surface-muted mt-3 rounded-[24px] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Đang tạo ví dụ cho cả bộ{exampleGeneration.currentWordTerm ? `: ${exampleGeneration.currentWordTerm}` : ''}
              </p>
              <span className="text-xs font-bold text-primary">
                {exampleGeneration.completed}/{exampleGeneration.total} · {bulkProgressPercent}%
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-500 transition-all duration-300"
                style={{ width: `${bulkProgressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              App sẽ ưu tiên các từ trong phiên học hiện tại trước, rồi mới đi tiếp các từ còn thiếu ví dụ trong cả bộ.
            </p>
          </div>
        ) : null}

        {mobileAudioOpen ? (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:hidden">
            {activeSet.language === 'en' ? (
              <select
                value={audioSettings.accent}
                onChange={(event) => onAccentChange(event.target.value)}
                className="control-chip rounded-2xl px-3 py-3 text-sm font-semibold text-slate-700 outline-none dark:text-slate-200"
              >
                <option value="en-US">Giọng Mỹ</option>
                <option value="en-GB">Giọng Anh</option>
              </select>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onAutoPlayToggle}
                className={cn(
                  'rounded-2xl border px-3 py-3 text-xs font-bold backdrop-blur-sm',
                  audioSettings.autoPlay
                    ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                    : 'control-chip text-slate-700 dark:text-slate-200',
                )}
              >
                Tự phát âm
              </button>
              <button
                onClick={onAudioRateToggle}
                className={cn(
                  'rounded-2xl border px-3 py-3 text-xs font-bold backdrop-blur-sm',
                  audioSettings.rate !== 1
                    ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                    : 'control-chip text-slate-700 dark:text-slate-200',
                )}
              >
                Tốc độ chậm
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid w-full grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-6">
        <div className="flashcard-stage flex w-full flex-col items-center gap-4">
          <div
            onClick={onMeaningToggle}
            role="button"
            tabIndex={0}
            className="flashcard-pro group h-[420px] w-full cursor-pointer outline-none sm:h-[560px]"
          >
            <div className="flashcard-surface relative overflow-hidden border border-white/70 p-5 dark:border-slate-700/60 sm:p-8">
              <div className="absolute inset-x-10 top-0 h-24 rounded-full bg-sky-100/60 blur-3xl dark:bg-sky-500/10" />
              <div className="control-chip absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold text-slate-600 backdrop-blur-sm dark:text-slate-200 sm:left-5 sm:top-4 sm:px-4">
                {currentWordIndex + 1} / {words.length}
              </div>
              <div className="absolute right-3 top-3 z-10 sm:right-5 sm:top-5">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onPlayAudio();
                  }}
                  className="control-chip flex h-10 w-10 items-center justify-center rounded-2xl text-primary shadow-sm transition-all hover:bg-primary hover:text-white active:scale-90 sm:h-12 sm:w-12"
                  aria-label="Phát âm từ hiện tại"
                >
                  <Volume2 size={20} />
                </button>
              </div>

              <div className="flex h-full flex-col items-center pt-24 text-center transition-none sm:pt-32">
                <h2 className="w-full px-2 text-center font-display text-[clamp(2.8rem,16vw,5rem)] font-extrabold leading-[0.92] tracking-[-0.05em] text-slate-700 dark:text-slate-50 sm:px-4 sm:text-fluid-large">
                  {currentWord.term}
                </h2>
                <div className="control-chip mt-6 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-primary sm:mt-7 sm:px-5">
                  {currentWord.pos || 'VOCAB'}
                </div>
                <div className="mt-6 flex min-h-[84px] items-end justify-center overflow-hidden sm:mt-7">
                  <div className={cn('flashcard-meaning-panel', isMeaningVisible && 'flashcard-meaning-panel-visible')}>
                    <p className="font-display text-3xl font-extrabold leading-tight text-primary sm:text-4xl">{currentWord.meaning}</p>
                  </div>
                </div>

                {!isMeaningVisible ? <p className="mt-3 px-4 text-sm font-medium text-slate-400">Nhấn vào thẻ để xem nghĩa</p> : null}

                {isMeaningVisible ? (
                  <div className="animate-in fade-in slide-in-from-bottom-2 mt-6 w-full max-w-2xl space-y-3 border-t border-slate-100 pt-6 text-left duration-500 dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        {(currentWord.examples || []).length > 0 ? 'Ví dụ của từ này' : 'Chưa có ví dụ'}
                      </p>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onGenerateExamplesForCurrentWord();
                        }}
                        disabled={isGeneratingCurrentWord || isBulkGenerating}
                        className="control-chip flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold text-slate-700 disabled:opacity-60 dark:text-slate-200"
                      >
                        {isGeneratingCurrentWord ? <LoaderCircle size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {isGeneratingCurrentWord ? 'Đang tạo...' : 'Tạo lại ví dụ'}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(currentWord.examples || []).length > 0 ? (
                        currentWord.examples.slice(0, 2).map((example, index) => (
                          <div
                            key={index}
                            className="surface-muted rounded-2xl px-4 py-4 transition hover:bg-sky-50/50 dark:hover:bg-sky-500/10 sm:px-5"
                          >
                            <p className="text-sm italic font-medium leading-6 text-slate-600 dark:text-slate-300">"{example}"</p>
                            {currentWord.exampleTranslations?.[index] ? (
                              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{currentWord.exampleTranslations[index]}</p>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="surface-muted rounded-2xl px-4 py-4 sm:px-5">
                          <p className="text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                            Từ này chưa có ví dụ. Bạn có thể bấm `Tạo ví dụ` để lấy ví dụ miễn phí từ API công khai hoặc AI, kèm giải thích tiếng Việt ngay bên dưới.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <div className="action-rail grid w-full grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 rounded-[28px] px-2 py-2 sm:flex sm:w-auto sm:gap-3 sm:rounded-full sm:px-3 sm:py-3">
              <button
                onClick={() => onSelectWord(currentWordIndex - 1)}
                disabled={currentWordIndex === 0}
                className="control-chip flex h-11 w-11 items-center justify-center rounded-2xl text-slate-400 shadow-sm hover:text-primary disabled:opacity-30 dark:text-slate-400 sm:h-14 sm:w-14"
              >
                <ChevronLeft size={22} />
              </button>

              <div className="surface-muted flex min-w-0 gap-2 rounded-[22px] p-1.5 sm:rounded-full sm:p-2">
                <button
                  onClick={() => onReview('known')}
                  className="btn-premium flex min-w-0 flex-1 items-center justify-center gap-1.5 bg-accent-success px-2 py-3 text-white shadow-lg shadow-accent-success/20 sm:px-8"
                >
                  <Check size={18} className="shrink-0" />
                  <span className="text-[11px] font-bold leading-none sm:text-sm">Đã thuộc</span>
                </button>
                <button
                  onClick={() => onReview('unknown')}
                  className="control-chip btn-premium flex min-w-0 flex-1 items-center justify-center gap-1.5 px-2 py-3 text-slate-600 hover:text-accent-danger dark:text-slate-200 sm:px-8"
                >
                  <X size={18} className="shrink-0" />
                  <span className="text-[11px] font-bold leading-none sm:text-sm">Chưa thuộc</span>
                </button>
              </div>

              <button
                onClick={() => onSelectWord(currentWordIndex + 1)}
                disabled={currentWordIndex === words.length - 1}
                className="control-chip flex h-11 w-11 items-center justify-center rounded-2xl text-slate-400 shadow-sm hover:text-primary disabled:opacity-30 dark:text-slate-400 sm:h-14 sm:w-14"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>

          <div className="w-full xl:hidden">
            <button
              onClick={() => setMobileWordListOpen((value) => !value)}
              className="workspace-panel flex w-full items-center justify-between rounded-[28px] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="control-chip flex h-10 w-10 items-center justify-center rounded-2xl">
                  <List size={18} />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Danh sách từ</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{words.length} từ</div>
                </div>
              </div>
              <ChevronDown size={18} className={cn('text-slate-400 transition-transform duration-200', mobileWordListOpen && 'rotate-180')} />
            </button>

            {mobileWordListOpen ? (
              <div className="word-list-shell mt-3 overflow-hidden rounded-[28px] p-4">
                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-400">{activeSetTitle}</p>
                </div>
                <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                  {words.map((word, index) => (
                    <button
                      key={word.id}
                      ref={index === currentWordIndex ? activeWordRef : null}
                      onClick={() => {
                        onSelectWord(index);
                        setMobileWordListOpen(false);
                      }}
                      className={cn(
                        'word-list-item flex w-full items-center gap-3 rounded-[22px] px-3 py-3 text-left transition-all',
                        index === currentWordIndex ? 'word-list-item-active text-white' : 'text-slate-600',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          index === currentWordIndex
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300',
                        )}
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{word.term}</span>
                        <span className={cn('mt-0.5 block truncate text-xs', index === currentWordIndex ? 'text-white/80' : 'text-slate-400')}>
                          {formatStatusLabel(word)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="word-list-shell hidden max-h-[560px] overflow-hidden rounded-[32px] p-5 sm:p-6 xl:sticky xl:top-36 xl:block">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">Danh sách từ</h3>
              <p className="mt-1 text-xs text-slate-400">{activeSetTitle}</p>
            </div>
            <span className="stat-pill rounded-full px-3 py-1 text-xs font-bold text-primary">{words.length} từ</span>
          </div>

          <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
            {words.map((word, index) => (
              <button
                key={word.id}
                ref={index === currentWordIndex ? activeWordRef : null}
                onClick={() => onSelectWord(index)}
                className={cn(
                  'word-list-item flex w-full items-center gap-3 rounded-[22px] px-3 py-3 text-left transition-all',
                  index === currentWordIndex ? 'word-list-item-active text-white' : 'text-slate-600',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    index === currentWordIndex
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300',
                  )}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{word.term}</span>
                  <span className={cn('mt-0.5 block truncate text-xs', index === currentWordIndex ? 'text-white/80' : 'text-slate-400')}>
                    {formatStatusLabel(word)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
