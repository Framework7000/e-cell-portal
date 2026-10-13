import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken, getPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();
        if (typeof password !== 'string' || password.trim() !== getPassword()) {
            // small delay to slow brute-force
            await new Promise((r) => setTimeout(r, 400));
            return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 });
        }

        const res = NextResponse.json({ success: true });
        res.cookies.set(SESSION_COOKIE, await createSessionToken(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: SESSION_MAX_AGE,
        });
        return res;
    } catch {
        return NextResponse.json({ success: false, error: 'Bad request' }, { status: 400 });
    }
}
