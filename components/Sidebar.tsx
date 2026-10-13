'use client';

import React from 'react';
import Image from 'next/image';
import { LayoutDashboard, Users, PieChart, LogOut, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

export type Tab = 'overview' | 'submissions' | 'analytics' | 'sync';

interface Props {
    activeTab: Tab;
    onTabChange: (t: Tab) => void;
    totalCount: number;
    pendingCount: number;
    isRefreshing: boolean;
    onRefresh: () => void;
    lastUpdated: string;
    onLogout: () => void;
}

const items = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'submissions' as const, label: 'Candidates', icon: Users },
    { id: 'analytics' as const, label: 'Analytics', icon: PieChart },
];

export default function Sidebar({
    activeTab,
    onTabChange,
    totalCount,
    pendingCount,
    isRefreshing,
    onRefresh,
    lastUpdated,
    onLogout,
}: Props) {
    return (
        <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-white text-slate-800 z-30 border-r border-slate-200 shadow-sm">
            {/* Official Brand Header */}
            <div className="flex items-center gap-3 px-5 h-20 border-b border-slate-100 bg-slate-50/40">
                <div className="relative w-11 h-11 shrink-0 p-0.5 rounded-lg bg-white border border-slate-200/80 shadow-xs flex items-center justify-center">
                    <Image
                        src="/ecell-logo.png"
                        alt="E-Cell JEC Logo"
                        fill
                        className="object-contain p-1"
                        priority
                    />
                </div>
                <div className="leading-tight">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold tracking-tight text-slate-900">E-CELL</span>
                        <span className="text-sm font-extrabold text-[#EA580C]">JEC</span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-500">Official Portal</div>
                    <div className="text-[9px] text-slate-400 font-mono tracking-tight">Jabalpur Engineering College</div>
                </div>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Main Navigation">
                <div className="px-3 pb-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspace</span>
                    <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                    </span>
                </div>

                {items.map(({ id, label, icon: Icon }) => {
                    const active = activeTab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onTabChange(id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all relative ${
                                active
                                    ? 'bg-orange-50/80 text-[#EA580C] font-semibold border-r-2 border-[#EA580C] shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Icon
                                size={17}
                                className={active ? 'text-[#EA580C]' : 'text-slate-400'}
                            />
                            <span className="flex-1 text-left">{label}</span>
                            {id === 'submissions' && (
                                <span
                                    className={`text-[10px] mono-num px-2 py-0.5 rounded-full font-semibold ${
                                        active
                                            ? 'bg-[#EA580C] text-white'
                                            : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                    {totalCount}
                                </span>
                            )}
                        </button>
                    );
                })}

                {/* Candidate Review Status Metric Box */}
                <div className="mt-6 mx-1 p-3.5 rounded-xl bg-gradient-to-br from-amber-50/70 to-orange-50/50 border border-amber-200/70">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-amber-900">
                        <span>Awaiting Review</span>
                        <span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-amber-700 border border-amber-200 mono-num">
                            {totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0}%
                        </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold mono-num text-[#EA580C]">{pendingCount}</span>
                        <span className="text-xs text-slate-500 font-medium">pending of {totalCount} total</span>
                    </div>
                    <div className="w-full bg-amber-200/60 rounded-full h-1.5 mt-2.5 overflow-hidden">
                        <div
                            className="bg-[#EA580C] h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${totalCount > 0 ? ((totalCount - pendingCount) / totalCount) * 100 : 0}%`,
                            }}
                        />
                    </div>
                    <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                        <span>{totalCount - pendingCount} Reviewed</span>
                        <span className="text-emerald-600 font-medium">Active Drive</span>
                    </div>
                </div>

                {/* Database & Sheets Verification Badge */}
                <div className="mt-4 mx-1 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-[11px]">
                        <ShieldCheck size={14} className="text-emerald-600" />
                        <span>Connected Sources</span>
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                        • Google Sheets (Primary Live)<br />
                        • Failover Circuit Breaker (Enabled)
                    </div>
                </div>
            </nav>

            {/* Bottom Actions & User Profile */}
            <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2">
                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-60 shadow-2xs"
                >
                    <span className="flex items-center gap-2">
                        <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#EA580C]' : 'text-slate-500'} />
                        {isRefreshing ? 'Syncing...' : 'Sync Sheet'}
                    </span>
                    <span className="mono-num text-slate-400 text-[10px]">{lastUpdated}</span>
                </button>

                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                >
                    <LogOut size={14} />
                    <span>Lock / Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
