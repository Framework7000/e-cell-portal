import { NextRequest, NextResponse } from 'next/server';
import {
    fetchApplicationsFromSheet,
    updateApplicationStatusInSheet,
    updateApplicationDetailsInSheet,
    deleteApplicationRowFromSheet,
    getGoogleSheetsClient,
} from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const domain = searchParams.get('domain');
        const year = searchParams.get('year');
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        let data = await fetchApplicationsFromSheet();

        if (domain && domain !== 'all') {
            data = data.filter(d => d.domain.toLowerCase().includes(domain.toLowerCase()));
        }

        if (year && year !== 'all') {
            data = data.filter(d => d.year.toString() === year);
        }

        if (status && status !== 'all') {
            data = data.filter(d => d.status.toLowerCase() === status.toLowerCase());
        }

        if (search) {
            const query = search.toLowerCase();
            data = data.filter(d =>
                d.name.toLowerCase().includes(query) ||
                d.email.toLowerCase().includes(query) ||
                d.phone.includes(query) ||
                d.enrollment.toLowerCase().includes(query) ||
                d.domain.toLowerCase().includes(query)
            );
        }

        return NextResponse.json({
            success: true,
            count: data.length,
            total: data.length,
            data,
            timestamp: new Date().toISOString(),
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            },
        });
    } catch (err: any) {
        console.error('API /api/submissions GET error:', err);
        return NextResponse.json(
            { success: false, error: err?.message || 'Failed to fetch submissions' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { rowIndex, status, notes } = body;

        if (!rowIndex || typeof rowIndex !== 'number') {
            return NextResponse.json(
                { success: false, error: 'Valid rowIndex is required' },
                { status: 400 }
            );
        }

        await updateApplicationStatusInSheet(rowIndex, status, notes);

        return NextResponse.json({
            success: true,
            message: `Status updated to ${status} for row ${rowIndex}`,
        });
    } catch (err: any) {
        console.error('API /api/submissions PATCH error:', err);
        return NextResponse.json(
            { success: false, error: err?.message || 'Failed to update submission' },
            { status: 500 }
        );
    }
}

// Edit candidate details
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { rowIndex, id, fields } = body;

        if (!rowIndex || typeof rowIndex !== 'number' || !fields) {
            return NextResponse.json(
                { success: false, error: 'rowIndex and fields are required' },
                { status: 400 }
            );
        }
        if (!fields.name?.toString().trim()) {
            return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
        }

        const clean = (v: unknown) => (v ?? '').toString().trim();
        await updateApplicationDetailsInSheet(rowIndex, clean(id), {
            name: clean(fields.name),
            enrollment: clean(fields.enrollment).toUpperCase(),
            email: clean(fields.email).toLowerCase(),
            phone: clean(fields.phone).replace(/\D/g, '').slice(0, 10),
            whatsapp: clean(fields.whatsapp).replace(/\D/g, '').slice(0, 10),
            branch: clean(fields.branch),
            year: clean(fields.year),
            domain: clean(fields.domain),
            reason: clean(fields.reason),
            source: clean(fields.source),
        });

        return NextResponse.json({ success: true, message: `Row ${rowIndex} updated` });
    } catch (err: any) {
        console.error('API /api/submissions PUT error:', err);
        return NextResponse.json(
            { success: false, error: err?.message || 'Failed to edit candidate' },
            { status: 500 }
        );
    }
}

// Delete candidate
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { rowIndex, id } = body;

        if (!rowIndex || typeof rowIndex !== 'number') {
            return NextResponse.json(
                { success: false, error: 'Valid rowIndex is required' },
                { status: 400 }
            );
        }

        await deleteApplicationRowFromSheet(rowIndex, (id ?? '').toString());
        return NextResponse.json({ success: true, message: `Row ${rowIndex} deleted` });
    } catch (err: any) {
        console.error('API /api/submissions DELETE error:', err);
        return NextResponse.json(
            { success: false, error: err?.message || 'Failed to delete candidate' },
            { status: 500 }
        );
    }
}
