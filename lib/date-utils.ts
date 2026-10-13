/**
 * Formats a timestamp into Indian Standard Time (IST - Asia/Kolkata).
 * Handles:
 * 1. ISO strings with Z or offsets (e.g. 2026-10-13T20:03:20.000Z)
 * 2. Epoch numbers (e.g. 1791920000000)
 * 3. Already-formatted Indian dates: DD/MM/YYYY, hh:mm:ss am/pm
 * 4. Any valid Date parsable string
 */
export function formatIndianDateTime(raw?: string): string {
    if (!raw) return 'N/A';
    const trimmed = raw.trim();

    // 1. If it's already in Indian format "DD/MM/YYYY, HH:MM:SS am/pm"
    const indianMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*|\s+)(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
    if (indianMatch) {
        const [, d, m, y, h, min, s, ampm] = indianMatch;
        const day = d.padStart(2, '0');
        const month = m.padStart(2, '0');
        const hour = h.padStart(2, '0');
        const sec = s ? `:${s.padStart(2, '0')}` : '';
        const meridiem = ampm ? ` ${ampm.toLowerCase()}` : '';
        return `${day}/${month}/${y}, ${hour}:${min}${sec}${meridiem}`;
    }

    // 2. Numeric epoch timestamp
    if (/^\d{10,13}$/.test(trimmed)) {
        const num = Number(trimmed);
        const d = new Date(num > 1e11 ? num : num * 1000);
        if (!isNaN(d.getTime())) {
            return d.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            });
        }
    }

    // 3. ISO or Date string
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
        return d.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    }

    return trimmed;
}
