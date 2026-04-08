import React from 'react';
import {
  BarChart3,
  CalendarClock,
  Filter,
  Layers3,
  Settings2,
  Share2,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import AIExampleHistory from './AIExampleHistory';

function LabelText({ children }) {
  return <p className="text-[11px] font-bold text-slate-400">{children}</p>;
}

function OverviewCard({ icon: Icon, label, value, hint, tone = 'sky' }) {
  const tones = {
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    violet: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  };

  return (
    <div className="card-pro rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <LabelText>{label}</LabelText>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">{value}</p>
          {hint ? <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p> : null}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function CompactChart({ title, subtitle, series, colorClass }) {
  const maxValue = Math.max(...series.map((item) => item.total), 1);

  return (
    <div className="card-pro rounded-[30px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <LabelText>{title}</LabelText>
          <h4 className="mt-2 text-lg font-extrabold text-slate-900 dark:text-slate-50">{subtitle}</h4>
        </div>
        <div className="stat-pill rounded-full px-3 py-1 text-xs font-bold text-slate-500">{series.length} mốc</div>
      </div>

      <div className="mt-5 flex h-36 items-end gap-2">
        {series.map((item) => (
          <div key={item.key} className="flex flex-1 flex-col items-center gap-2">
            <div className="surface-muted flex h-24 w-full items-end rounded-[16px] p-1.5">
              <div
                className={`w-full rounded-[12px] ${colorClass}`}
                style={{ height: `${Math.max((item.total / maxValue) * 100, item.total ? 12 : 6)}%` }}
              />
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.total}</div>
              <div className="text-[10px] text-slate-400">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterBar({
  statusFilter,
  setStatusFilter,
  posFilter,
  setPosFilter,
  showDueTodayOnly,
  setShowDueTodayOnly,
  posOptions,
  resetStudyProgress,
  setCount,
}) {
  return (
    <div className="workspace-panel rounded-[30px] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <LabelText>Bộ lọc nhanh</LabelText>
          <h3 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-slate-50">Giữ danh sách gọn và dễ quét</h3>
        </div>
        <div className="stat-pill rounded-full px-3 py-1.5 text-xs font-bold text-slate-500">{setCount} bộ</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <div className="control-chip flex items-center gap-2 rounded-2xl px-3 py-2">
          <Filter size={14} className="text-slate-400 dark:text-slate-500" />
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              resetStudyProgress();
            }}
            className="cursor-pointer bg-transparent text-sm font-semibold text-slate-600 outline-none dark:text-slate-200"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="từ mới">Từ mới</option>
            <option value="đang học">Đang học</option>
            <option value="cần ôn">Cần ôn</option>
            <option value="đã nhớ">Đã nhớ</option>
            <option value="thành thạo">Thành thạo</option>
          </select>
        </div>

        <div className="control-chip flex items-center gap-2 rounded-2xl px-3 py-2">
          <Settings2 size={14} className="text-slate-400 dark:text-slate-500" />
          <select
            value={posFilter}
            onChange={(event) => {
              setPosFilter(event.target.value);
              resetStudyProgress();
            }}
            className="cursor-pointer bg-transparent text-sm font-semibold text-slate-600 outline-none dark:text-slate-200"
          >
            <option value="all">Tất cả từ loại</option>
            {posOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setShowDueTodayOnly((value) => !value);
            resetStudyProgress();
          }}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all shadow-sm ${
            showDueTodayOnly
              ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/50 dark:bg-amber-500/15 dark:text-amber-300'
              : 'control-chip text-slate-500 hover:border-amber-100 hover:bg-amber-50/50 dark:text-slate-300 dark:hover:border-amber-500/40 dark:hover:bg-amber-500/10'
          }`}
        >
          <CalendarClock size={14} className={showDueTodayOnly ? 'text-amber-500' : 'text-slate-400'} />
          {showDueTodayOnly ? 'Đang lọc: ôn hôm nay' : 'Chỉ hiện từ ôn hôm nay'}
        </button>
      </div>
    </div>
  );
}

function SetProgressCard({ item, onOpen, onShare }) {
  return (
    <div className="card-pro rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="stat-pill inline-flex rounded-full px-3 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-200">
            {item.topic}
          </div>
          <h4 className="mt-3 truncate font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">{item.title}</h4>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
            {item.description || 'Bộ từ này đang được theo dõi trong kế hoạch học hiện tại.'}
          </p>
        </div>

        <button
          onClick={() => onShare(item)}
          className="control-chip rounded-2xl p-3 text-slate-500 transition hover:text-primary dark:text-slate-300"
          title="Chia sẻ bộ từ"
        >
          <Share2 size={16} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="surface-muted rounded-[20px] px-3 py-3">
          <LabelText>Tiến độ</LabelText>
          <div className="mt-2 text-lg font-black text-slate-900 dark:text-slate-50">{item.progressPercent}%</div>
        </div>
        <div className="surface-muted rounded-[20px] px-3 py-3">
          <LabelText>Ôn hôm nay</LabelText>
          <div className="mt-2 text-lg font-black text-slate-900 dark:text-slate-50">{item.dueToday}</div>
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full bg-slate-200/80 dark:bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-500" style={{ width: `${item.progressPercent}%` }} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs leading-5 text-slate-500">
          {item.total} từ, {item.hard} từ khó. Lần ôn tiếp theo: {item.nextReviewLabel}
        </p>
        <button onClick={() => onOpen(item)} className="btn-premium btn-primary-pro rounded-2xl px-4 py-2 text-sm font-bold">
          Tiếp tục
        </button>
      </div>
    </div>
  );
}

export default function StatsDashboard({
  summary,
  activeSetTitle,
  dailySeries,
  weeklySeries,
  setDetails,
  exampleHistory,
  onOpenSet,
  onShareSet,
  statusFilter,
  setStatusFilter,
  posFilter,
  setPosFilter,
  showDueTodayOnly,
  setShowDueTodayOnly,
  posOptions,
  resetStudyProgress,
}) {
  const progressRows = [
    ['Từ mới', summary.new, 'bg-slate-300'],
    ['Đang học', summary.learning, 'bg-sky-400'],
    ['Cần ôn', summary.due, 'bg-amber-400'],
    ['Đã nhớ', summary.strong, 'bg-emerald-400'],
    ['Thành thạo', summary.mastered, 'bg-emerald-600'],
  ];

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div className="card-pro rounded-[32px] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <LabelText>Phiên học hiện tại</LabelText>
            <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Tập trung đúng phần cần học</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Bộ đang xem: <span className="font-semibold text-slate-700 dark:text-slate-200">{activeSetTitle}</span>. Màn này chỉ giữ lại các chỉ số cần thiết để bạn quyết định phiên học tiếp theo.
            </p>
          </div>
          <div className="surface-muted rounded-[22px] px-4 py-3">
            <LabelText>Lần ôn tiếp theo</LabelText>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{summary.nextReviewLabel}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="surface-muted rounded-[24px] p-4">
            <LabelText>Ưu tiên ôn hôm nay</LabelText>
            <p className="mt-2 text-xl font-black text-slate-900 dark:text-slate-50">{summary.dueToday} từ</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Xử lý trước để giữ lịch ôn đều và không bị dồn bài.</p>
          </div>
          <div className="surface-muted rounded-[24px] p-4">
            <LabelText>Từ khó cần kéo lại</LabelText>
            <p className="mt-2 text-xl font-black text-slate-900 dark:text-slate-50">{summary.hard} từ</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Nên luyện bằng trắc nghiệm, điền từ hoặc nghe để nhớ chủ động hơn.</p>
          </div>
          <div className="surface-muted rounded-[24px] p-4">
            <LabelText>Từ mới nên mở thêm</LabelText>
            <p className="mt-2 text-xl font-black text-slate-900 dark:text-slate-50">{summary.readyForNew} từ</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Chỉ mở sau khi phần ôn chính đã ổn để tránh quá tải.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewCard icon={Layers3} label="Tổng bộ từ" value={summary.totalSets} hint="Số bộ đang theo dõi trong tài khoản." tone="sky" />
        <OverviewCard icon={BarChart3} label="Tổng số từ" value={summary.totalWords} hint="Toàn bộ dữ liệu học hiện có." tone="violet" />
        <OverviewCard icon={TriangleAlert} label="Từ khó" value={summary.hard} hint="Những từ cần quay lại nhiều hơn." tone="rose" />
        <OverviewCard icon={Sparkles} label="Sẵn sàng học mới" value={summary.readyForNew} hint="Chỉ nên mở thêm sau khi đã ôn xong." tone="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="space-y-6">
          <FilterBar
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            posFilter={posFilter}
            setPosFilter={setPosFilter}
            showDueTodayOnly={showDueTodayOnly}
            setShowDueTodayOnly={setShowDueTodayOnly}
            posOptions={posOptions}
            resetStudyProgress={resetStudyProgress}
            setCount={setDetails.length}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <CompactChart title="Nhịp học" subtitle="7 ngày gần nhất" series={dailySeries} colorClass="bg-gradient-to-t from-primary to-cyan-500" />
            <CompactChart title="Độ bền" subtitle="8 tuần gần nhất" series={weeklySeries} colorClass="bg-gradient-to-t from-emerald-500 to-lime-400" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-pro rounded-[32px] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <LabelText>Tóm tắt tiến độ</LabelText>
                <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Chỉ giữ 5 trạng thái chính</h3>
              </div>
              <div className="surface-muted rounded-[20px] px-4 py-3 text-right">
                <LabelText>Đã ôn hôm nay</LabelText>
                <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-50">{summary.reviewedToday}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {progressRows.map(([label, value, color]) => (
                <div key={label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-600 dark:text-slate-300">{label}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{value}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${summary.totalWords ? (Number(value) / summary.totalWords) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="surface-muted mt-5 rounded-[24px] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <CalendarClock size={16} className="text-primary" />
                Gợi ý cho hôm nay
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-500">
                <li>Hoàn thành ít nhất 2 từ đến hạn trước để giữ lịch ôn ổn định.</li>
                <li>Ôn lại 2 từ khó bằng mode chủ động như trắc nghiệm hoặc điền từ.</li>
                <li>Mở thêm khoảng 10 từ mới nếu vẫn còn năng lượng sau phiên ôn.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <AIExampleHistory items={exampleHistory} />

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <LabelText>Danh sách bộ từ</LabelText>
            <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Các bộ đang theo dõi</h3>
          </div>
          <div className="stat-pill rounded-full px-3 py-1 text-xs font-bold text-slate-500">{setDetails.length} bộ</div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {setDetails.map((item) => (
            <SetProgressCard key={item.id} item={item} onOpen={onOpenSet} onShare={onShareSet} />
          ))}
        </div>
      </section>
    </div>
  );
}
