import React, { useState } from 'react';
import { LogIn, LogOut, Mail } from 'lucide-react';

export default function AuthPanel({ user, enabled, onSignIn, onSignOut, status }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      await onSignIn(email.trim());
      setMessage('Đã gửi magic link đến email của bạn.');
    } catch (error) {
      setMessage(error.message || 'Không thể gửi email đăng nhập.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!enabled) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
        Supabase chưa được cấu hình. Hãy thêm `.env` để bật đăng nhập và đồng bộ.
      </div>
    );
  }

  if (user) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Tài khoản</p>
            <p className="mt-2 text-sm font-semibold text-slate-700">{user.email}</p>
            <p className="mt-1 text-xs text-slate-400">{status}</p>
          </div>
          <button
            onClick={onSignOut}
            className="btn-premium btn-secondary-pro px-4 py-2 text-sm"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Đăng nhập Supabase</p>
      <p className="mt-2 text-sm text-slate-500">
        Nhập email để nhận magic link và đồng bộ tiến độ học trên nhiều thiết bị.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
          <Mail size={16} className="text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ban@example.com"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="btn-premium btn-primary-pro px-4 py-3 text-sm"
        >
          <LogIn size={16} /> {submitting ? 'Đang gửi...' : 'Gửi link đăng nhập'}
        </button>
      </form>

      {message && <p className="mt-3 text-xs text-slate-500">{message}</p>}
    </div>
  );
}
