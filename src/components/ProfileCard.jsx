import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Mail, Save, Trash2, UserRound, X } from 'lucide-react';

const defaultProfile = {
  display_name: '',
  avatar_url: '',
  study_goal: '20 từ mỗi ngày',
};

function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => resolve({ image, url });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không thể đọc ảnh đại diện.'));
    };

    image.src = url;
  });
}

async function fileToAvatarDataUrl(file) {
  const { image, url } = await readImageDimensions(file);
  const maxSize = 320;
  const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    URL.revokeObjectURL(url);
    throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.');
  }

  context.drawImage(image, 0, 0, width, height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
  URL.revokeObjectURL(url);
  return dataUrl;
}

export default function ProfileCard({ open, profile, email, onClose, onSave, saving }) {
  const [draft, setDraft] = useState(defaultProfile);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setDraft({
      display_name: profile?.display_name || '',
      avatar_url: profile?.avatar_url || '',
      study_goal: profile?.study_goal || '20 từ mỗi ngày',
    });
  }, [open, profile]);

  if (!open) return null;

  const initials = (draft.display_name || email || 'U').slice(0, 1).toUpperCase();

  const handleAvatarFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const avatarUrl = await fileToAvatarDataUrl(file);
      setDraft((prev) => ({ ...prev, avatar_url: avatarUrl }));
    } catch (error) {
      console.error(error);
      alert(error.message || 'Không thể tải ảnh đại diện.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-[3px]" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="workspace-panel w-full max-w-2xl rounded-[32px] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Cài đặt hồ sơ</p>
              <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Thông tin tài khoản học tập</h3>
              <p className="mt-2 text-sm text-slate-500">Chỉnh tên hiển thị, mục tiêu học và ảnh đại diện ngay trong menu tài khoản.</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="control-chip flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 dark:text-slate-300"
              aria-label="Đóng cài đặt hồ sơ"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="surface-muted rounded-[28px] p-5">
              <div className="flex flex-col items-center text-center">
                {draft.avatar_url ? (
                  <img src={draft.avatar_url} alt="avatar preview" className="h-24 w-24 rounded-[28px] object-cover ring-4 ring-white/70 dark:ring-slate-700/60" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary to-cyan-500 text-4xl font-black text-white shadow-lg shadow-primary/20">
                    {initials}
                  </div>
                )}

                <h4 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-slate-50">{draft.display_name || 'Người học mới'}</h4>
                <div className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
                  <Mail size={14} />
                  <span className="truncate">{email || 'Chưa đăng nhập'}</span>
                </div>

                <div className="mt-4 w-full rounded-[22px] bg-white/75 p-4 text-left dark:bg-slate-900/60">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Mục tiêu hiện tại</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{draft.study_goal || 'Chưa đặt mục tiêu'}</p>
                </div>
              </div>
            </div>

            <div className="card-pro rounded-[28px] p-5">
              <div className="space-y-4">
                <label className="space-y-2">
                  <span className="font-display text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Tên hiển thị</span>
                  <input
                    value={draft.display_name}
                    onChange={(event) => setDraft((prev) => ({ ...prev, display_name: event.target.value }))}
                    className="input-pro border border-white/80 dark:border-slate-700/80"
                    placeholder="Ví dụ: Jun TOPIK"
                  />
                </label>

                <label className="space-y-2">
                  <span className="font-display text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Mục tiêu học</span>
                  <input
                    value={draft.study_goal}
                    onChange={(event) => setDraft((prev) => ({ ...prev, study_goal: event.target.value }))}
                    className="input-pro border border-white/80 dark:border-slate-700/80"
                    placeholder="20 từ mỗi ngày"
                  />
                </label>

                <div className="space-y-2">
                  <span className="font-display text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Ảnh đại diện</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />

                  <div className="surface-muted rounded-[24px] p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        {draft.avatar_url ? (
                          <img src={draft.avatar_url} alt="avatar preview" className="h-16 w-16 rounded-[20px] object-cover" />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-slate-200 text-lg font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            <UserRound size={22} />
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {draft.avatar_url ? 'Ảnh đã sẵn sàng để lưu' : 'Chưa chọn ảnh đại diện'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">Chọn ảnh từ máy tính hoặc điện thoại, app sẽ tự tối ưu kích thước trước khi lưu.</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="control-chip flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200"
                        >
                          <ImagePlus size={16} />
                          {uploading ? 'Đang xử lý...' : 'Tải ảnh lên'}
                        </button>

                        {draft.avatar_url ? (
                          <button
                            type="button"
                            onClick={() => setDraft((prev) => ({ ...prev, avatar_url: '' }))}
                            className="control-chip flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-rose-600 dark:text-rose-300"
                          >
                            <Trash2 size={16} />
                            Xóa ảnh
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="control-chip rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-200">
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => onSave(draft)}
                  disabled={saving}
                  className="btn-premium btn-primary-pro rounded-2xl px-5 py-3 text-sm font-bold disabled:opacity-70"
                >
                  <Save size={16} />
                  {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
