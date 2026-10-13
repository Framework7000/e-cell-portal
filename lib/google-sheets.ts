import { google } from 'googleapis';

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

// Accepts the key however a host stores it: wrapped in quotes, with literal "\\n",
// with real newlines, or with Windows line endings.
export function normalizePrivateKey(raw?: string) {
    return (raw || '')
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\\n/g, '\n')
        .replace(/\r/g, '')
        .trim();
}

export function getGoogleSheetsClient() {
    if (sheetsClient) {
        return { sheets: sheetsClient, spreadsheetId: process.env.GOOGLE_SHEET_ID };
    }

    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!clientEmail || !privateKey || !spreadsheetId) {
        throw new Error('Google Sheets credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID) are missing');
    }

    const authClient = new google.auth.GoogleAuth({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    sheetsClient = google.sheets({ version: 'v4', auth: authClient, timeout: 8000 });
    return { sheets: sheetsClient, spreadsheetId };
}

export interface ApplicationRecord {
    id: string;
    rowIndex?: number;
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
    created_at: string;
    status: 'pending' | 'shortlisted' | 'interviewed' | 'selected' | 'rejected';
    notes?: string;
}

// Fetch all applications directly from the Google Sheets document
export async function fetchApplicationsFromSheet(): Promise<ApplicationRecord[]> {
    try {
        const { sheets, spreadsheetId } = getGoogleSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A:N', // Extended to include status & reviewer notes if present
        });

        const rows = response.data.values || [];
        if (rows.length === 0) return [];

        return rows
            .map((row: any[], index: number) => ({ row, index }))
            .filter(({ row, index }) => {
                if (index === 0 && row[1] && row[1].toString().toLowerCase() === 'name') return false;
                return Boolean(row && (row[1] || row[3] || row[4]));
            })
            .map(({ row, index }) => {
                const rawStatus = (row[12] || '').toString().toLowerCase().trim();
                let status: ApplicationRecord['status'] = 'pending';
                if (['shortlisted', 'shortlist'].includes(rawStatus)) status = 'shortlisted';
                else if (['interviewed', 'interview'].includes(rawStatus)) status = 'interviewed';
                else if (['selected', 'accepted', 'approved'].includes(rawStatus)) status = 'selected';
                else if (['rejected', 'declined'].includes(rawStatus)) status = 'rejected';

                return {
                    id: row[0] || `sheet-row-${index + 1}`,
                    rowIndex: index + 1,
                    name: row[1] || 'Anonymous Applicant',
                    enrollment: row[2] || 'N/A',
                    email: row[3] || '',
                    phone: row[4] || '',
                    whatsapp: row[5] || row[4] || '',
                    branch: row[6] || 'General',
                    year: row[7] || '1',
                    domain: row[8] || 'General Member',
                    reason: row[9] || 'No statement provided',
                    source: row[10] || 'Direct / Campus',
                    created_at: row[11] || new Date().toISOString(),
                    status,
                    notes: row[13] || '',
                };
            });
    } catch (err: any) {
        console.error('Error fetching applications from Google Sheet:', err?.message || err);
        throw err;
    }
}

// Update candidate status and reviewer notes in Google Sheet
export async function updateApplicationStatusInSheet(
    rowIndex: number,
    status: string,
    notes?: string
) {
    try {
        const { sheets, spreadsheetId } = getGoogleSheetsClient();
        if (notes === undefined) {
            // Only status changed: leave reviewer notes (column N) untouched
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Sheet1!M${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[status]] },
            });
        } else {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Sheet1!M${rowIndex}:N${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[status, notes]] },
            });
        }
        return { success: true };
    } catch (err: any) {
        console.error(`Error updating application row ${rowIndex} in Google Sheet:`, err?.message || err);
        throw err;
    }
}

export interface EditableFields {
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
}

// Safety guard: make sure the row at rowIndex still belongs to the expected record id
// (rows shift after deletions/inserts, so a stale rowIndex must never touch the wrong person)
async function assertRowMatchesId(rowIndex: number, id: string) {
    const { sheets, spreadsheetId } = getGoogleSheetsClient();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `Sheet1!A${rowIndex}:A${rowIndex}`,
    });
    const current = (res.data.values?.[0]?.[0] || '').toString();
    if (id && !id.startsWith('sheet-row-') && current !== id) {
        throw new Error('Row has changed since last sync. Please press Sync and try again.');
    }
}

// Edit candidate details (columns B:K). Keeps id, submitted date, status & notes untouched.
export async function updateApplicationDetailsInSheet(
    rowIndex: number,
    id: string,
    fields: EditableFields
) {
    await assertRowMatchesId(rowIndex, id);
    const { sheets, spreadsheetId } = getGoogleSheetsClient();
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!B${rowIndex}:K${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[
                fields.name,
                fields.enrollment,
                fields.email,
                fields.phone,
                fields.whatsapp,
                fields.branch,
                fields.year,
                fields.domain,
                fields.reason,
                fields.source,
            ]],
        },
    });
    return { success: true };
}

// Permanently delete one or more candidate rows from Sheet1
// Resolves actual live row numbers using Column A so row shifts never corrupt or miss rows
export async function deleteApplicationsFromSheet(items: Array<{ rowIndex?: number; id: string }>) {
    if (!items || items.length === 0) return { success: true, count: 0 };

    const { sheets, spreadsheetId } = getGoogleSheetsClient();

    // 1. Fetch live Column A to map IDs to their current 0-indexed row position
    const colARes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!A:A',
    });
    const colA = colARes.data.values || []; // index 0 is Row 1

    const idToZeroIndex = new Map<string, number>();
    colA.forEach((r, idx) => {
        const val = (r[0] || '').toString().trim();
        if (val) idToZeroIndex.set(val, idx);
    });

    const zeroIndicesToDelete = new Set<number>();

    for (const it of items) {
        const id = (it.id || '').toString().trim();
        if (id && idToZeroIndex.has(id)) {
            zeroIndicesToDelete.add(idToZeroIndex.get(id)!);
        } else if (it.rowIndex && it.rowIndex >= 1) {
            zeroIndicesToDelete.add(it.rowIndex - 1);
        }
    }

    if (zeroIndicesToDelete.size === 0) {
        return { success: true, count: 0 };
    }

    // CRITICAL: Sort row indices in DESCENDING order (highest first)
    // Deleting higher rows never shifts or changes the indices of lower rows!
    const sortedZeroIndices = Array.from(zeroIndicesToDelete).sort((a, b) => b - a);

    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = meta.data.sheets?.find((s) => s.properties?.title === 'Sheet1');
    const sheetId = sheet?.properties?.sheetId ?? 0;

    const requests = sortedZeroIndices.map((zeroIdx) => ({
        deleteDimension: {
            range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: zeroIdx,
                endIndex: zeroIdx + 1,
            },
        },
    }));

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests },
    });

    return { success: true, count: requests.length };
}

// Single delete delegates to the batch-safe deletion function
export async function deleteApplicationRowFromSheet(rowIndex: number, id: string) {
    return await deleteApplicationsFromSheet([{ rowIndex, id }]);
}

// Bulk update candidate status (and optional notes) in a single batch API call
export async function bulkUpdateApplicationStatusInSheet(
    updates: Array<{ id: string; rowIndex?: number; status: string; notes?: string }>
) {
    if (!updates || updates.length === 0) return { success: true, count: 0 };

    const { sheets, spreadsheetId } = getGoogleSheetsClient();

    // 1. Fetch live Column A to map IDs to their current row number (1-indexed)
    const colARes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!A:A',
    });
    const colA = colARes.data.values || [];

    const idToRowIndex = new Map<string, number>();
    colA.forEach((r, idx) => {
        const val = (r[0] || '').toString().trim();
        if (val) idToRowIndex.set(val, idx + 1); // 1-indexed row number
    });

    const data: Array<{ range: string; values: string[][] }> = [];

    for (const u of updates) {
        const id = (u.id || '').toString().trim();
        const actualRow = idToRowIndex.get(id) || u.rowIndex;
        if (!actualRow || actualRow < 1) continue;

        if (u.notes !== undefined) {
            data.push({
                range: `Sheet1!M${actualRow}:N${actualRow}`,
                values: [[u.status, u.notes]],
            });
        } else {
            data.push({
                range: `Sheet1!M${actualRow}`,
                values: [[u.status]],
            });
        }
    }

    if (data.length > 0) {
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            requestBody: {
                valueInputOption: 'USER_ENTERED',
                data,
            },
        });
    }

    return { success: true, count: data.length };
}
