import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowRight, Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const FLOATING_EMOJIS = [
  { emoji: '🏥', left: '5%', size: '36px', duration: '18s', delay: '-3s' },
  { emoji: '🩺', left: '14%', size: '26px', duration: '22s', delay: '-15s' },
  { emoji: '🚑', left: '23%', size: '30px', duration: '20s', delay: '-8s' },
  { emoji: '💊', left: '33%', size: '24px', duration: '17s', delay: '-11s' },
  { emoji: '🏥', left: '42%', size: '40px', duration: '24s', delay: '-19s' },
  { emoji: '🌡️', left: '53%', size: '28px', duration: '19s', delay: '-5s' },
  { emoji: '💉', left: '63%', size: '26px', duration: '23s', delay: '-16s' },
  { emoji: '🩹', left: '73%', size: '24px', duration: '16s', delay: '-2s' },
  { emoji: '🏥', left: '82%', size: '36px', duration: '21s', delay: '-12s' },
  { emoji: '🧬', left: '91%', size: '28px', duration: '25s', delay: '-9s' },
  { emoji: '❤️‍🩹', left: '28%', size: '26px', duration: '21s', delay: '-17s' },
  { emoji: '🩺', left: '68%', size: '26px', duration: '20s', delay: '-7s' },
  { emoji: '🏥', left: '48%', size: '34px', duration: '22s', delay: '-14s' },
];

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden select-none">
      {/* Floating Hospital Emojis in Background (White Theme) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {FLOATING_EMOJIS.map((item, idx) => (
          <span
            key={idx}
            className="animate-float-emoji"
            style={{
              left: item.left,
              fontSize: item.size,
              animationDuration: item.duration,
              animationDelay: item.delay,
            }}
          >
            {item.emoji}
          </span>
        ))}
      </div>

      {/* Main Login Card */}
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight font-display text-slate-900 flex items-center justify-center gap-2">
            VirusCare
          </h1>
          <p className="mt-1.5 text-xs text-slate-500 font-medium tracking-wide">
            Hospital Quarantine & Patient Management System
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-2xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Staff Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@viruscare.org"
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 active:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to VirusCare'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Authorized Medical & Administrative Staff Only</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
