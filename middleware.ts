import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const authed = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

    if (pathname === '/login') {
        if (authed) return NextResponse.redirect(new URL('/', request.url));
        return NextResponse.next();
    }

    if (pathname.startsWith('/api/auth/')) return NextResponse.next();

    if (!authed) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|ecell-logo.png|logo.png|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)'],
};
