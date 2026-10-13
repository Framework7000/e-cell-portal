'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Lock, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [show, setShow] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || 'Authentication failed');
            }
            window.location.href = '/';
        } catch (err: any) {
            setError(err?.message || 'Authentication failed');
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-4 bg-[#f8fafc] relative overflow-hidden">
            {/* Subtle brand ambient accents matching the flame/amber logo */}
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#EA580C]/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#F59E0B]/10 blur-3xl pointer-events-none" />

            <div className="w-full max-w-sm">
                <form
                    onSubmit={submit}
                    className="relative bg-white border border-slate-200/90 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 backdrop-blur-sm"
                >
                    {/* Official Logo & Header */}
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="relative w-20 h-20 mb-3 p-1 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs flex items-center justify-center">
                            <Image
                                src="/ecell-logo.png"
                                alt="E-Cell JEC Official Logo"
                                fill
                                className="object-contain p-1"
                                priority
                            />
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-base font-extrabold tracking-tight text-slate-900">E-CELL</span>
                            <span className="text-base font-extrabold text-[#EA580C]">JEC</span>
                        </div>
                        <h1 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                            Official Management Portal
                        </h1>
                        <p className="text-[11px] text-slate-400 mt-1">
                            Jabalpur Engineering College • Restricted Access
                        </p>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                                Access Password
                            </label>
                            <span className="text-[10px] text-slate-400">Default: farmkaro</span>
                        </div>
                        <div className="relative">
                            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                id="password"
                                type={show ? 'text' : 'password'}
                                autoFocus
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-lg bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C] transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShow((s) => !s)}
                                aria-label={show ? 'Hide password' : 'Show password'}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                            >
                                {show ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div
                            role="alert"
                            className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-1.5"
                        >
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !password}
                        className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#EA580C] to-[#F59E0B] hover:opacity-95 disabled:opacity-50 transition shadow-md shadow-orange-500/20 active:scale-[0.99]"
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <>
                                <span>Unlock Portal</span>
                                <ArrowRight size={15} />
                            </>
                        )}
                    </button>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                        <ShieldCheck size={13} className="text-emerald-600" />
                        <span>Protected by Edge Session Security</span>
                    </div>
                </form>
            </div>
        </main>
    );
}
