// Shared, edge-compatible auth helpers (Web Crypto only).
export const SESSION_COOKIE = 'ecell_portal_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function getPassword() {
    return process.env.ADMIN_PASSWORD || 'farmkaro';
}

function getSecret() {
    return process.env.AUTH_SECRET || 'ecell_jec_portal_secret_key_2026';
}

async function hmac(message: string): Promise<string> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(getSecret()),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
    return Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

// Token binds to the current password, so changing the password invalidates old sessions.
export async function createSessionToken(): Promise<string> {
    return hmac(`ecell-portal-session:${getPassword()}`);
}

export async function verifySessionToken(token?: string | null): Promise<boolean> {
    if (!token) return false;
    const expected = await createSessionToken();
    if (token.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
}
