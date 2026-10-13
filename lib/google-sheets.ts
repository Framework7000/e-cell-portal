import { google } from 'googleapis';

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

export function getGoogleSheetsClient() {
    if (sheetsClient) {
        return { sheets: sheetsClient, spreadsheetId: process.env.GOOGLE_SHEET_ID };
    }

    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
    const privateKey = rawKey
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\\n/g, '\n');
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

    sheetsClient = google.sheets({ version: 'v4', auth: authClient });
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
        const values = [[status, notes || '']];
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!M${rowIndex}:N${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });
        return { success: true };
    } catch (err: any) {
        console.error(`Error updating application row ${rowIndex} in Google Sheet:`, err?.message || err);
        throw err;
    }
}
