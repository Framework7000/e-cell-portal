'use client';

import React, { useState } from 'react';
import { X, Phone, Mail, MessageSquare, ExternalLink, Calendar, CheckCircle2, Clock, AlertCircle, FileText, Send } from 'lucide-react';
import { ApplicationRecord } from '@/lib/google-sheets';

interface Props {
    candidate: ApplicationRecord | null;
    onClose: () => void;
    onStatusChange: (rowIndex: number, newStatus: ApplicationRecord['status'], notes?: string) => Promise<void>;
}

export default function CandidateModal({ candidate, onClose, onStatusChange }: Props) {
    if (!candidate) return null;

    const [status, setStatus] = useState<ApplicationRecord['status']>(candidate.status || 'pending');
    const [notes, setNotes] = useState(candidate.notes || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const cleanPhone = (candidate.whatsapp || candidate.phone || '').replace(/\D/g, '');
    const waNumber = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone.replace(/^0+/, '')}`;
    const defaultWaMessage = encodeURIComponent(
        `Hello ${candidate.name}! 👋\n\nGreetings from Entrepreneurship Cell (E-Cell), JEC Jabalpur.\nRegarding your recruitment application for the *${candidate.domain}* domain:\n\nWe would like to invite you for the next round of discussion. Are you available for a brief interactive interview?`
    );
    const waLink = `https://wa.me/${waNumber}?text=${defaultWaMessage}`;

    const handleSave = async () => {
        if (!candidate.rowIndex) return;
        setIsSaving(true);
        try {
            await onStatusChange(candidate.rowIndex, status, notes);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (e) {
            console.error('Failed to save candidate updates:', e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold mono-num">
                            {candidate.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900">{candidate.name}</h3>
                                <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                                    {candidate.enrollment || 'No Enrollment'}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                {candidate.branch} • Year {candidate.year} • Applied via {candidate.source}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-4 overflow-y-auto space-y-4 text-xs">
                    {/* Fast Action Row */}
                    <div className="grid grid-cols-3 gap-2">
                        <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-lg text-emerald-800 font-medium transition-colors"
                        >
                            <Send size={13} className="text-emerald-600" />
                            <span>WhatsApp</span>
                        </a>

                        <a
                            href={`tel:${candidate.phone}`}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-lg text-blue-800 font-medium transition-colors"
                        >
                            <Phone size={13} className="text-blue-600" />
                            <span>Call</span>
                        </a>

                        <a
                            href={`mailto:${candidate.email}`}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-medium transition-colors"
                        >
                            <Mail size={13} className="text-slate-600" />
                            <span>Email</span>
                        </a>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/80 border border-slate-200/80 rounded-lg text-[11px]">
                        <div>
                            <span className="text-slate-400 uppercase tracking-tight block text-[10px] mb-0.5">Domain</span>
                            <span className="font-semibold text-slate-800">{candidate.domain}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 uppercase tracking-tight block text-[10px] mb-0.5">Submission Time</span>
                            <span className="font-mono text-slate-700">{candidate.created_at}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 uppercase tracking-tight block text-[10px] mb-0.5">Email</span>
                            <span className="text-slate-700 font-mono select-all truncate block">{candidate.email}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 uppercase tracking-tight block text-[10px] mb-0.5">Phone / WhatsApp</span>
                            <span className="text-slate-700 font-mono">{candidate.phone}</span>
                        </div>
                    </div>

                    {/* Statement / Reason */}
                    <div>
                        <div className="flex items-center gap-1.5 mb-1 text-slate-600 font-medium text-[11px]">
                            <FileText size={13} className="text-slate-400" />
                            <span>Statement / Motivation</span>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 leading-relaxed whitespace-pre-wrap text-[11px]">
                            {candidate.reason || 'No statement provided.'}
                        </div>
                    </div>

                    {/* Status & Reviewer Section */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="block text-[11px] font-semibold text-slate-700">Application Decision</label>
                        <div className="grid grid-cols-4 gap-1.5">
                            {(['pending', 'shortlisted', 'selected', 'rejected'] as const).map((st) => {
                                const active = status === st;
                                const colorMap: Record<string, string> = {
                                    pending: 'bg-amber-50 text-amber-800 border-amber-300 ring-amber-200',
                                    shortlisted: 'bg-blue-50 text-blue-800 border-blue-300 ring-blue-200',
                                    selected: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-emerald-200',
                                    rejected: 'bg-red-50 text-red-800 border-red-300 ring-red-200',
                                };
                                return (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => setStatus(st)}
                                        className={`py-1.5 text-[11px] font-medium capitalize rounded-md border text-center transition-all ${
                                            active
                                                ? `${colorMap[st]} ring-2 font-semibold shadow-xs`
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        {st}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Reviewer Notes */}
                    <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-600">Internal Review Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add evaluation remarks, interview slot, or reviewer comments..."
                            rows={2}
                            className="w-full p-2.5 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 mono-num">
                        Row #{candidate.rowIndex} in Google Sheets
                    </span>
                    <div className="flex items-center gap-2">
                        {saveSuccess && (
                            <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                                <CheckCircle2 size={13} /> Saved!
                            </span>
                        )}
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-xs transition-colors disabled:opacity-50"
                        >
                            {isSaving ? 'Syncing...' : 'Save Decision'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
