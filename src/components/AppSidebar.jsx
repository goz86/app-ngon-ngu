import React, { useMemo, useState } from 'react';
import { BookA, BookOpen, ChevronRight, FileText, FolderKanban, Languages, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function EmptyPanel({ title, description }) {
  return (
    <div className="rounded-[22px] border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
      <div className="font-semibold text-slate-700 dark:text-slate-100">{title}</div>
      <div className="mt-1 leading-6">{description}</div>
    </div>
  );
}

function MenuBlock({ icon: Icon, itemCount, activePanel, onSelectPanel, children }) {
  const items = [
    { id: 'sets', label: 'Danh sách bộ từ', icon: FolderKanban, available: true },
    { id: 'tests', label: 'Giải đề', icon: FileText, available: false },
    { id: 'grammar', label: 'Ngữ pháp', icon: BookOpen, available: false },
  ];

  return (
    <div className="rounded-[26px] border border-white/70 bg-white/70 p-2 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60">
      <div className="mb-2 flex items-center gap-3 rounded-[20px] bg-primary px-3 py-3 text-white shadow-lg shadow-primary/15">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
          <Icon size={18} />
        </div>
        <div className="text-sm font-semibold text-white/90">{itemCount} bộ từ</div>
      </div>

      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectPanel(item.id)}
            className={cn(
              'flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition-all',
              activePanel === item.id
                ? 'bg-slate-100 text-slate-900 ring-2 ring-slate-900/10 dark:bg-slate-800 dark:text-slate-100 dark:ring-white/10'
                : 'text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/70',
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon size={16} />
              <span className="text-sm font-semibold">{item.label}</span>
            </div>
            {item.available ? (
              item.id === 'sets' ? (
                <span className="stat-pill rounded-full px-2.5 py-1 text-[10px] font-semibold text-primary/80">{itemCount}</span>
              ) : null
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                Sắp có
              </span>
            )}
          </button>
        ))}
        {children}
      </div>
    </div>
  );
}

function SetCard({ set, isActive, formatSetTitle, onSelectSet, onDeleteCustomSet }) {
  return (
    <div
      className={cn(
        'word-list-item rounded-[22px] px-4 py-3 transition-all',
        isActive ? 'word-list-item-active text-white' : 'text-slate-600 dark:text-slate-200',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={() => onSelectSet(set.id)}
          className="min-w-0 flex-1 text-left outline-none focus:outline-none focus-visible:outline-none"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate pr-2 text-[13px] font-semibold">{formatSetTitle(set.title)}</span>
            {isActive ? <ChevronRight size={14} className="flex-shrink-0" /> : null}
          </div>
          <div className={cn('mt-1 text-[11px]', isActive ? 'text-white/80' : 'text-slate-400')}>{set.topic}</div>
        </button>

        {set.isCustom ? (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDeleteCustomSet(set.id);
            }}
            className={cn(
              'mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition',
              isActive ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500',
            )}
            aria-label="Xóa bộ từ"
            title="Xóa bộ từ"
          >
            <Trash2 size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function AppSidebar({
  sidebarOpen,
  langFilter,
  allSets,
  activeSetId,
  activeSet,
  formatSetTitle,
  fileInputRef,
  onClose,
  onLangFilterChange,
  onSelectSet,
  onFileUpload,
  onDeleteCustomSet,
  onOpenCreateSet,
}) {
  const [panelByLanguage, setPanelByLanguage] = useState({ en: 'sets', ko: 'sets' });

  const setsByLanguage = useMemo(
    () => ({
      en: allSets.filter((set) => set.language === 'en'),
      ko: allSets.filter((set) => set.language === 'ko'),
    }),
    [allSets],
  );

  const activeLanguageSets = setsByLanguage[langFilter] || [];
  const customSets = useMemo(() => activeLanguageSets.filter((set) => set.isCustom), [activeLanguageSets]);
  const defaultSets = useMemo(() => activeLanguageSets.filter((set) => !set.isCustom), [activeLanguageSets]);
  const activePanel = panelByLanguage[langFilter] || 'sets';

  const renderPanelContent = () => {
    if (activePanel === 'sets') {
      return activeLanguageSets.length > 0 ? (
        <div className="space-y-3 overflow-y-auto pr-1 no-scrollbar">
          {customSets.length > 0 ? (
            <div className="space-y-1">
              <div className="px-2 text-[11px] font-semibold text-sky-700">Bộ của tôi</div>
              {customSets.map((set) => (
                <SetCard
                  key={set.id}
                  set={set}
                  isActive={activeSetId === set.id}
                  formatSetTitle={formatSetTitle}
                  onSelectSet={onSelectSet}
                  onDeleteCustomSet={onDeleteCustomSet}
                />
              ))}
            </div>
          ) : null}

          {defaultSets.length > 0 ? (
            <div className="space-y-1">
              {customSets.length > 0 ? <div className="px-2 pt-1 text-[11px] font-medium text-slate-400">Bộ mặc định</div> : null}
              {defaultSets.map((set) => (
                <SetCard
                  key={set.id}
                  set={set}
                  isActive={activeSetId === set.id}
                  formatSetTitle={formatSetTitle}
                  onSelectSet={onSelectSet}
                  onDeleteCustomSet={onDeleteCustomSet}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyPanel title="Chưa có bộ từ phù hợp" description="Hãy import thêm dữ liệu hoặc tạo nhanh một bộ từ mới bằng AI để bắt đầu học." />
      );
    }

    if (activePanel === 'tests') {
      return (
        <EmptyPanel
          title="Khu giải đề đang được chuẩn bị"
          description="Mình đã chừa sẵn khu này để thêm đề theo ngôn ngữ, cấp độ và kỹ năng ở bước tiếp theo."
        />
      );
    }

    return (
      <EmptyPanel
        title="Khu ngữ pháp đang được chuẩn bị"
        description="Sau bước này mình có thể làm tiếp thư viện ngữ pháp riêng cho từng ngôn ngữ ngay trong sidebar."
      />
    );
  };

  return (
    <aside
      className={cn(
        'glass-panel font-inter fixed bottom-0 left-0 top-0 z-50 flex w-72 transform flex-col gap-6 p-5 transition-transform duration-300 lg:w-80',
        !sidebarOpen ? '-translate-x-full lg:translate-x-0' : 'translate-x-0 shadow-2xl shadow-primary/20',
      )}
    >
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white/70 shadow-lg shadow-primary/20 ring-1 ring-white/70">
            <img src="/logo.svg" alt="Vocab Study logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <span className="block truncate text-base font-semibold text-slate-800 dark:text-white">Vocab Study</span>
            <span className="text-[11px] font-normal text-slate-400">Study Studio</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 lg:hidden" aria-label="Đóng thanh bên">
          <X size={20} />
        </button>
      </div>

      <div className="tab-strip flex gap-1 rounded-2xl p-1">
        <button
          onClick={() => onLangFilterChange('en')}
          className={cn('flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all', langFilter === 'en' ? 'tab-pill-active' : 'tab-pill-idle')}
        >
          Tiếng Anh
        </button>
        <button
          onClick={() => onLangFilterChange('ko')}
          className={cn('flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all', langFilter === 'ko' ? 'tab-pill-active' : 'tab-pill-idle')}
        >
          Tiếng Hàn
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 no-scrollbar">
        {langFilter === 'en' ? (
          <MenuBlock
            icon={BookA}
            itemCount={setsByLanguage.en.length}
            activePanel={panelByLanguage.en}
            onSelectPanel={(panel) => setPanelByLanguage((prev) => ({ ...prev, en: panel }))}
          >
            {renderPanelContent()}
          </MenuBlock>
        ) : (
          <MenuBlock
            icon={Languages}
            itemCount={setsByLanguage.ko.length}
            activePanel={panelByLanguage.ko}
            onSelectPanel={(panel) => setPanelByLanguage((prev) => ({ ...prev, ko: panel }))}
          >
            {renderPanelContent()}
          </MenuBlock>
        )}
      </div>

      <div className="border-t border-white/70 pt-4 dark:border-slate-800">
        <div className="grid gap-2">
          <button
            onClick={onOpenCreateSet}
            className="btn-premium flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-[11px] font-semibold text-white shadow-lg shadow-slate-900/15"
          >
            <Sparkles size={14} />
            Tạo bộ từ bằng AI
          </button>
          <label className="btn-premium btn-secondary-pro flex w-full cursor-pointer items-center justify-center gap-2 py-3 text-[11px] font-semibold">
            <Upload size={14} />
            Import Excel
            <input ref={fileInputRef} type="file" accept=".xlsx, .xls, .csv" onChange={onFileUpload} className="hidden" />
          </label>
          {activeSet?.isCustom ? (
            <button
              onClick={() => onDeleteCustomSet(activeSet.id)}
              className="surface-danger rounded-2xl px-4 py-3 text-[11px] font-semibold transition hover:bg-red-100 dark:hover:bg-red-950/60"
            >
              Xóa bộ từ đang mở
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
