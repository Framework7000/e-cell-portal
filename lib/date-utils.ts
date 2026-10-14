/**
 * Formats a timestamp into Indian Standard Time (IST - Asia/Kolkata).
 * Handles:
 * 1. Already-formatted Indian dates: DD/MM/YYYY, hh:mm:ss am/pm
 * 2. ISO strings with Z or offsets (e.g. 2026-10-13T20:03:20.000Z)
 * 3. Numeric epoch numbers (e.g. 1791920000000)
 * 4. Any valid Date parsable string
 * If value is missing or non-date text (e.g. 'Freinds'), strictly returns 'Timestamp Missing'.
 */
export function formatIndianDateTime(raw?: string): string {
    if (!raw) return 'Timestamp Missing';
    const trimmed = raw.trim();
    if (!trimmed) return 'Timestamp Missing';

    // Guard: If it contains letters with no digits or no date delimiters, it's not a timestamp (e.g. "Freinds", "Social media")
    if (!/\d/.test(trimmed)) {
        return 'Timestamp Missing';
    }

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

    // 3. ISO or Date string (only if it has valid year/month structure)
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed) || /^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/.test(trimmed)) {
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
    }

    return 'Timestamp Missing';
}
