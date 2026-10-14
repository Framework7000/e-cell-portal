'use client';

import React, { useEffect, useState } from 'react';
import { X, Save, Loader2, Sparkles } from 'lucide-react';
import { ApplicationRecord } from '@/lib/google-sheets';
import { countWords, countCharacters } from '@/lib/data-sanitization';

export interface EditFormValues {
    name: string;
    enrollment: string;
    email: string;
    phone: string;
    whatsapp: string;
    branch: string;
    year: string;
    domain: string;
    reason: string;
    source: string;
    idea?: string;
}

interface Props {
    candidate: ApplicationRecord | null;
    onClose: () => void;
    onSave: (candidate: ApplicationRecord, values: EditFormValues) => Promise<void>;
}

const BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE', 'AI&DS', 'Other'];
const DOMAINS = ['technical', 'design', 'marketing', 'management', 'content', 'Other'];

const inputCls =
    'w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EA580C] focus:border-[#EA580C] text-slate-800';
const labelCls = 'block text-[11px] font-semibold text-slate-600 mb-1';

export default function EditCandidateModal({ candidate, onClose, onSave }: Props) {
    const [values, setValues] = useState<EditFormValues | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (candidate) {
            setValues({
                name: candidate.name || '',
                enrollment: candidate.enrollment === 'N/A' ? '' : candidate.enrollment || '',
                email: candidate.email || '',
                phone: candidate.phone || '',
                whatsapp: candidate.whatsapp || '',
                branch: candidate.branch || '',
                year: candidate.year || '',
                domain: candidate.domain || '',
                reason: candidate.reason === 'No statement provided' ? '' : candidate.reason || '',
                source: candidate.source || '',
                idea: candidate.idea || '',
            });
            setError(null);
        }
    }, [candidate]);

    if (!candidate || !values) return null;

    const set = (k: keyof EditFormValues) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => setValues((v) => (v ? { ...v, [k]: e.target.value } : v));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!values.name.trim()) {
            setError('Name is required');
            return;
        }
        if (values.phone && values.phone.replace(/\D/g, '').length !== 10) {
            setError('Phone must be 10 digits');
            return;
        }
        if (values.reason && countWords(values.reason) > 100) {
            setError('Reason must be 100 words or less');
            return;
        }
        if (values.idea && countWords(values.idea) > 100) {
            setError('Idea must be 100 words or less');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await onSave(candidate, values);
            onClose();
        } catch (err: any) {
            setError(err?.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    // Keep currently stored value selectable even if it's not in the preset list
    const withCurrent = (list: string[], current: string) =>
        current && !list.some((o) => o.toLowerCase() === current.toLowerCase()) ? [current, ...list] : list;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <form
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                className="bg-white border border-slate-200 sm:rounded-xl rounded-t-2xl max-w-xl w-full shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
            >
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Edit Candidate</h3>
                        <p className="text-[11px] text-slate-500">Changes are written directly to Google Sheets</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                        <label className={labelCls}>Full Name *</label>
                        <input className={inputCls} value={values.name} onChange={set('name')} required />
                    </div>
                    <div>
                        <label className={labelCls}>Enrollment</label>
                        <input className={inputCls} value={values.enrollment} onChange={set('enrollment')} />
                    </div>
                    <div>
                        <label className={labelCls}>Email</label>
                        <input type="email" className={inputCls} value={values.email} onChange={set('email')} />
                    </div>
                    <div>
                        <label className={labelCls}>Phone</label>
                        <input inputMode="numeric" className={inputCls} value={values.phone} onChange={set('phone')} />
                    </div>
                    <div>
                        <label className={labelCls}>WhatsApp</label>
                        <input inputMode="numeric" className={inputCls} value={values.whatsapp} onChange={set('whatsapp')} />
                    </div>
                    <div>
                        <label className={labelCls}>Branch</label>
                        <select className={inputCls} value={values.branch} onChange={set('branch')}>
                            <option value="">Select</option>
                            {withCurrent(BRANCHES, values.branch).map((b) => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Year</label>
                        <select className={inputCls} value={values.year} onChange={set('year')}>
                            <option value="">Select</option>
                            {['1', '2', '3', '4'].map((y) => (
                                <option key={y} value={y}>Year {y}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Domain</label>
                        <select className={inputCls} value={values.domain} onChange={set('domain')}>
                            <option value="">Select</option>
                            {withCurrent(DOMAINS, values.domain).map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>How did you hear about us?</label>
                        <input maxLength={60} className={inputCls} placeholder="e.g. Instagram, WhatsApp, Friends, Campus posters, Other" value={values.source} onChange={set('source')} />
                    </div>
                    <div className="sm:col-span-2">
                        <label className={labelCls}>Why do you want to join E-Cell?</label>
                        <textarea
                            rows={3}
                            className={inputCls}
                            placeholder="Candidate's statement / motivation for joining E-Cell..."
                            value={values.reason}
                            onChange={set('reason')}
                            maxLength={600}
                        />
                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                            <span>Max 100 words / 600 characters</span>
                            <span className="font-mono">
                                {countWords(values.reason || '')} words / {countCharacters(values.reason || '')} chars
                            </span>
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>How did you hear about us?</label>
                        <input className={inputCls} placeholder="e.g. Instagram, WhatsApp, Friends, Campus posters" value={values.source} onChange={set('source')} />
                    </div>
                    <div className="sm:col-span-2">
                        <div className="flex items-center gap-2 mb-1">
                            <label className={labelCls}>Share idea you would like to implement in E-Cell</label>
                            <span className="text-[9px] font-medium bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">
                                Initiative
                            </span>
                        </div>
                        <textarea
                            rows={3}
                            className={inputCls}
                            placeholder="Share your innovative idea..."
                            value={values.idea || ''}
                            onChange={set('idea')}
                            maxLength={600}
                        />
                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                            <span>Max 100 words / 600 characters</span>
                            <span className="font-mono">
                                {countWords(values.idea || '')} words / {countCharacters(values.idea || '')} chars
                            </span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mx-4 mb-2 p-2 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#EA580C] to-[#F59E0B] rounded-lg disabled:opacity-60"
                    >
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
