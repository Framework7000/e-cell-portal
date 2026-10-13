'use client';

import React, { useState, useCallback } from 'react';
import Header from '@/components/Header';
import Sidebar, { Tab } from '@/components/Sidebar';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import SubmissionsTable from '@/components/SubmissionsTable';
import CandidateModal from '@/components/CandidateModal';
import MobileBottomNav from '@/components/MobileBottomNav';
import EditCandidateModal, { EditFormValues } from '@/components/EditCandidateModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { ApplicationRecord } from '@/lib/google-sheets';
import { ShieldAlert, RefreshCw, FileSpreadsheet, Users, Filter, CheckCircle2 } from 'lucide-react';

interface Props {
    initialSubmissions: ApplicationRecord[];
}

export default function PortalClient({ initialSubmissions }: Props) {
    const [submissions, setSubmissions] = useState<ApplicationRecord[]>(initialSubmissions);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string>(
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [selectedCandidate, setSelectedCandidate] = useState<ApplicationRecord | null>(null);
    const [editingCandidate, setEditingCandidate] = useState<ApplicationRecord | null>(null);
    const [deletingCandidate, setDeletingCandidate] = useState<ApplicationRecord | null>(null);

    const pendingCount = submissions.filter(
        (s) => !s.status || s.status.toLowerCase() === 'pending'
    ).length;

    const loadSubmissions = useCallback(async () => {
        setIsRefreshing(true);
        setError(null);

        try {
            const res = await fetch(`/api/submissions?_t=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Pragma': 'no-cache' },
            });
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Failed to fetch applications');
            }

            setSubmissions(json.data || []);
            setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } catch (err: any) {
            console.error('Error refreshing submissions:', err);
            setError(err?.message || 'Error communicating with Google Sheets');
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout error:', e);
        }
        window.location.href = '/login';
    };

    // Update candidate status and reviewer notes
    const handleStatusChange = async (
        rowIndex: number,
        newStatus: ApplicationRecord['status'],
        notes?: string
    ) => {
        try {
            // Optimistic update
            setSubmissions((prev) =>
                prev.map((s) =>
                    s.rowIndex === rowIndex ? { ...s, status: newStatus, notes: notes !== undefined ? notes : s.notes } : s
                )
            );

            if (selectedCandidate && selectedCandidate.rowIndex === rowIndex) {
                setSelectedCandidate((prev) =>
                    prev ? { ...prev, status: newStatus, notes: notes !== undefined ? notes : prev.notes } : null
                );
            }

            const res = await fetch('/api/submissions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rowIndex, status: newStatus, notes }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update Google Sheet');
            }
        } catch (err: any) {
            console.error('Failed to update status:', err);
            alert(`Could not update Google Sheets: ${err?.message || 'Unknown error'}`);
            // Rollback on failure
            loadSubmissions();
        }
    };

    // Edit candidate details (writes to Google Sheets, then re-syncs)
    const handleEditSave = async (candidate: ApplicationRecord, values: EditFormValues) => {
        const res = await fetch('/api/submissions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rowIndex: candidate.rowIndex, id: candidate.id, fields: values }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to edit candidate');
        await loadSubmissions();
    };

    // Delete candidate (removes the sheet row, then re-syncs so row numbers stay correct)
    const handleDeleteConfirm = async (candidate: ApplicationRecord) => {
        const res = await fetch('/api/submissions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rowIndex: candidate.rowIndex, id: candidate.id }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete candidate');
        if (selectedCandidate?.id === candidate.id) setSelectedCandidate(null);
        await loadSubmissions();
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
            {/* Left Panel Sidebar on Desktop (Spacious, Systematic & Highly Professional) */}
            <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                totalCount={submissions.length}
                pendingCount={pendingCount}
                isRefreshing={isRefreshing}
                onRefresh={loadSubmissions}
                lastUpdated={lastUpdated}
                onLogout={handleLogout}
            />

            {/* Main Content Area */}
            <div className="flex-1 md:pl-64 flex flex-col min-w-0 pb-20 md:pb-12">
                {/* Header / Top Control Bar */}
                <Header
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    totalCount={submissions.length}
                    isRefreshing={isRefreshing}
                    onRefresh={loadSubmissions}
                    lastUpdated={lastUpdated}
                    onLogout={handleLogout}
                />

                {/* Main Systematic Container */}
                <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
                    {/* Error notification if sheets fail */}
                    {error && (
                        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800 shadow-2xs">
                            <div className="flex items-center gap-2.5">
                                <ShieldAlert size={17} className="text-red-600 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                            <button
                                onClick={loadSubmissions}
                                className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded-md font-semibold transition"
                            >
                                Retry Sync
                            </button>
                        </div>
                    )}

                    {/* Tab 1: Executive Overview (KPIs + High Density Pie & Bar Visualizations + Table) */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Graphical Analytics & KPI Row */}
                            <AnalyticsCharts submissions={submissions} />

                            {/* Systematic Candidate Table */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users size={15} className="text-[#EA580C]" />
                                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            Recruitment Registry
                                        </h2>
                                        <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                                            {submissions.length} Records
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                                        Bidirectional Google Sheets Synced
                                    </span>
                                </div>
                                <SubmissionsTable
                                    submissions={submissions}
                                    onSelectCandidate={(c) => setSelectedCandidate(c)}
                                    onStatusChange={handleStatusChange}
                                    onRefresh={loadSubmissions}
                                    isRefreshing={isRefreshing}
                                    onEdit={(c) => setEditingCandidate(c)}
                                    onDelete={(c) => setDeletingCandidate(c)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Dedicated Candidate Database */}
                    {activeTab === 'submissions' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                                <div>
                                    <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                        <span>Candidate Database</span>
                                        <span className="text-[10px] font-semibold bg-orange-50 text-[#EA580C] px-2 py-0.5 rounded-full border border-orange-200">
                                            Live Evaluation
                                        </span>
                                    </h1>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Review submissions, update shortlisting status, write private notes, and trigger direct WhatsApp conversations.
                                    </p>
                                </div>
                                <span className="text-xs font-mono bg-white px-3 py-1 rounded-lg border border-slate-200 text-slate-700 font-semibold shadow-2xs">
                                    {submissions.length} Total Applicants
                                </span>
                            </div>

                            <SubmissionsTable
                                submissions={submissions}
                                onSelectCandidate={(c) => setSelectedCandidate(c)}
                                onStatusChange={handleStatusChange}
                                onRefresh={loadSubmissions}
                                isRefreshing={isRefreshing}
                                onEdit={(c) => setEditingCandidate(c)}
                                onDelete={(c) => setDeletingCandidate(c)}
                            />
                        </div>
                    )}

                    {/* Tab 3: Dedicated Graphical Cohort Analytics */}
                    {activeTab === 'analytics' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                                <div>
                                    <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                                        Cohort Demographics & Domain Visualizations
                                    </h1>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Detailed breakdown of applicants across engineering departments, academic batches, and domain interest.
                                    </p>
                                </div>
                            </div>

                            <AnalyticsCharts submissions={submissions} />
                        </div>
                    )}

                    {/* Tab 4: Direct Cloud Sync Management */}
                    {activeTab === 'sync' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-2xl mx-auto space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                                        <FileSpreadsheet size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-900">Google Sheets Integration</h2>
                                        <p className="text-xs text-slate-500">Live bidirectional synchronization with official E-Cell recruitment spreadsheet</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Connection Status:</span>
                                        <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            Active & Responsive
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Total Records In Sync:</span>
                                        <span className="font-mono font-bold text-slate-900">{submissions.length}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Last Updated:</span>
                                        <span className="font-mono text-slate-500">{lastUpdated}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Auto-Failover Mode:</span>
                                        <span className="text-slate-700 font-medium">Ready (Dual Engine)</span>
                                    </div>
                                </div>

                                <button
                                    onClick={loadSubmissions}
                                    disabled={isRefreshing}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#EA580C] to-[#F59E0B] hover:opacity-95 disabled:opacity-50 transition shadow-sm"
                                >
                                    <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
                                    <span>{isRefreshing ? 'Synchronizing now...' : 'Trigger Immediate Sync'}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Candidate Review Modal */}
            <CandidateModal
                candidate={selectedCandidate}
                onClose={() => setSelectedCandidate(null)}
                onStatusChange={handleStatusChange}
            />

            <EditCandidateModal
                candidate={editingCandidate}
                onClose={() => setEditingCandidate(null)}
                onSave={handleEditSave}
            />
            <DeleteConfirmModal
                candidate={deletingCandidate}
                onClose={() => setDeletingCandidate(null)}
                onConfirm={handleDeleteConfirm}
            />

            {/* Mobile Bottom Navigation Bar (<RULE[user_global]>) */}
            <MobileBottomNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
                totalCount={submissions.length}
                isRefreshing={isRefreshing}
                onRefresh={loadSubmissions}
            />
        </div>
    );
}
