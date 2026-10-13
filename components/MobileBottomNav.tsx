'use client';

import React from 'react';
import { LayoutDashboard, Users, PieChart, RefreshCw } from 'lucide-react';

interface Props {
    activeTab: 'overview' | 'submissions' | 'analytics' | 'sync';
    onTabChange: (tab: 'overview' | 'submissions' | 'analytics' | 'sync') => void;
    totalCount: number;
    isRefreshing: boolean;
    onRefresh: () => void;
}

export default function MobileBottomNav({
    activeTab,
    onTabChange,
    totalCount,
    isRefreshing,
    onRefresh,
}: Props) {
    const tabs = [
        {
            id: 'overview' as const,
            label: 'Overview',
            icon: LayoutDashboard,
        },
        {
            id: 'submissions' as const,
            label: 'Candidates',
            icon: Users,
            badge: totalCount,
        },
        {
            id: 'analytics' as const,
            label: 'Analytics',
            icon: PieChart,
        },
        {
            id: 'sync' as const,
            label: 'Sync',
            icon: RefreshCw,
            spin: isRefreshing,
        },
    ];

    return (
        <nav
            aria-label="Mobile Navigation"
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-area-bottom shadow-lg"
        >
            <div className="w-full grid grid-cols-4 h-16">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                if (tab.id === 'sync') {
                                    onRefresh();
                                } else {
                                    onTabChange(tab.id);
                                }
                            }}
                            className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors relative py-1 ${
                                isActive ? 'text-[#EA580C] font-semibold' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <div className="relative">
                                <Icon
                                    size={18}
                                    className={tab.spin ? 'animate-spin text-[#EA580C]' : ''}
                                />
                                {tab.badge !== undefined && (
                                    <span className="absolute -top-1.5 -right-3 text-[9px] font-bold bg-[#EA580C] text-white rounded-full px-1 min-w-[15px] text-center mono-num leading-tight shadow-2xs">
                                        {tab.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] tracking-tight font-medium">
                                {tab.label}
                            </span>
                            {isActive && (
                                <span className="absolute bottom-0 w-8 h-0.5 bg-[#EA580C] rounded-t-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
