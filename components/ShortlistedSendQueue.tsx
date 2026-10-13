'use client';

import React, { useState, useMemo } from 'react';
import { Send, CheckCircle2, Link2, Sparkles, AlertCircle, RefreshCw, Eye, MessageSquare, ExternalLink, Settings, Users, Code2, Palette, Megaphone, Briefcase, FileText, Mail, Phone, LayoutGrid } from 'lucide-react';
import { ApplicationRecord } from '@/lib/google-sheets';
import { DomainWhatsAppLinks, getLinkForDomain } from '@/lib/whatsapp-links';

interface Props {
    submissions: ApplicationRecord[];
    whatsappLinks: DomainWhatsAppLinks;
    onSendEmail: (candidates: ApplicationRecord[]) => Promise<void>;
    onSelectCandidate: (candidate: ApplicationRecord) => void;
    onConfigureLinks: () => void;
    isSending: boolean;
}

export default function ShortlistedSendQueue({
    submissions,
    whatsappLinks,
    onSendEmail,
    onSelectCandidate,
    onConfigureLinks,
    isSending,
}: Props) {
    const [domainFilter, setDomainFilter] = useState('all');
    const [sendingCandidateId, setSendingCandidateId] = useState<string | null>(null);

    // Filter only shortlisted candidates
    const shortlistedCandidates = useMemo(() => {
        return submissions.filter((s) => s.status === 'shortlisted');
    }, [submissions]);

    // Domain breakdown counts
    const domainCounts = useMemo(() => {
        const counts: Record<string, number> = {
            all: shortlistedCandidates.length,
            technical: 0,
            design: 0,
            marketing: 0,
            management: 0,
            content: 0,
        };

        shortlistedCandidates.forEach((c) => {
            const d = c.domain.toLowerCase();
            if (d.includes('tech') || d.includes('web') || d.includes('code')) counts.technical++;
            else if (d.includes('design') || d.includes('ui') || d.includes('video')) counts.design++;
            else if (d.includes('market') || d.includes('growth')) counts.marketing++;
            else if (d.includes('manage') || d.includes('pr')) counts.management++;
            else if (d.includes('content') || d.includes('write')) counts.content++;
        });

        return counts;
    }, [shortlistedCandidates]);

    const filtered = useMemo(() => {
        if (domainFilter === 'all') return shortlistedCandidates;
        return shortlistedCandidates.filter((c) => {
            const d = c.domain.toLowerCase();
            if (domainFilter === 'technical') return d.includes('tech') || d.includes('web') || d.includes('code');
            if (domainFilter === 'design') return d.includes('design') || d.includes('ui') || d.includes('video');
            if (domainFilter === 'marketing') return d.includes('market') || d.includes('growth');
            if (domainFilter === 'management') return d.includes('manage') || d.includes('pr');
            if (domainFilter === 'content') return d.includes('content') || d.includes('write');
            return true;
        });
    }, [shortlistedCandidates, domainFilter]);

    const handleSendSingle = async (candidate: ApplicationRecord) => {
        setSendingCandidateId(candidate.id);
        try {
            await onSendEmail([candidate]);
        } finally {
            setSendingCandidateId(null);
        }
    };

    const handleSendAll = async () => {
        if (filtered.length === 0) return;
        const confirmMsg = domainFilter === 'all'
            ? `Send automated congratulatory emails with domain WhatsApp links to all ${filtered.length} shortlisted candidates? They will be moved to the Selected Candidates table.`
            : `Send automated congratulatory emails to all ${filtered.length} shortlisted candidates in the ${domainFilter.toUpperCase()} domain?`;

        if (!window.confirm(confirmMsg)) return;
        await onSendEmail(filtered);
    };

    return (
        <div className="space-y-6">
            {/* Header Description & Action Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-orange-100/80 text-[#EA580C]">
                            <Send size={16} />
                        </span>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                            Shortlisted Candidate Send Queue
                        </h2>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {shortlistedCandidates.length} Awaiting Invite
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                        Clicking <strong className="text-slate-700">Send</strong> delivers a branded invitation email to the candidate with their respective <strong>Domain WhatsApp Group Link</strong>, and automatically moves them into the <strong>Selected Candidates</strong> table.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 self-stretch md:self-auto">
                    <button
                        onClick={onConfigureLinks}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    >
                        <Settings size={14} className="text-slate-500" />
                        <span>Domain WhatsApp Links</span>
                    </button>
                </div>
            </div>

            {/* Domain Tabs Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {[
                    { id: 'all', label: 'All Shortlisted', icon: Users },
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
                                    ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-xs'
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

            {/* Shortlisted Candidates Grid / List */}
            {filtered.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <Users size={22} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No candidates currently awaiting send in this domain</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Candidates marked as &quot;Shortlisted&quot; from the Candidates table will appear here ready to receive their domain WhatsApp invitation email.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((candidate) => {
                        const domainLink = getLinkForDomain(candidate.domain, whatsappLinks);
                        const isThisSending = isSending && sendingCandidateId === candidate.id;

                        return (
                            <div
                                key={candidate.id}
                                className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between space-y-3 group"
                            >
                                {/* Top candidate info */}
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-full bg-orange-50 border border-orange-200 text-[#EA580C] font-bold text-xs flex items-center justify-center">
                                                {candidate.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                                    {candidate.name}
                                                </h4>
                                                <span className="text-[10px] text-slate-500 font-mono">
                                                    {candidate.enrollment || 'No Enrollment'}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                            Shortlisted
                                        </span>
                                    </div>

                                    {/* Domain & Branch */}
                                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                                            {candidate.domain}
                                        </span>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-slate-600 font-mono">
                                            {candidate.branch} (Yr {candidate.year})
                                        </span>
                                    </div>

                                    {/* Email & Phone */}
                                    <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                                        <div className="truncate text-slate-700 font-medium flex items-center gap-1.5">
                                            <Mail size={12} className="text-slate-400 shrink-0" />
                                            <span className="truncate">{candidate.email}</span>
                                        </div>
                                        <div className="font-mono text-slate-600 flex items-center gap-1.5">
                                            <Phone size={12} className="text-slate-400 shrink-0" />
                                            <span>{candidate.phone}</span>
                                        </div>
                                    </div>

                                    {/* WhatsApp Link preview for this candidate's domain */}
                                    <div className="p-2 bg-emerald-50/70 border border-emerald-200/70 rounded-lg text-[11px] text-emerald-900 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 truncate">
                                            <span className="text-emerald-600 font-bold">WA:</span>
                                            <span className="font-mono text-[10px] text-emerald-800 truncate">
                                                {domainLink}
                                            </span>
                                        </div>
                                        <a
                                            href={domainLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-emerald-700 hover:text-emerald-900 shrink-0 p-0.5"
                                            title="Open WhatsApp group link"
                                        >
                                            <ExternalLink size={12} />
                                        </a>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => onSelectCandidate(candidate)}
                                        className="px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition flex items-center gap-1"
                                    >
                                        <Eye size={13} />
                                        <span>Details</span>
                                    </button>

                                    {/* The Send button with paper plane icon */}
                                    <button
                                        onClick={() => handleSendSingle(candidate)}
                                        disabled={isSending}
                                        className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                                        title="Send invitation email with WhatsApp link"
                                    >
                                        {isThisSending ? (
                                            <>
                                                <RefreshCw size={13} className="animate-spin" />
                                                <span>Sending...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send size={13} />
                                                <span>Send</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Bottom Send All Action Button (As Requested by User) */}
            {filtered.length > 0 && (
                <div className="mt-8 p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-5">
                    <div className="space-y-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <Sparkles size={18} className="text-amber-300" />
                            <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                                Batch Send to All Shortlisted Candidates
                            </h3>
                        </div>
                        <p className="text-xs text-emerald-100 max-w-xl">
                            Automate the delivery of congratulatory emails with each candidate&apos;s respective domain WhatsApp link to all <strong>{filtered.length}</strong> candidates in this queue. When sent, all will move directly to the <strong>Selected Candidates</strong> table.
                        </p>
                    </div>

                    <button
                        onClick={handleSendAll}
                        disabled={isSending}
                        className="px-6 py-3.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 whitespace-nowrap cursor-pointer"
                    >
                        {isSending ? (
                            <>
                                <RefreshCw size={16} className="animate-spin text-emerald-700" />
                                <span>Sending Batch Emails...</span>
                            </>
                        ) : (
                            <>
                                <Send size={16} className="text-emerald-700" />
                                <span>Send to All {filtered.length} Shortlisted Once</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
