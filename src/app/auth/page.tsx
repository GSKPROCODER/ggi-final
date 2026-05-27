'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, Lock, User, ArrowRight, Loader2, CheckCircle2,
  Quote, AlertCircle, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { authApi, tokenStorage } from '@/lib/api';
import Logo from '@/components/Logo';

const FEATURES = [
  'Real-time sentiment & emotion analysis',
  'Batch processing for large datasets',
  'Automated risk detection & alerts',
  'Conversational AI data exploration',
  'Gemini 2.5 Flash — server-side, always secure',
];

/**
 * Authentication view supporting both Sign In and Sign Up flows.
 * Incorporates elegant animations, validation feedback, and robust token caching.
 */
export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { login, isAuthenticated } = useStore();

  // If already authenticated, bypass login screen directly
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const tokens = isLogin
        ? await authApi.login(email, password)
        : await authApi.register(name, email, password);
      tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
      const user = await authApi.getMe();
      login(user, tokens.access_token, tokens.refresh_token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex bg-background dark overflow-hidden">
      {/* ── Left: Branding ────────────────────────────────── */}
      <div className="hidden lg:flex w-[52%] shrink-0 relative flex-col justify-between p-12 overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-primary/8 blur-[100px] animate-blob" />
          <div className="absolute bottom-[-15%] right-[-15%] w-[500px] h-[500px] rounded-full bg-violet-500/6 blur-[100px] animate-blob animation-delay-4000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-[80px] animate-blob animation-delay-2000" />
        </div>

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #818cf8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="relative z-10 flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary">
            <Logo className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Nexus AI</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold border border-primary/20 uppercase tracking-widest">Beta</span>
        </motion.div>

        {/* Hero copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative z-10 max-w-lg"
        >
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={16} className="text-primary" />
            <span className="text-[13px] font-medium text-primary">Powered by Gemini 2.5 Flash</span>
          </div>
          <h1 className="text-[2.75rem] font-semibold tracking-tight leading-[1.1] mb-5">
            Turn raw text into<br />
            <span className="text-gradient">actionable intelligence.</span>
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-10">
            Enterprise-grade text analytics for modern teams. Extract sentiment, detect anomalies, and generate executive reports — all in real-time.
          </p>

          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                className="flex items-center gap-3 text-[13px] text-foreground/70"
              >
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={12} className="text-primary" />
                </div>
                {f}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="relative z-10 glass-card rounded-2xl p-5"
        >
          <Quote size={20} className="text-primary/30 mb-3" />
          <p className="text-[13px] text-foreground/80 leading-relaxed mb-4">
            "Nexus AI transformed how we understand customer feedback. We went from manual reading to automated, actionable insights in days."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden border border-border shrink-0">
              <img src="https://picsum.photos/seed/sarah99/80/80" alt="Sarah J." className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <p className="text-[13px] font-semibold">Sarah Jenkins</p>
              <p className="text-[11px] text-muted-foreground">VP of Product, TechFlow</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Right: Auth form ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-[380px]"
        >
          {/* Mobile logo */}
          <div className="flex flex-col items-center text-center mb-8 lg:hidden">
            <div className="w-11 h-11 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary mb-3">
              <Logo className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold">Nexus AI</h1>
          </div>

          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login-title' : 'register-title'}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="mb-7"
            >
              <h2 className="text-2xl font-semibold tracking-tight mb-1">
                {isLogin ? 'Welcome back' : 'Create an account'}
              </h2>
              <p className="text-[13px] text-muted-foreground">
                {isLogin ? 'Sign in to your workspace.' : 'Start for free — no credit card required.'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: '1.25rem' }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2 text-[13px] text-destructive">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pb-0.5">
                    <label className="block text-[13px] font-medium mb-1.5">Full Name</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required={!isLogin}
                        minLength={2}
                        autoComplete="name"
                        className="field !pl-10"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-[13px] font-medium mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  className="field !pl-10"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-[13px] font-medium">Password</label>
                {!isLogin && <span className="text-[11px] text-muted-foreground mt-0.5">(Min. 6 characters)</span>}
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className="field !pl-10"
                />
              </div>
            </div>

            <button
              type="submit" disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-xl text-[14px] font-semibold transition-all duration-200',
                'bg-primary text-primary-foreground shadow-lg shadow-primary/25',
                'hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 group'
              )}
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /><span>{isLogin ? 'Signing in…' : 'Creating account…'}</span></>
              ) : (
                <><span>{isLogin ? 'Sign In' : 'Create Account'}</span><ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-primary hover:underline font-medium">
              {isLogin ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
