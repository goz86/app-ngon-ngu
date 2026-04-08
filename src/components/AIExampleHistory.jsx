import React, { useMemo, useState } from 'react';
import { Bot, Languages, Search, Sparkles } from 'lucide-react';

function formatHistoryTime(value) {
  if (!value) return 'Vừa xong';

  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return 'Vừa xong';
  }
}

function FilterChip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-xs font-bold transition-all ${
        active
          ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
          : 'control-chip text-slate-600 dark:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

export default function AIExampleHistory({ items = [], compact = false }) {
  const [languageFilter, setLanguageFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchesLanguage = languageFilter === 'all' || item.language === languageFilter;
      const matchesSource = sourceFilter === 'all' || (item.source || '').toLowerCase() === sourceFilter;
      const haystack = `${item.term} ${item.meaning} ${item.example_text} ${item.example_translation} ${item.model || ''}`.toLowerCase();
      const matchesSearch = !keyword || haystack.includes(keyword);
      return matchesLanguage && matchesSource && matchesSearch;
    });
  }, [items, languageFilter, searchTerm, sourceFilter]);

  const visibleItems = compact ? filteredItems.slice(0, 3) : filteredItems;

  return (
    <div className="card-pro rounded-[30px] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Lịch sử ví dụ AI</p>
          <h3 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            {compact ? 'Ví dụ mới tạo gần đây' : 'Theo dõi toàn bộ ví dụ đã sinh'}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {compact
              ? 'Hiển thị nhanh các ví dụ mới nhất để bạn kiểm tra chất lượng.'
              : 'Lọc theo ngôn ngữ, nguồn sinh và tìm lại ví dụ cũ theo từ hoặc nghĩa.'}
          </p>
        </div>
        <div className="stat-pill rounded-full px-3 py-1 text-xs font-bold text-slate-500">{filteredItems.length} mục</div>
      </div>

      {!compact ? (
        <div className="mt-4 space-y-3">
          <div className="surface-muted flex items-center gap-2 rounded-2xl px-3 py-3">
            <Search size={16} className="text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm theo từ, nghĩa hoặc câu ví dụ..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterChip active={languageFilter === 'all'} onClick={() => setLanguageFilter('all')}>
              Tất cả ngôn ngữ
            </FilterChip>
            <FilterChip active={languageFilter === 'en'} onClick={() => setLanguageFilter('en')}>
              Tiếng Anh
            </FilterChip>
            <FilterChip active={languageFilter === 'ko'} onClick={() => setLanguageFilter('ko')}>
              Tiếng Hàn
            </FilterChip>
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterChip active={sourceFilter === 'all'} onClick={() => setSourceFilter('all')}>
              Tất cả nguồn
            </FilterChip>
            <FilterChip active={sourceFilter === 'gemini'} onClick={() => setSourceFilter('gemini')}>
              Gemini
            </FilterChip>
            <FilterChip active={sourceFilter === 'dictionary_api'} onClick={() => setSourceFilter('dictionary_api')}>
              Dictionary API
            </FilterChip>
          </div>
        </div>
      ) : null}

      {visibleItems.length ? (
        <div className="mt-4 space-y-3">
          {visibleItems.map((item) => (
            <article key={item.id} className="surface-muted rounded-[22px] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-primary">
                    {item.term}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{item.language === 'ko' ? 'Tiếng Hàn' : 'Tiếng Anh'}</span>
                </div>
                <div className="text-xs text-slate-400">{formatHistoryTime(item.created_at)}</div>
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{item.meaning}</p>

              <div className="mt-3 space-y-2 rounded-[18px] bg-white/70 p-3 dark:bg-slate-900/60">
                <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                  <Sparkles size={12} />
                  Câu ví dụ
                </div>
                <p className="text-sm italic leading-6 text-slate-700 dark:text-slate-200">"{item.example_text}"</p>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="inline-flex items-center gap-2">
                  <Languages size={12} />
                  <span>{item.example_translation || 'Chưa có giải thích tiếng Việt.'}</span>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                  <Bot size={12} />
                  {item.model || item.source || 'AI'}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="surface-muted mt-4 rounded-[22px] p-4 text-sm text-slate-500">
          Chưa có ví dụ AI nào phù hợp với bộ lọc hiện tại. Hãy tạo ví dụ mới hoặc đổi bộ lọc để xem dữ liệu.
        </div>
      )}
    </div>
  );
}
