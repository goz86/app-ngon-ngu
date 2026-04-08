import React, { useState } from 'react';
import { ArrowLeft, Loader2, Lock, LogIn, Mail, UserPlus } from 'lucide-react';

export default function AuthPage({ onSignIn, onSignUp, onGoogleSignIn, onBack }) {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setMessage('');

    try {
      if (activeTab === 'login') {
        await onSignIn(email.trim(), password.trim());
        setMessage(password.trim() ? 'Đăng nhập thành công.' : 'Đã gửi magic link vào email của bạn.');
      } else {
        await onSignUp(email.trim(), password.trim());
        setMessage('Tạo tài khoản thành công. Hãy kiểm tra email để xác nhận nếu Supabase yêu cầu.');
      }
    } catch (error) {
      setMessage(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-50 p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 px-1 py-2 text-sm font-semibold text-slate-500 transition-colors hover:text-primary">
          <ArrowLeft size={16} />
          Quay lại trang học
        </button>

        <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-2xl shadow-slate-200">
          <div className="p-8 sm:p-10">
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {activeTab === 'login' ? <LogIn size={28} /> : <UserPlus size={28} />}
              </div>
              <h1 className="text-2xl font-bold text-slate-800">Tài khoản học tập</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">Đăng nhập để đồng bộ tiến độ, hồ sơ và bộ từ cá nhân.</p>
            </div>

            <button
              onClick={onGoogleSignIn}
              className="mb-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Tiếp tục với Google
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 font-black tracking-widest text-slate-400">Hoặc dùng email</span>
              </div>
            </div>

            <div className="mb-6 flex rounded-2xl bg-slate-100 p-1">
              <button
                onClick={() => {
                  setActiveTab('login');
                  setMessage('');
                }}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${activeTab === 'login' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
              >
                Đăng nhập
              </button>
              <button
                onClick={() => {
                  setActiveTab('signup');
                  setMessage('');
                }}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${activeTab === 'signup' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
              >
                Đăng ký
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
                <div className="group relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="ban@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none transition-all focus:border-primary focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Mật khẩu {activeTab === 'login' && <span className="normal-case tracking-normal">(để trống nếu dùng magic link)</span>}
                </label>
                <div className="group relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none transition-all focus:border-primary focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : activeTab === 'login' ? (
                  'Đăng nhập'
                ) : (
                  'Tạo tài khoản'
                )}
              </button>
            </form>

            {message ? (
              <div className={`mt-4 rounded-xl p-3 text-center text-[12px] font-medium ${message.toLowerCase().includes('lỗi') ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                {message}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
