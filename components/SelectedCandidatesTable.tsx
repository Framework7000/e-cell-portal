'use client';

import React, { useState, useMemo } from 'react';
import { Search, Download, Copy, Check, Eye, Pencil, Trash2, Send, CheckCircle2, MessageSquare, Phone, Users, Sparkles, LayoutGrid, Code2, Palette, Megaphone, Briefcase, FileText, Mail, RefreshCw } from 'lucide-react';
import { ApplicationRecord } from '@/lib/google-sheets';
import { formatIndianDateTime } from '@/lib/date-utils';

interface Props {
    submissions: ApplicationRecord[];
    onSelectCandidate: (candidate: ApplicationRecord) => void;
    onEdit?: (candidate: ApplicationRecord) => void;
    onDelete?: (candidate: ApplicationRecord) => void;
    onSendEmail?: (candidates: ApplicationRecord[]) => Promise<void>;
    isSending?: boolean;
}

export default function SelectedCandidatesTable({
    submissions,
    onSelectCandidate,
    onEdit,
    onDelete,
    onSendEmail,
    isSending,
}: Props) {
    const [search, setSearch] = useState('');
    const [domainFilter, setDomainFilter] = useState('all');
    const [copiedEmails, setCopiedEmails] = useState(false);

    // Filter only selected candidates
    const selectedCandidates = useMemo(() => {
        return submissions.filter((s) => s.status === 'selected');
    }, [submissions]);

    // Domain counters
    const domainCounts = useMemo(() => {
        const counts: Record<string, number> = {
            all: selectedCandidates.length,
            technical: 0,
            design: 0,
            marketing: 0,
            management: 0,
            content: 0,
        };

        selectedCandidates.forEach((c) => {
            const d = c.domain.toLowerCase();
            if (d.includes('tech') || d.includes('web') || d.includes('code')) counts.technical++;
            else if (d.includes('design') || d.includes('ui') || d.includes('video')) counts.design++;
            else if (d.includes('market') || d.includes('growth')) counts.marketing++;
            else if (d.includes('manage') || d.includes('pr')) counts.management++;
            else if (d.includes('content') || d.includes('write')) counts.content++;
        });

        return counts;
    }, [selectedCandidates]);

    const filtered = useMemo(() => {
        return selectedCandidates.filter((c) => {
            const q = search.toLowerCase();
            const matchesSearch =
                !q ||
                c.name.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                c.phone.includes(q) ||
                c.enrollment.toLowerCase().includes(q) ||
                c.domain.toLowerCase().includes(q);

            let matchesDomain = true;
            if (domainFilter !== 'all') {
                const d = c.domain.toLowerCase();
                if (domainFilter === 'technical') matchesDomain = d.includes('tech') || d.includes('web') || d.includes('code');
                else if (domainFilter === 'design') matchesDomain = d.includes('design') || d.includes('ui') || d.includes('video');
                else if (domainFilter === 'marketing') matchesDomain = d.includes('market') || d.includes('growth');
                else if (domainFilter === 'management') matchesDomain = d.includes('manage') || d.includes('pr');
                else if (domainFilter === 'content') matchesDomain = d.includes('content') || d.includes('write');
            }

            return matchesSearch && matchesDomain;
        });
    }, [selectedCandidates, search, domainFilter]);

    // Copy emails of current domain
    const copyDomainEmails = () => {
        const emails = filtered.map((c) => c.email).filter(Boolean).join(', ');
        if (!emails) return;
        navigator.clipboard.writeText(emails);
        setCopiedEmails(true);
        setTimeout(() => setCopiedEmails(false), 2000);
    };

    // Export CSV
    const exportCSV = () => {
        const headers = ['Row ID', 'Name', 'Enrollment', 'Email', 'Phone', 'WhatsApp', 'Branch', 'Year', 'Domain', 'Status', 'Notes', 'Selected At'];
        const rows = filtered.map((c) => [
            c.id,
            `"${c.name.replace(/"/g, '""')}"`,
            c.enrollment,
            c.email,
            c.phone,
            c.whatsapp,
            c.branch,
            c.year,
            `"${c.domain.replace(/"/g, '""')}"`,
            c.status,
            `"${(c.notes || '').replace(/"/g, '""')}"`,
            `"${formatIndianDateTime(c.created_at)}"`,
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `ecell_selected_candidates_${domainFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header info */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-100/80 text-emerald-700">
                            <CheckCircle2 size={16} />
                        </span>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                            Selected Candidates Table (Domain-Wise)
                        </h2>
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {selectedCandidates.length} Final Selects
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                        Official roster of candidates whose emails and domain WhatsApp group invites were sent. Structured by domain for team onboarding.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-auto flex-wrap">
                    <button
                        onClick={copyDomainEmails}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                        title="Copy all candidate emails in current filter"
                    >
                        {copiedEmails ? (
                            <>
                                <Check size={13} className="text-emerald-600" />
                                <span className="text-emerald-600 font-bold">Emails Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy size={13} className="text-slate-500" />
                                <span>Copy Emails ({filtered.length})</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition shadow-2xs"
                    >
                        <Download size={13} />
                        <span>Export CSV ({filtered.length})</span>
                    </button>
                </div>
            </div>

            {/* Domain Tabs Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {[
                    { id: 'all', label: 'All Domains', icon: LayoutGrid },
                    { id: 'technical', label: 'Technical', icon: Code2 },
                    { id: 'design', label: 'Design', icon: Palette },
                    { id: 'marketing', label: 'Marketing', icon: Megaphone },
                    { id: 'management', label: 'Management', icon: Briefcase },
                    { id: 'content', label: 'Content', icon: FileText },
                ].map((tab) => {
                    const count = domainCounts[tab.id] || 0;
                    const isActive = domainFilter === tab.id;
                    const TabIcon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setDomainFilter(tab.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-all border ${
                                isActive
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <TabIcon size={14} className={isActive ? 'text-white' : 'text-slate-500'} />
                            <span>{tab.label}</span>
                            <span
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Systematic Table View */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                {/* Search control */}
                <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="relative max-w-xs w-full">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search selected candidate..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                        />
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                        Showing <strong>{filtered.length}</strong> of <strong>{selectedCandidates.length}</strong> selected
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-tight">
                                <th className="py-2.5 px-3 w-10 text-center">#</th>
                                <th className="py-2.5 px-3">Candidate</th>
                                <th className="py-2.5 px-3">Enrollment</th>
                                <th className="py-2.5 px-3">Domain</th>
                                <th className="py-2.5 px-3">Branch & Year</th>
                                <th className="py-2.5 px-3">Contact</th>
                                <th className="py-2.5 px-3 text-center">Status</th>
                                <th className="py-2.5 px-3">Delivery Notes</th>
                                <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                                        No selected candidates match this domain or search query.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((c, i) => {
                                    const cleanPhone = (c.whatsapp || c.phone || '').replace(/\D/g, '');
                                    const waNumber = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone.replace(/^0+/, '')}`;
                                    const waMsg = encodeURIComponent(`Hi ${c.name}, congratulations from E-Cell JEC on being selected for the ${c.domain} team!`);
                                    const waLink = `https://wa.me/${waNumber}?text=${waMsg}`;

                                    return (
                                        <tr
                                            key={c.id || i}
                                            className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                                            onClick={() => onSelectCandidate(c)}
                                        >
                                            <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                                                {c.rowIndex || i + 1}
                                            </td>

                                            <td className="py-2.5 px-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-[11px] border border-emerald-200">
                                                        {c.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-slate-900 block leading-tight hover:text-emerald-700 transition">
                                                            {c.name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            {formatIndianDateTime(c.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-2.5 px-3 font-mono text-[11px]">
                                                <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                                                    {c.enrollment || '—'}
                                                </span>
                                            </td>

                                            <td className="py-2.5 px-3">
                                                <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                                                    {c.domain}
                                                </span>
                                            </td>

                                            <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                                                <span className="font-mono font-medium">{c.branch}</span>
                                                <span className="text-slate-400 mx-1">•</span>
                                                <span>Yr {c.year}</span>
                                            </td>

                                            <td className="py-2.5 px-3 text-[11px] text-slate-600">
                                                <div className="flex flex-col leading-tight">
                                                    <span className="font-mono text-slate-800">{c.phone}</span>
                                                    <span className="text-[10px] text-slate-400 truncate max-w-[140px]">{c.email}</span>
                                                </div>
                                            </td>

                                            <td className="py-2.5 px-3 text-center">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 size={11} className="text-emerald-600" />
                                                    Selected
                                                </span>
                                            </td>

                                            <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-[200px] truncate">
                                                {c.notes || 'Email & WhatsApp Invite Delivered'}
                                            </td>

                                            <td
                                                className="py-2.5 px-3 text-right"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    {onSendEmail ? (
                                                        <button
                                                            onClick={() => onSendEmail([c])}
                                                            disabled={isSending}
                                                            title="Send official email from E-Cell mail"
                                                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition disabled:opacity-50"
                                                        >
                                                            <Send size={13} />
                                                        </button>
                                                    ) : (
                                                        <a
                                                            href={`mailto:${c.email}?subject=E-Cell%20JEC%20Selection%20Update&body=Dear%20${encodeURIComponent(c.name)},%0D%0A%0D%0AGreetings%20from%20E-Cell%20JEC.`}
                                                            title="Send email from E-Cell mail (ecell@jec.ac.in)"
                                                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition"
                                                        >
                                                            <Send size={13} />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => onSelectCandidate(c)}
                                                        title="View Profile"
                                                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition"
                                                    >
                                                        <Eye size={13} />
                                                    </button>
                                                    {onEdit && (
                                                        <button
                                                            onClick={() => onEdit(c)}
                                                            title="Edit candidate"
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                                                        >
                                                            <Pencil size={13} />
                                                        </button>
                                                    )}
                                                    {onDelete && (
                                                        <button
                                                            onClick={() => onDelete(c)}
                                                            title="Delete candidate"
                                                            className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
