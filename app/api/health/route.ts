import { NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

// GET /api/health -> verifies the Google Sheets connection (no data is returned or written)
export async function GET() {
    try {
        const { sheets, spreadsheetId } = getGoogleSheetsClient();
        const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'properties.title,sheets.properties.title' });
        const tabs = meta.data.sheets?.map((s) => s.properties?.title) || [];
        return NextResponse.json({
            ok: true,
            sheet: meta.data.properties?.title,
            hasSheet1: tabs.includes('Sheet1'),
        });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message || 'Google Sheets unreachable' }, { status: 503 });
    }
}
