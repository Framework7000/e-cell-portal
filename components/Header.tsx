'use client';

import React from 'react';
import Image from 'next/image';
import { RefreshCw, LogOut } from 'lucide-react';
import type { Tab } from '@/components/Sidebar';

interface Props {
    activeTab: Tab;
    onTabChange?: (t: Tab) => void;
    totalCount?: number;
    isRefreshing: boolean;
    onRefresh: () => void;
    lastUpdated: string;
    onLogout: () => void;
}

const titles: Record<Tab, { title: string; sub: string }> = {
    overview: { title: 'Executive Overview', sub: 'Real-time recruitment metrics & latest applicant breakdown' },
    submissions: { title: 'Candidates Registry', sub: 'Comprehensive applicant tracking, evaluation & direct outreach' },
    analytics: { title: 'Cohort Analytics', sub: 'Domain, academic year & department distribution visualizations' },
    sync: { title: 'Cloud Sync', sub: 'Live integration status with Google Sheets' },
};

export default function Header({
    activeTab,
    isRefreshing,
    onRefresh,
    lastUpdated,
    onLogout,
}: Props) {
    const t = titles[activeTab] || titles.overview;

    return (
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                {/* Mobile Brand Bar */}
                <div className="flex items-center gap-2.5 md:hidden">
                    <div className="relative w-8 h-8 rounded-md bg-white border border-slate-200 p-0.5 shadow-2xs">
                        <Image
                            src="/ecell-logo.png"
                            alt="E-Cell JEC Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div className="leading-tight">
                        <div className="text-xs font-bold text-slate-900">
                            E-CELL <span className="text-[#EA580C]">JEC</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">{t.title}</div>
                    </div>
                </div>

                {/* Desktop Breadcrumbs & Section Title */}
                <div className="hidden md:block leading-tight">
                    <h1 className="text-sm font-bold text-slate-900 tracking-tight">{t.title}</h1>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">{t.sub}</p>
                </div>

                {/* Status & Action Buttons */}
                <div className="flex items-center gap-2.5">
                    {/* Live Sheet Status Pill */}
                    <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-800 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Google Sheets Sync</span>
                        <span className="mono-num text-emerald-700/80 text-[10px]">• {lastUpdated}</span>
                    </div>

                    {/* Sync Refresh Button */}
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg disabled:opacity-60 transition shadow-2xs"
                        aria-label="Refresh Data"
                        title="Sync with Google Sheets"
                    >
                        <RefreshCw
                            size={14}
                            className={isRefreshing ? 'animate-spin text-[#EA580C]' : 'text-slate-600'}
                        />
                        <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
                    </button>

                    {/* Logout Button (Header mobile/quick action) */}
                    <button
                        onClick={onLogout}
                        className="md:hidden flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-lg transition"
                        aria-label="Sign out"
                    >
                        <LogOut size={14} />
                    </button>
                </div>
            </div>
        </header>
    );
}
