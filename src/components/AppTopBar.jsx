import React, { useMemo, useState } from 'react';
import { ChevronDown, Cloud, LayoutGrid, LogIn, LogOut, Menu, Moon, Search, Settings2, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function AccountMenu({ profile, user, syncState, onOpenStats, onOpenSettings, onSignOut }) {
  return (
    <div className="animate-in slide-in-from-top-2 absolute right-0 z-50 mt-2 w-72 fade-in duration-200">
      <div className="card-pro rounded-2xl p-4 shadow-xl">
        <p className="mb-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Tài khoản</p>

        <div className="surface-muted mb-4 overflow-hidden rounded-xl px-3 py-3">
          <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-100">{profile?.display_name || user.email}</p>
          <p className="mt-1 text-xs text-slate-500">{user.email}</p>
          <p className="mt-2 text-[10px] italic text-slate-400">{syncState}</p>
        </div>

        <div className="grid gap-2">
          <button
            onClick={onOpenSettings}
            className="surface-muted flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700/80"
          >
            <Settings2 size={16} />
            Cài đặt hồ sơ
          </button>

          <button
            onClick={onOpenStats}
            className="surface-muted rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700/80"
          >
            Mở thống kê
          </button>

          <button
            onClick={onSignOut}
            className="surface-muted flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-red-50 hover:text-red-500 dark:text-slate-200 dark:hover:bg-red-950/40 dark:hover:text-red-300"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

function ModeSheet({ tabs, activeTab, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] sm:hidden" onClick={onClose}>
      <div
        className="absolute inset-x-3 bottom-3 rounded-[28px] border border-white/60 bg-white/95 p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between px-2">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Chế độ học</div>
          <button onClick={onClose} className="control-chip rounded-full px-3 py-1 text-xs font-bold">
            Đóng
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onSelect(tab.id);
                onClose();
              }}
              className={cn(
                'flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold transition-all',
                activeTab === tab.id ? 'tab-pill-active' : 'surface-muted text-slate-600 dark:text-slate-200',
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AppTopBar({
  activeSetTitle,
  activeTab,
  darkMode,
  profile,
  searchTerm,
  showAuthMenu,
  syncState,
  tabs,
  user,
  onOpenSidebar,
  onSearchChange,
  onToggleDarkMode,
  onTabChange,
  onAuthButtonClick,
  onOpenProfileSettings,
  onOpenStats,
  onSignOut,
}) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileModesOpen, setMobileModesOpen] = useState(false);

  const activeTabMeta = useMemo(() => tabs.find((tab) => tab.id === activeTab) || tabs[0], [activeTab, tabs]);

  return (
    <>
      <div className="topbar-shell sticky top-0 z-40">
        <header className="flex min-h-14 flex-shrink-0 items-center justify-between gap-3 px-3 py-2 sm:h-16 sm:px-8 sm:py-0 lg:h-20">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              onClick={onOpenSidebar}
              className="control-chip rounded-xl p-2 text-slate-600 dark:text-slate-200 sm:p-2.5 lg:hidden"
              aria-label="Mở thanh bên"
            >
              <Menu size={20} />
            </button>

            <div className="surface-muted hidden items-center gap-2 rounded-xl px-3 py-2 text-slate-500 dark:text-slate-300 sm:flex">
              <Search size={14} />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Tìm theo từ, nghĩa, từ loại, trạng thái..."
                className="w-56 bg-transparent text-xs font-medium outline-none"
              />
            </div>

            <div className="min-w-0 flex-1 truncate text-base font-bold text-slate-800 dark:text-slate-100 sm:hidden">
              {activeSetTitle || 'Chưa có dữ liệu'}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="hidden max-w-[280px] truncate rounded-full bg-primary/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary md:flex">
              {activeSetTitle || 'Bộ từ vựng'}
            </div>

            <div className="control-chip hidden items-center gap-2 rounded-full px-3 py-2 text-[11px] font-semibold text-slate-500 dark:text-slate-300 lg:flex">
              <Cloud size={14} className="text-primary" />
              {syncState}
            </div>

            <button
              onClick={() => setMobileSearchOpen((value) => !value)}
              className="control-chip flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 dark:text-slate-200 sm:hidden"
              aria-label="Tìm kiếm"
            >
              <Search size={18} />
            </button>

            <button
              onClick={onToggleDarkMode}
              className="control-chip flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 dark:text-slate-200 sm:h-10 sm:w-10"
              aria-label={darkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative">
              <button
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm transition-all sm:px-4',
                  user
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-primary bg-primary text-white hover:opacity-90',
                )}
                onClick={onAuthButtonClick}
              >
                {user ? (
                  <>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                      {(profile?.display_name || user.email || 'U').slice(0, 1).toUpperCase()}
                    </div>
                    <span className="hidden max-w-[120px] truncate text-xs font-bold sm:inline">{profile?.display_name || user.email}</span>
                    <ChevronDown size={14} className="hidden sm:block" />
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span className="hidden text-xs font-bold uppercase tracking-wider sm:inline">Đăng nhập</span>
                  </>
                )}
              </button>

              {showAuthMenu && user ? (
                <AccountMenu
                  profile={profile}
                  user={user}
                  syncState={syncState}
                  onOpenSettings={onOpenProfileSettings}
                  onOpenStats={onOpenStats}
                  onSignOut={onSignOut}
                />
              ) : null}
            </div>
          </div>
        </header>

        <div className="flex flex-shrink-0 flex-col gap-3 px-3 pb-3 sm:px-6 lg:px-8">
          <div className="sm:hidden">
            <div className="tab-strip flex items-center gap-2 rounded-[28px] p-1.5">
              <button
                onClick={() => onTabChange(activeTabMeta.id)}
                className="tab-pill-active flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold"
              >
                <activeTabMeta.icon size={15} />
                <span className="truncate">{activeTabMeta.label}</span>
              </button>
              <button
                onClick={() => setMobileModesOpen(true)}
                className="control-chip flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold"
              >
                <LayoutGrid size={15} />
                Chế độ
              </button>
            </div>
          </div>

          {mobileSearchOpen ? (
            <div className="surface-muted flex items-center gap-2 rounded-2xl px-3 py-2.5 text-slate-500 dark:text-slate-300 sm:hidden">
              <Search size={15} />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Tìm theo từ, nghĩa, từ loại..."
                className="w-full bg-transparent text-sm font-medium outline-none"
              />
            </div>
          ) : null}

          <nav className="tab-strip hidden items-center gap-2 overflow-x-auto rounded-[30px] p-1.5 sm:flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-all',
                  activeTab === tab.id ? 'tab-pill-active' : 'text-slate-600 hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-800/70',
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {mobileModesOpen ? <ModeSheet tabs={tabs} activeTab={activeTab} onSelect={onTabChange} onClose={() => setMobileModesOpen(false)} /> : null}
    </>
  );
}
