'use client';

import React, { useState } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { ApplicationRecord } from '@/lib/google-sheets';

interface Props {
    candidate: ApplicationRecord | null;
    onClose: () => void;
    onConfirm: (candidate: ApplicationRecord) => Promise<void>;
}

export default function DeleteConfirmModal({ candidate, onClose, onConfirm }: Props) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!candidate) return null;

    const confirm = async () => {
        setBusy(true);
        setError(null);
        try {
            await onConfirm(candidate);
            onClose();
        } catch (err: any) {
            setError(err?.message || 'Failed to delete');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={busy ? undefined : onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white sm:rounded-xl rounded-t-2xl max-w-sm w-full shadow-xl border border-slate-200 p-5 space-y-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            >
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Delete candidate?</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            <strong className="text-slate-800">{candidate.name}</strong> will be permanently removed
                            from the Google Sheet. This cannot be undone.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="p-2 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>
                )}

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={busy}
                        className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirm}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-60"
                    >
                        {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        {busy ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
