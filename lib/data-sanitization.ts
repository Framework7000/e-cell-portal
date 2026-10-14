/**
 * Data sanitization utilities for E-Cell Portal
 * Prevents column misalignment in Google Sheets by ensuring data stays within cell boundaries
 */

/**
 * Sanitizes multi-line text to prevent Google Sheets cell overflow
 * Replaces newlines with spaces and trims excessive whitespace
 */
export function sanitizeMultilineText(text: string, maxLength?: number): string {
    if (!text) return '';
    
    // Replace all types of line breaks with a single space
    let sanitized = text
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\t/g, ' ')
        // Replace multiple spaces with single space
        .replace(/\s+/g, ' ')
        .trim();
    
    if (maxLength && sanitized.length > maxLength) {
        sanitized = sanitized.slice(0, maxLength).trim();
    }
    
    return sanitized;
}

/**
 * Enforces strict word and character limits
 */
export function enforceTextLimit(text: string, maxWords: number, maxChars: number): string {
    if (!text) return '';
    
    let sanitized = sanitizeMultilineText(text);
    
    // Enforce word limit
    const words = sanitized.split(/\s+/).filter(w => w.length > 0);
    if (words.length > maxWords) {
        sanitized = words.slice(0, maxWords).join(' ');
    }
    
    // Enforce character limit
    if (sanitized.length > maxChars) {
        sanitized = sanitized.slice(0, maxChars).trim();
    }
    
    return sanitized;
}

/**
 * Sanitizes the "source" field (how did you hear about us)
 * Enforces 5 words or 40 characters max
 */
export function sanitizeSourceField(source: string): string {
    if (!source) return 'Direct / Campus';
    
    const sanitized = enforceTextLimit(source, 5, 40);
    return sanitized || 'Direct / Campus';
}

/**
 * Sanitizes the "reason" field (why join / idea)
 * Enforces 100 words or 600 characters max
 */
export function sanitizeReasonField(reason: string): string {
    if (!reason) return '';
    
    return enforceTextLimit(reason, 100, 600);
}

/**
 * Validates and formats timestamp in IST format
 * Returns formatted date if valid, otherwise returns fallback
 */
export function validateTimestamp(timestamp: string): { isValid: boolean; formatted: string } {
    if (!timestamp) {
        return { isValid: false, formatted: 'Timestamp Missing' };
    }
    
    // Try to parse as ISO date or common date formats
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        // Try to detect if this looks like user text instead of a timestamp
        // (e.g., "Freinds", "WhatsApp", paragraph text)
        const looksLikeText = /^[a-zA-Z\s]{2,}$/.test(timestamp.trim());
        if (looksLikeText) {
            return { isValid: false, formatted: 'Timestamp Missing' };
        }
        
        // Return the raw value if it doesn't look like text (might be a custom format)
        return { isValid: false, formatted: timestamp };
    }
    
    // Valid date - format it
    try {
        const formatted = date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
        return { isValid: true, formatted };
    } catch (e) {
        return { isValid: false, formatted: 'Timestamp Missing' };
    }
}

/**
 * Truncates text for UI display with ellipsis
 */
export function truncateForDisplay(text: string, maxLength: number): string {
    if (!text) return '';
    
    const sanitized = sanitizeMultilineText(text);
    
    if (sanitized.length <= maxLength) {
        return sanitized;
    }
    
    return sanitized.slice(0, maxLength).trim() + '...';
}

/**
 * Sanitizes all editable fields for safe storage in Google Sheets
 */
export function sanitizeEditableFields(fields: {
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
    idea?: string;
}) {
    return {
        name: sanitizeMultilineText(fields.name, 100),
        enrollment: sanitizeMultilineText(fields.enrollment, 20).toUpperCase(),
        email: sanitizeMultilineText(fields.email, 100).toLowerCase(),
        phone: fields.phone.replace(/\D/g, '').slice(0, 10),
        whatsapp: fields.whatsapp.replace(/\D/g, '').slice(0, 10),
        branch: sanitizeMultilineText(fields.branch, 50),
        year: sanitizeMultilineText(fields.year, 10),
        domain: sanitizeMultilineText(fields.domain, 100),
        reason: sanitizeReasonField(fields.reason),
        source: sanitizeSourceField(fields.source),
        idea: fields.idea ? sanitizeReasonField(fields.idea) : '',
    };
}

/**
 * Word and character counter for form validation
 */
export function countWords(text: string): number {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export function countCharacters(text: string): number {
    if (!text) return 0;
    return text.trim().length;
}
