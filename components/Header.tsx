'use client';

import React from 'react';
import Image from 'next/image';
import { RefreshCw, LogOut, Link2 } from 'lucide-react';
import type { Tab } from '@/components/Sidebar';

interface Props {
    activeTab: Tab;
    onTabChange?: (t: Tab) => void;
    totalCount?: number;
    isRefreshing: boolean;
    onRefresh: () => void;
    lastUpdated: string;
    onLogout: () => void;
    onConfigureWhatsAppLinks?: () => void;
}

const titles: Record<Tab, { title: string; sub: string }> = {
    overview: { title: 'Executive Overview', sub: 'Real-time recruitment metrics & latest applicant breakdown' },
    submissions: { title: 'Candidates Registry', sub: 'Comprehensive applicant tracking, bulk evaluations & edits' },
    shortlisted: { title: 'Shortlisted Candidates (Send Queue)', sub: 'Automate emails with domain-specific WhatsApp group links' },
    selected: { title: 'Selected Candidates (Domain-Wise)', sub: 'Official roster structured by domain with delivery verification' },
    analytics: { title: 'Cohort Analytics', sub: 'Domain, academic year & department distribution visualizations' },
    sync: { title: 'Cloud Sync', sub: 'Live integration status with Google Sheets' },
};

export default function Header({
    activeTab,
    isRefreshing,
    onRefresh,
    lastUpdated,
    onLogout,
    onConfigureWhatsAppLinks,
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
                    {/* Domain WhatsApp Links Button */}
                    {onConfigureWhatsAppLinks && (
                        <button
                            onClick={onConfigureWhatsAppLinks}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition shadow-2xs"
                            title="Configure domain WhatsApp invite links"
                        >
                            <Link2 size={13} className="text-emerald-600" />
                            <span className="hidden sm:inline">WhatsApp Links</span>
                        </button>
                    )}

                    {/* Live Sheet Status Pill */}
                    <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-800 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Google Sheets Live</span>
                        <span className="mono-num text-emerald-700/80 text-[10px]">• {lastUpdated}</span>
                    </div>

                    {/* Sync Refresh Button */}
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg disabled:opacity-60 transition shadow-2xs cursor-pointer"
                        aria-label="Refresh Data"
                        title="Sync with Google Sheets"
                    >
                        <RefreshCw
                            size={14}
                            className={isRefreshing ? 'animate-spin text-[#EA580C]' : 'text-slate-500'}
                        />
                        <span className="hidden sm:inline font-semibold">Sync</span>
                    </button>

                    {/* Sign out */}
                    <button
                        onClick={onLogout}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Sign Out"
                        aria-label="Sign Out"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
}
