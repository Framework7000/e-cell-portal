'use client';

import React, { useState, useMemo } from 'react';
import {
    Search,
    Download,
    Eye,
    RefreshCw,
    Send,
    Pencil,
    Trash2,
    CheckCircle2,
    XCircle,
    Clock,
    Sparkles,
    CheckSquare,
    Square,
    Mail,
    X,
    MessageSquare,
} from 'lucide-react';
import { ApplicationRecord } from '@/lib/google-sheets';
import { formatIndianDateTime } from '@/lib/date-utils';

interface Props {
    submissions: ApplicationRecord[];
    onSelectCandidate: (candidate: ApplicationRecord) => void;
    onStatusChange: (rowIndex: number, newStatus: ApplicationRecord['status']) => Promise<void>;
    onRefresh: () => Promise<void>;
    isRefreshing: boolean;
    onEdit?: (candidate: ApplicationRecord) => void;
    onDelete?: (candidate: ApplicationRecord) => void;
    onBulkStatusChange?: (candidates: ApplicationRecord[], newStatus: ApplicationRecord['status']) => Promise<void>;
    onBulkDelete?: (candidates: ApplicationRecord[]) => Promise<void>;
    onBulkSendEmail?: (candidates: ApplicationRecord[]) => Promise<void>;
    onSendSingleEmail?: (candidate: ApplicationRecord) => Promise<void>;
}

export default function SubmissionsTable({
    submissions,
    onSelectCandidate,
    onStatusChange,
    onRefresh,
    isRefreshing,
    onEdit,
    onDelete,
    onBulkStatusChange,
    onBulkDelete,
    onBulkSendEmail,
    onSendSingleEmail,
}: Props) {
    const [search, setSearch] = useState('');
    const [domainFilter, setDomainFilter] = useState('all');
    const [yearFilter, setYearFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState<'date' | 'name' | 'domain'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    // Filter and sort submissions
    const filtered = useMemo(() => {
        return submissions
            .filter((s) => {
                const q = search.toLowerCase();
                const matchesSearch =
                    !q ||
                    s.name.toLowerCase().includes(q) ||
                    s.email.toLowerCase().includes(q) ||
                    s.phone.includes(q) ||
                    s.enrollment.toLowerCase().includes(q) ||
                    s.domain.toLowerCase().includes(q);

                const matchesDomain =
                    domainFilter === 'all' ||
                    s.domain.toLowerCase().includes(domainFilter.toLowerCase());

                const matchesYear =
                    yearFilter === 'all' || s.year.toString() === yearFilter;

                const matchesStatus =
                    statusFilter === 'all' || s.status === statusFilter;

                return matchesSearch && matchesDomain && matchesYear && matchesStatus;
            })
            .sort((a, b) => {
                if (sortBy === 'name') {
                    return sortOrder === 'asc'
                        ? a.name.localeCompare(b.name)
                        : b.name.localeCompare(a.name);
                }
                if (sortBy === 'domain') {
                    return sortOrder === 'asc'
                        ? a.domain.localeCompare(b.domain)
                        : b.domain.localeCompare(a.domain);
                }
                // default date
                return sortOrder === 'asc'
                    ? (a.rowIndex || 0) - (b.rowIndex || 0)
                    : (b.rowIndex || 0) - (a.rowIndex || 0);
            });
    }, [submissions, search, domainFilter, yearFilter, statusFilter, sortBy, sortOrder]);

    // Selected candidate objects
    const selectedCandidates = useMemo(() => {
        return submissions.filter((s) => selectedIds.has(s.id));
    }, [submissions, selectedIds]);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filtered.length && filtered.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map((c) => c.id)));
        }
    };

    const clearSelection = () => setSelectedIds(new Set());

    // Bulk actions
    const handleBulkStatus = async (status: ApplicationRecord['status']) => {
        if (selectedCandidates.length === 0 || !onBulkStatusChange) return;
        setIsBulkProcessing(true);
        try {
            await onBulkStatusChange(selectedCandidates, status);
            clearSelection();
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handleBulkDeleteAction = async () => {
        if (selectedCandidates.length === 0 || !onBulkDelete) return;
        if (!window.confirm(`Permanently delete ${selectedCandidates.length} selected candidates from Google Sheets?`)) return;
        setIsBulkProcessing(true);
        try {
            await onBulkDelete(selectedCandidates);
            clearSelection();
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handleBulkSendEmailAction = async () => {
        if (selectedCandidates.length === 0 || !onBulkSendEmail) return;
        if (!window.confirm(`Send automated congratulatory emails with domain WhatsApp links to ${selectedCandidates.length} selected candidates? They will be moved to the Selected Candidates table.`)) return;
        setIsBulkProcessing(true);
        try {
            await onBulkSendEmail(selectedCandidates);
            clearSelection();
        } finally {
            setIsBulkProcessing(false);
        }
    };

    // CSV Export
    const exportCSV = () => {
        const headers = ['Row ID', 'Name', 'Enrollment', 'Email', 'Phone', 'WhatsApp', 'Branch', 'Year', 'Domain', 'Status', 'Applied At', 'Reason'];
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
            `"${formatIndianDateTime(c.created_at)}"`,
            `"${(c.reason || '').replace(/"/g, '""')}"`,
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `ecell_recruitment_submissions_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const statusBadge = (status: ApplicationRecord['status']) => {
        switch (status) {
            case 'shortlisted':
                return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> Shortlisted
                    </span>
                );
            case 'selected':
                return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Selected
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Rejected
                    </span>
                );
            case 'pending':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Pending
                    </span>
                );
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden relative">
            {/* Sticky Floating Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-slate-900 text-white p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150 sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-orange-600 text-white text-[11px] font-bold rounded-full font-mono">
                            {selectedIds.size} Selected
                        </span>
                        <span className="text-xs text-slate-300 hidden sm:inline">Bulk Actions:</span>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 text-xs">
                        {onBulkStatusChange && (
                            <>
                                <button
                                    onClick={() => handleBulkStatus('shortlisted')}
                                    disabled={isBulkProcessing}
                                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 font-semibold text-white transition disabled:opacity-50 text-[11px]"
                                    title="Move all selected to Shortlisted"
                                >
                                    Approve (Shortlist)
                                </button>
                                <button
                                    onClick={() => handleBulkStatus('selected')}
                                    disabled={isBulkProcessing}
                                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 font-semibold text-white transition disabled:opacity-50 text-[11px]"
                                    title="Mark all selected as Selected"
                                >
                                    Mark Selected
                                </button>
                                <button
                                    onClick={() => handleBulkStatus('rejected')}
                                    disabled={isBulkProcessing}
                                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition disabled:opacity-50 text-[11px]"
                                    title="Mark all selected as Rejected"
                                >
                                    Reject
                                </button>
                            </>
                        )}

                        {onBulkSendEmail && (
                            <button
                                onClick={handleBulkSendEmailAction}
                                disabled={isBulkProcessing}
                                className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-600 font-bold text-white transition disabled:opacity-50 flex items-center gap-1.5 text-[11px]"
                                title="Send invitation emails with domain WhatsApp links to selected"
                            >
                                <Send size={12} />
                                <span>Send Email ({selectedIds.size})</span>
                            </button>
                        )}

                        {onBulkDelete && (
                            <button
                                onClick={handleBulkDeleteAction}
                                disabled={isBulkProcessing}
                                className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 font-semibold text-white transition disabled:opacity-50 flex items-center gap-1 text-[11px]"
                                title="Permanently delete selected candidates"
                            >
                                <Trash2 size={12} />
                                <span>Delete</span>
                            </button>
                        )}

                        <button
                            onClick={clearSelection}
                            className="p-1 text-slate-400 hover:text-white rounded ml-1 transition"
                            title="Clear selection"
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>
            )}

            {/* Control Bar: Search & Filters */}
            <div className="p-3 border-b border-slate-100 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between bg-slate-50/50">
                {/* Search input */}
                <div className="relative flex-1 max-w-sm">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, enrollment, domain, phone..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                            aria-label="Clear search"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* Filters & Export */}
                <div className="flex items-center flex-wrap gap-2 text-xs">
                    {/* Domain filter */}
                    <select
                        value={domainFilter}
                        onChange={(e) => setDomainFilter(e.target.value)}
                        className="py-1 px-2 text-[11px] bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="all">All Domains</option>
                        <option value="technical">Technical</option>
                        <option value="design">Design</option>
                        <option value="marketing">Marketing</option>
                        <option value="management">Management</option>
                        <option value="content">Content & PR</option>
                    </select>

                    {/* Year filter */}
                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="py-1 px-2 text-[11px] bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="all">All Years</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                    </select>

                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="py-1 px-2 text-[11px] bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="selected">Selected</option>
                        <option value="rejected">Rejected</option>
                    </select>

                    {/* Refresh Google Sheets */}
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-1 py-1 px-2 text-[11px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md transition-colors disabled:opacity-50"
                        title="Sync with Google Sheets"
                    >
                        <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'} />
                        <span className="hidden sm:inline">Sync</span>
                    </button>

                    {/* Export CSV */}
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-1 py-1 px-2.5 text-[11px] bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-colors"
                        title="Download CSV report"
                    >
                        <Download size={12} />
                        <span>Export ({filtered.length})</span>
                    </button>
                </div>
            </div>

            {/* Systematic Table View */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-tight">
                            <th className="py-2.5 px-3 w-8 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                                    onChange={toggleSelectAll}
                                    className="w-3.5 h-3.5 rounded accent-[#EA580C] cursor-pointer"
                                    title="Select all"
                                />
                            </th>
                            <th className="py-2.5 px-3 w-10 text-center">#</th>
                            <th className="py-2.5 px-3">Candidate</th>
                            <th className="py-2.5 px-3">Enrollment</th>
                            <th className="py-2.5 px-3">Domain</th>
                            <th className="py-2.5 px-3">Branch & Year</th>
                            <th className="py-2.5 px-3">Contact</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-10 text-center text-slate-400 text-xs">
                                    No candidates match the filter criteria.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((c, i) => {
                                const isSelected = selectedIds.has(c.id);
                                const cleanPhone = (c.whatsapp || c.phone || '').replace(/\D/g, '');
                                const waNumber = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone.replace(/^0+/, '')}`;
                                const waMsg = encodeURIComponent(`Hi ${c.name}, greetings from E-Cell JEC regarding your recruitment submission for ${c.domain}.`);
                                const waLink = `https://wa.me/${waNumber}?text=${waMsg}`;

                                return (
                                    <tr
                                        key={c.id || i}
                                        className={`hover:bg-slate-50/60 transition-colors group cursor-pointer ${
                                            isSelected ? 'bg-orange-50/40' : ''
                                        }`}
                                        onClick={() => onSelectCandidate(c)}
                                    >
                                        {/* Row selection checkbox */}
                                        <td
                                            className="py-2.5 px-3 text-center"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSelect(c.id);
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {}}
                                                className="w-3.5 h-3.5 rounded accent-[#EA580C] cursor-pointer"
                                            />
                                        </td>

                                        {/* Row number */}
                                        <td className="py-2.5 px-3 text-center mono-num text-slate-400 text-[11px]">
                                            {c.rowIndex || i + 1}
                                        </td>

                                        {/* Name & source */}
                                        <td className="py-2.5 px-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold text-[10px]">
                                                    {c.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-slate-900 block leading-tight hover:text-blue-600 transition-colors">
                                                        {c.name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 mono-num">
                                                        {formatIndianDateTime(c.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Enrollment */}
                                        <td className="py-2.5 px-3 mono-num text-slate-600 text-[11px]">
                                            <span className="bg-slate-50 border border-slate-200/70 px-1.5 py-0.5 rounded text-[10px]">
                                                {c.enrollment || '—'}
                                            </span>
                                        </td>

                                        {/* Domain */}
                                        <td className="py-2.5 px-3">
                                            <span className="font-medium text-slate-700 text-[11px]">
                                                {c.domain}
                                            </span>
                                        </td>

                                        {/* Branch & Year */}
                                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                                            <span className="font-mono font-medium text-slate-700">{c.branch}</span>
                                            <span className="text-slate-400 mx-1">•</span>
                                            <span>Yr {c.year}</span>
                                        </td>

                                        {/* Contact: Phone & Email */}
                                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                                            <div className="flex flex-col leading-tight">
                                                <span className="mono-num text-slate-800">{c.phone}</span>
                                                <span className="text-[10px] text-slate-400 truncate max-w-[150px]">{c.email}</span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td
                                            className="py-2.5 px-3 text-center"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <select
                                                value={c.status}
                                                onChange={(e) => {
                                                    if (c.rowIndex) {
                                                        onStatusChange(c.rowIndex, e.target.value as ApplicationRecord['status']);
                                                    }
                                                }}
                                                className="text-[10px] font-medium py-0.5 px-1.5 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="shortlisted">Shortlisted</option>
                                                <option value="selected">Selected</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                        </td>

                                        {/* Actions */}
                                        <td
                                            className="py-2.5 px-3 text-right"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center justify-end gap-1.5">
                                                {/* If candidate is shortlisted, allow direct Send Email button */}
                                                {c.status === 'shortlisted' && onSendSingleEmail && (
                                                    <button
                                                        onClick={() => onSendSingleEmail(c)}
                                                        title="Send invitation email with domain WhatsApp link"
                                                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                                    >
                                                        <Send size={13} />
                                                    </button>
                                                )}
                                                <a
                                                    href={`mailto:${c.email}?subject=E-Cell%20JEC%20Recruitment`}
                                                    title="Send email from E-Cell mail (ecell@jec.ac.in)"
                                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                >
                                                    <Mail size={13} />
                                                </a>
                                                <a
                                                    href={waLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Direct WhatsApp chat"
                                                    className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                                >
                                                    <MessageSquare size={13} />
                                                </a>
                                                <button
                                                    onClick={() => onSelectCandidate(c)}
                                                    title="View Full Profile"
                                                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                                                >
                                                    <Eye size={13} />
                                                </button>
                                                {onEdit && (
                                                    <button
                                                        onClick={() => onEdit(c)}
                                                        title="Edit candidate"
                                                        aria-label="Edit candidate"
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    >
                                                        <Pencil size={13} />
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        onClick={() => onDelete(c)}
                                                        title="Delete candidate"
                                                        aria-label="Delete candidate"
                                                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
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

            {/* Systematic Table Footer */}
            <div className="p-2.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                    <span>Showing <strong className="text-slate-800 mono-num">{filtered.length}</strong> of <strong className="text-slate-800 mono-num">{submissions.length}</strong> candidates</span>
                    {search && (
                        <span className="text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded text-[10px]">
                            Filtered by &quot;{search}&quot;
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 mono-num text-[10px]">
                    <span>Source: Sheet1!A:N</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                </div>
            </div>
        </div>
    );
}
