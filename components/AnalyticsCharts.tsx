'use client';

import React, { useState } from 'react';
import { PieChart, Layers, Users, GraduationCap, Building2, TrendingUp, CheckCircle2 } from 'lucide-react';
import { ApplicationRecord } from '@/lib/google-sheets';

interface Props {
    submissions: ApplicationRecord[];
}

export default function AnalyticsCharts({ submissions }: Props) {
    const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);
    const [hoveredYear, setHoveredYear] = useState<string | null>(null);

    const total = submissions.length || 1;

    // 1. Domain breakdown
    const domainCounts: Record<string, number> = {};
    submissions.forEach((s) => {
        const raw = (s.domain || 'General').trim();
        let normalized = 'General';
        if (/tech/i.test(raw)) normalized = 'Technical';
        else if (/design/i.test(raw)) normalized = 'Design';
        else if (/market/i.test(raw)) normalized = 'Marketing';
        else if (/manage|lead/i.test(raw)) normalized = 'Management';
        else if (/content|writ/i.test(raw)) normalized = 'Content & PR';
        else if (/event/i.test(raw)) normalized = 'Events';
        else normalized = raw || 'General';

        domainCounts[normalized] = (domainCounts[normalized] || 0) + 1;
    });

    const domainColors: Record<string, { fill: string; stroke: string; bg: string; text: string }> = {
        'Technical': { fill: '#2563eb', stroke: '#1d4ed8', bg: 'bg-blue-50', text: 'text-blue-700' },
        'Design': { fill: '#7c3aed', stroke: '#6d28d9', bg: 'bg-purple-50', text: 'text-purple-700' },
        'Marketing': { fill: '#ea580c', stroke: '#c2410c', bg: 'bg-orange-50', text: 'text-orange-700' },
        'Management': { fill: '#059669', stroke: '#047857', bg: 'bg-emerald-50', text: 'text-emerald-700' },
        'Content & PR': { fill: '#d97706', stroke: '#b45309', bg: 'bg-amber-50', text: 'text-amber-700' },
        'Events': { fill: '#0891b2', stroke: '#0e7490', bg: 'bg-cyan-50', text: 'text-cyan-700' },
        'General': { fill: '#64748b', stroke: '#475569', bg: 'bg-slate-50', text: 'text-slate-700' },
    };

    const domainList = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);

    // 2. Year breakdown
    const yearCounts: Record<string, number> = {};
    submissions.forEach((s) => {
        const y = (s.year || '1').toString().trim();
        const label = y.includes('1') ? '1st Year' : y.includes('2') ? '2nd Year' : y.includes('3') ? '3rd Year' : '4th Year';
        yearCounts[label] = (yearCounts[label] || 0) + 1;
    });

    const yearColors: Record<string, string> = {
        '1st Year': '#3b82f6',
        '2nd Year': '#10b981',
        '3rd Year': '#f59e0b',
        '4th Year': '#8b5cf6',
    };

    const yearList = Object.entries(yearCounts).sort((a, b) => b[1] - a[1]);

    // 3. Branch breakdown
    const branchCounts: Record<string, number> = {};
    submissions.forEach((s) => {
        let b = (s.branch || 'Other').trim().toUpperCase();
        if (/COMPUTER|CS/i.test(b)) b = 'CSE';
        else if (/INFO|IT/i.test(b)) b = 'IT';
        else if (/ELECTRO|EC/i.test(b)) b = 'ECE';
        else if (/ELECTRI|EE/i.test(b)) b = 'EE';
        else if (/MECH|ME/i.test(b)) b = 'ME';
        else if (/CIVIL|CE/i.test(b)) b = 'CE';
        branchCounts[b] = (branchCounts[b] || 0) + 1;
    });

    const branchList = Object.entries(branchCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // 4. Status breakdown
    const statusCounts: Record<string, number> = {
        pending: 0,
        shortlisted: 0,
        selected: 0,
        rejected: 0,
    };
    submissions.forEach((s) => {
        const st = s.status || 'pending';
        if (statusCounts[st] !== undefined) statusCounts[st] += 1;
        else statusCounts.pending += 1;
    });

    // SVG Donut generator helper
    const renderDonutSlices = (
        data: [string, number][],
        colorMap: (key: string) => string,
        hoveredKey: string | null,
        onHover: (key: string | null) => void
    ) => {
        const radius = 60;
        const cx = 80;
        const cy = 80;
        const strokeWidth = 26;
        const circumference = 2 * Math.PI * radius;
        let cumulativeAngle = 0;

        return (
            <svg width="160" height="160" className="transform -rotate-90 overflow-visible">
                {data.map(([key, count]) => {
                    const pct = count / total;
                    const strokeDasharray = `${pct * circumference} ${circumference}`;
                    const strokeDashoffset = -cumulativeAngle * circumference;
                    cumulativeAngle += pct;
                    const color = colorMap(key);
                    const isHovered = hoveredKey === key;

                    return (
                        <circle
                            key={key}
                            cx={cx}
                            cy={cy}
                            r={radius}
                            fill="transparent"
                            stroke={color}
                            strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-200 cursor-pointer"
                            onMouseEnter={() => onHover(key)}
                            onMouseLeave={() => onHover(null)}
                        />
                    );
                })}
            </svg>
        );
    };

    return (
        <div className="space-y-4">
            {/* Top KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-medium tracking-tight uppercase">Total Candidates</span>
                        <Users size={14} className="text-slate-400" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 mono-num tracking-tight">{submissions.length}</span>
                        <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Live</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Recruitment Drive</span>
                        <span className="mono-num font-medium text-slate-700">2026</span>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-medium tracking-tight uppercase">Technical Share</span>
                        <Layers size={14} className="text-blue-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 mono-num tracking-tight">
                            {domainCounts['Technical'] || 0}
                        </span>
                        <span className="text-[11px] text-slate-500 mono-num">
                            ({Math.round(((domainCounts['Technical'] || 0) / total) * 100)}%)
                        </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Dev, Web & Sys</span>
                        <span className="text-blue-600 font-medium text-[10px]">Lead Domain</span>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-medium tracking-tight uppercase">1st & 2nd Year Ratio</span>
                        <GraduationCap size={14} className="text-emerald-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 mono-num tracking-tight">
                            {Math.round((((yearCounts['1st Year'] || 0) + (yearCounts['2nd Year'] || 0)) / total) * 100)}%
                        </span>
                        <span className="text-[11px] text-slate-500 mono-num">fresh batch</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Junior Talent</span>
                        <span className="mono-num text-slate-700 font-medium">{(yearCounts['1st Year'] || 0) + (yearCounts['2nd Year'] || 0)} applied</span>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-medium tracking-tight uppercase">Review Pipeline</span>
                        <CheckCircle2 size={14} className="text-amber-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 mono-num tracking-tight">
                            {statusCounts.shortlisted + statusCounts.selected}
                        </span>
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                            {statusCounts.pending} pending
                        </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Shortlisted/Accepted</span>
                        <span className="mono-num text-slate-700 font-medium">
                            {Math.round(((statusCounts.shortlisted + statusCounts.selected) / total) * 100)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Graphical Analytics Row: 2 Systematic Pie/Donut Charts + Branch Bar Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Domain Breakdown Pie Chart */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                        <div className="flex items-center gap-1.5">
                            <PieChart size={14} className="text-blue-600" />
                            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-tight">Domain Share</h3>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{domainList.length} domains</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 py-2">
                        {/* Interactive SVG Donut */}
                        <div className="relative flex-shrink-0 flex items-center justify-center">
                            {renderDonutSlices(
                                domainList,
                                (key) => domainColors[key]?.fill || '#94a3b8',
                                hoveredDomain,
                                setHoveredDomain
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Total</span>
                                <span className="text-sm font-bold text-slate-800 mono-num">{submissions.length}</span>
                            </div>
                        </div>

                        {/* Aligned Systematic Legend */}
                        <div className="w-full sm:flex-1 space-y-1 min-w-0">
                            {domainList.slice(0, 5).map(([domain, count]) => {
                                const pct = Math.round((count / total) * 100);
                                const isHovered = hoveredDomain === domain;
                                const c = domainColors[domain] || { fill: '#64748b', bg: 'bg-slate-50', text: 'text-slate-700' };

                                return (
                                    <div
                                        key={domain}
                                        onMouseEnter={() => setHoveredDomain(domain)}
                                        onMouseLeave={() => setHoveredDomain(null)}
                                        className={`flex items-center justify-between text-[11px] p-1 rounded transition-colors cursor-pointer ${
                                            isHovered ? 'bg-slate-100' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 truncate">
                                            <span
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: c.fill }}
                                            />
                                            <span className="truncate text-slate-700 font-medium">{domain}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-1 mono-num text-slate-500">
                                            <span className="font-semibold text-slate-800">{count}</span>
                                            <span className="text-[10px] text-slate-400">({pct}%)</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 2. Year Distribution Pie Chart */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                        <div className="flex items-center gap-1.5">
                            <GraduationCap size={14} className="text-emerald-600" />
                            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-tight">Academic Year</h3>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">Batch 2026</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 py-2">
                        {/* Interactive SVG Donut */}
                        <div className="relative flex-shrink-0 flex items-center justify-center">
                            {renderDonutSlices(
                                yearList,
                                (key) => yearColors[key] || '#94a3b8',
                                hoveredYear,
                                setHoveredYear
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Cohorts</span>
                                <span className="text-sm font-bold text-slate-800 mono-num">{yearList.length}</span>
                            </div>
                        </div>

                        {/* Aligned Systematic Legend */}
                        <div className="w-full sm:flex-1 space-y-1 min-w-0">
                            {yearList.map(([year, count]) => {
                                const pct = Math.round((count / total) * 100);
                                const isHovered = hoveredYear === year;
                                const color = yearColors[year] || '#94a3b8';

                                return (
                                    <div
                                        key={year}
                                        onMouseEnter={() => setHoveredYear(year)}
                                        onMouseLeave={() => setHoveredYear(null)}
                                        className={`flex items-center justify-between text-[11px] p-1 rounded transition-colors cursor-pointer ${
                                            isHovered ? 'bg-slate-100' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 truncate">
                                            <span
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: color }}
                                            />
                                            <span className="truncate text-slate-700 font-medium">{year}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-1 mono-num text-slate-500">
                                            <span className="font-semibold text-slate-800">{count}</span>
                                            <span className="text-[10px] text-slate-400">({pct}%)</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 3. Branch Breakdown Bar Matrix */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                        <div className="flex items-center gap-1.5">
                            <Building2 size={14} className="text-amber-600" />
                            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-tight">Engineering Branch</h3>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">Top Disciplines</span>
                    </div>

                    <div className="space-y-2 py-1 flex-1 flex flex-col justify-center">
                        {branchList.map(([branch, count]) => {
                            const pct = Math.round((count / total) * 100);
                            return (
                                <div key={branch} className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="font-mono font-semibold text-slate-800">{branch}</span>
                                        <span className="mono-num text-slate-500 text-[11px]">
                                            <strong className="text-slate-900">{count}</strong> ({pct}%)
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-slate-800 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.max(pct, 6)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
