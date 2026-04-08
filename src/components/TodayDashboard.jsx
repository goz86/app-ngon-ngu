import React from 'react';
import { ArrowRight, CalendarClock, CirclePlay, Flame, Sparkles, Target } from 'lucide-react';

function QueueCard({ label, count, active, hint, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-[24px] border p-4 text-left transition-all ${
        active
          ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
          : 'card-pro border-white/70 text-slate-700 hover:-translate-y-0.5 dark:border-slate-700/70 dark:text-slate-100'
      }`}
    >
      <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${active ? 'text-white/75' : 'text-slate-400'}`}>{label}</p>
      <p className="mt-2 text-2xl font-black">{count}</p>
      <p className={`mt-2 text-sm leading-6 ${active ? 'text-white/80' : 'text-slate-500'}`}>{hint}</p>
    </button>
  );
}

function MicroStat({ icon: Icon, label, value, tone = 'sky' }) {
  const tones = {
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  };

  return (
    <div className="surface-muted rounded-[24px] p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-1 text-lg font-black text-slate-900 dark:text-slate-50">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function TodayDashboard({
  activeSetTitle,
  queueOptions,
  queueMode,
  summary,
  resumeLabel,
  onOpenFlashcard,
  onOpenStats,
  onSelectQueue,
}) {
  const hints = {
    recommended: 'Danh sách ngắn gọn để bắt đầu nhanh nhất.',
    today: 'Chỉ hiện các từ đã đến hạn ôn trong hôm nay.',
    hard: 'Các từ bạn hay quên hoặc còn sai nhiều lần.',
    new: 'Từ mới sẵn sàng mở thêm sau khi ôn xong.',
    all: 'Toàn bộ từ trong bộ hiện tại.',
  };

  return (
    <div className="w-full max-w-6xl space-y-6">
      <section className="workspace-panel rounded-[34px] p-6 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-display text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Hôm nay nên học gì</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
              Ôn gọn trong 5-10 phút, rồi mới mở thêm từ mới.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Bộ đang xem: <span className="font-semibold text-slate-700 dark:text-slate-200">{activeSetTitle}</span>. App ưu tiên từ đến hạn, rồi đến từ khó, sau đó mới mở thêm từ mới để bạn không bị quá tải.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenFlashcard}
              className="btn-premium btn-primary-pro flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold"
            >
              <CirclePlay size={16} />
              Tiếp tục học
            </button>
            <button
              onClick={onOpenStats}
              className="control-chip flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              Xem thống kê
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <MicroStat icon={CalendarClock} label="Ôn hôm nay" value={`${summary.dueToday} từ`} tone="amber" />
          <MicroStat icon={Flame} label="Từ khó" value={`${summary.hard} từ`} tone="sky" />
          <MicroStat icon={Sparkles} label="Có thể học mới" value={`${summary.readyForNew} từ`} tone="emerald" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {queueOptions.map((option) => (
          <QueueCard
            key={option.id}
            label={option.label}
            count={option.count}
            hint={hints[option.id] || ''}
            active={queueMode === option.id}
            onClick={() => onSelectQueue(option.id)}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="card-pro rounded-[32px] p-6">
          <p className="font-display text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Checklist hôm nay</p>
          <div className="mt-4 space-y-3">
            <div className="surface-muted rounded-[24px] p-4">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">1. Hoàn thành phần ôn đến hạn trước</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Xử lý {summary.dueToday} từ đến hạn trong hôm nay để giữ lịch ôn ổn định và không dồn bài sang ngày mai.
              </p>
            </div>
            <div className="surface-muted rounded-[24px] p-4">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">2. Kéo lại nhóm từ khó</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Dành thêm 2-3 phút cho {summary.hard} từ khó bằng trắc nghiệm, điền từ hoặc luyện nghe để củng cố trí nhớ chủ động.
              </p>
            </div>
            <div className="surface-muted rounded-[24px] p-4">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">3. Chỉ mở thêm từ mới khi còn sức</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Nếu phiên ôn đã ổn, bạn có thể mở thêm khoảng {summary.readyForNew} từ mới mà vẫn giữ được chất lượng học.
              </p>
            </div>
          </div>
        </div>

        <div className="card-pro rounded-[32px] p-6">
          <p className="font-display text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Tiếp tục từ lần trước</p>
          <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Quay lại đúng chỗ đang học</h3>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            {resumeLabel || 'App chưa có phiên gần nhất, bạn có thể bắt đầu ngay với danh sách đề xuất.'}
          </p>

          <div className="surface-muted mt-5 rounded-[24px] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Target size={16} className="text-primary" />
              Mục tiêu gợi ý cho hôm nay
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-500">
              <li>Hoàn thành phiên đề xuất trong một lượt ngắn.</li>
              <li>Nếu còn năng lượng, chuyển sang nhóm từ khó.</li>
              <li>Chỉ sau đó mới mở thêm từ mới.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
