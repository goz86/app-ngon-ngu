import React, { useMemo, useState } from 'react';
import { Plus, Sparkles, X } from 'lucide-react';
import { parseManualWordRows } from '../lib/vocabularySchema';

export default function CreateSetModal({ open, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('en');
  const [topic, setTopic] = useState('Tự tạo');
  const [level, setLevel] = useState('');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState('');

  const parsed = useMemo(
    () =>
      parseManualWordRows(rows, {
        language,
        idPrefix: `cw_${Date.now()}`,
        defaultTopic: topic,
        defaultLevel: level,
      }),
    [language, level, rows, topic],
  );

  if (!open) return null;

  const handleCreate = () => {
    if (!title.trim() || parsed.words.length === 0) return;

    onCreate({
      title: title.trim(),
      language,
      topic: topic.trim() || 'Tự tạo',
      level: level.trim(),
      description: description.trim(),
      words: parsed.words,
    });

    setTitle('');
    setLanguage('en');
    setTopic('Tự tạo');
    setLevel('');
    setDescription('');
    setRows('');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[36px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Bộ từ cá nhân</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Tạo bộ từ trực tiếp trên web</h2>
            <p className="mt-2 text-sm text-slate-500">
              Mỗi dòng theo mẫu <span className="font-semibold text-slate-700">term | pos | meaning | examples | exampleTranslations | level | topic | tags</span>.
            </p>
          </div>
          <button onClick={onClose} className="rounded-2xl bg-slate-100 p-3 text-slate-500 transition hover:bg-slate-200">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Tên bộ từ</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-primary focus:bg-white"
              placeholder="TOPIK 4: Kinh tế xã hội"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Ngôn ngữ</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-primary focus:bg-white"
            >
              <option value="en">Tiếng Anh</option>
              <option value="ko">Tiếng Hàn</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Chủ đề</span>
            <input
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-primary focus:bg-white"
              placeholder="Công việc, đời sống, học thuật..."
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Level</span>
            <input
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-primary focus:bg-white"
              placeholder="A2, B1, TOPIK 5, IELTS 6.5..."
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Mô tả</span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-primary focus:bg-white"
              placeholder="Bộ từ dùng để ôn theo learning path hoặc import batch."
            />
          </label>
        </div>

        <label className="mt-5 block space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Danh sách từ</span>
          <textarea
            value={rows}
            onChange={(event) => setRows(event.target.value)}
            className="min-h-[240px] w-full rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium outline-none transition focus:border-primary focus:bg-white"
            placeholder={'accelerate | V | tăng tốc | The project accelerated quickly. | Dự án tăng tốc rất nhanh. | B1 | Work | verb,common\n가시화되다 | V | trở nên rõ ràng | 문제가 점점 가시화되고 있다. | Vấn đề đang dần trở nên rõ ràng. | TOPIK 5 | Xã hội | topik,academic'}
          />
        </label>

        <div className="mt-5 flex flex-col gap-4 rounded-[28px] bg-slate-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-bold text-slate-700">{parsed.words.length} từ hợp lệ</div>
            <div className="mt-1 text-xs text-slate-500">
              {parsed.duplicateCount > 0 ? `Đã tự gộp ${parsed.duplicateCount} dòng trùng. ` : ''}
              App sẽ giữ lại metadata như level, topic, tags, ví dụ và giải thích nếu bạn nhập đủ.
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-white">
              Đóng
            </button>
            <button onClick={handleCreate} className="btn-premium rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20">
              <Plus size={16} />
              Tạo bộ từ
            </button>
          </div>
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
          <Sparkles size={14} />
          Bộ từ tạo mới sẽ sẵn sàng cho import lớn, tạo ví dụ AI và đồng bộ Supabase khi bạn đăng nhập.
        </div>
      </div>
    </div>
  );
}
