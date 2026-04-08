import React from 'react';
import { CirclePlay, Sparkles, Target } from 'lucide-react';

function ActionButton({ icon: Icon, label, detail, onClick, tone = 'sky' }) {
  const toneClasses = {
    sky: 'bg-sky-100/80 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    emerald: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  };

  return (
    <button
      onClick={onClick}
      className="card-pro flex min-w-[200px] items-center gap-3 rounded-[26px] px-4 py-4 text-left transition hover:-translate-y-0.5"
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
        <Icon size={18} />
      </div>
      <div>
        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</div>
        <div className="text-xs text-slate-500">{detail}</div>
      </div>
    </button>
  );
}

export default function TodayFocusBar({ summary, resumeLabel, onResume, onOpenStats }) {
  return (
    <section className="workspace-panel w-full max-w-6xl rounded-[36px] px-5 py-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-display text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Hôm nay bạn cần làm gì</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Ôn {summary.dueToday} từ đến hạn và duy trì nhịp học đều.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Bạn đã học {summary.reviewedToday} lượt hôm nay. Ưu tiên hoàn thành phần cần ôn trước, sau đó tiếp tục bộ từ đang dở để giữ mạch ghi nhớ.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <ActionButton
            icon={CirclePlay}
            label="Tiếp tục học"
            detail={resumeLabel || 'Quay lại đúng bộ từ và vị trí đang học'}
            onClick={onResume}
            tone="sky"
          />

          <ActionButton
            icon={Target}
            label="Xem thống kê"
            detail="Theo dõi tiến độ theo ngày, tuần và từng bộ từ"
            onClick={onOpenStats}
            tone="emerald"
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Tổng bộ từ', summary.totalSets],
          ['Tổng số từ', summary.totalWords],
          ['Đã nhớ tốt', summary.strong + summary.mastered],
          ['Cần ôn ngay', summary.dueToday],
        ].map(([label, value]) => (
          <div key={label} className="surface-muted rounded-[22px] px-4 py-3">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</div>
            <div className="mt-2 flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-100">
              <Sparkles size={16} className="text-primary" />
              {value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
