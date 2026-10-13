'use client';

import React, { useState } from 'react';
import { X, ExternalLink, Save, CheckCircle2, Link2, Sparkles } from 'lucide-react';
import { DomainWhatsAppLinks, getStoredWhatsAppLinks, saveStoredWhatsAppLinks } from '@/lib/whatsapp-links';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSaved: (links: DomainWhatsAppLinks) => void;
}

export default function WhatsAppLinksModal({ isOpen, onClose, onSaved }: Props) {
    const [links, setLinks] = useState<DomainWhatsAppLinks>(() => getStoredWhatsAppLinks());
    const [savedSuccess, setSavedSuccess] = useState(false);

    if (!isOpen) return null;

    const domains: { key: keyof DomainWhatsAppLinks; label: string; icon: string; desc: string }[] = [
        { key: 'technical', label: 'Technical Domain', icon: '💻', desc: 'Developers, Web & App Development, Tech Operations' },
        { key: 'design', label: 'Design & Media', icon: '🎨', desc: 'UI/UX, Graphics, Poster Design, Video Editing' },
        { key: 'marketing', label: 'Marketing & Outreach', icon: '📢', desc: 'Social Media, Brand Growth, Publicity & Campaigns' },
        { key: 'management', label: 'Management & PR', icon: '🤝', desc: 'Event Operations, Public Relations, Corporate Sponsorships' },
        { key: 'content', label: 'Content & Editorial', icon: '📝', desc: 'Content Writing, Copywriting, Scripts, Official Press' },
        { key: 'general', label: 'General / Fallback Community', icon: '🌐', desc: 'Used if applicant domain does not match any specific group' },
    ];

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        saveStoredWhatsAppLinks(links);
        setSavedSuccess(true);
        onSaved(links);
        setTimeout(() => {
            setSavedSuccess(false);
            onClose();
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                            <Link2 size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Configure Domain WhatsApp Links</h2>
                            <p className="text-xs text-slate-500">Each domain receives its unique WhatsApp group invite link in the automated email.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                    <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-900 flex items-start gap-2.5">
                        <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="leading-relaxed">
                            <strong className="font-semibold">How it works:</strong> When you click <span className="font-semibold">Send</span> for a candidate (or bulk send shortlisted candidates), the system injects the WhatsApp group link corresponding to their domain into their congratulations email.
                        </div>
                    </div>

                    <div className="space-y-3.5">
                        {domains.map(({ key, label, icon, desc }) => (
                            <div key={key} className="p-3 bg-slate-50/60 rounded-xl border border-slate-200/70 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label htmlFor={`link-${key}`} className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                                        <span>{icon}</span>
                                        <span>{label}</span>
                                    </label>
                                    {links[key] && (
                                        <a
                                            href={links[key]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[11px] text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 font-medium"
                                            title="Test link in new tab"
                                        >
                                            <span>Test</span>
                                            <ExternalLink size={11} />
                                        </a>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500">{desc}</p>
                                <div className="relative">
                                    <input
                                        id={`link-${key}`}
                                        type="url"
                                        required
                                        value={links[key] || ''}
                                        onChange={(e) => setLinks({ ...links, [key]: e.target.value })}
                                        placeholder={`https://chat.whatsapp.com/...`}
                                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 font-mono"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Links saved locally and applied instantly to emails.</span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition"
                            >
                                {savedSuccess ? (
                                    <>
                                        <CheckCircle2 size={14} className="text-white" />
                                        <span>Saved!</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={14} />
                                        <span>Save WhatsApp Links</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
