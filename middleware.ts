import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // If ACCESS_PIN is not set in env, do not protect (Allow access)
    // IMPORTANT: Next.js Middleware env vars must be public or accessible. 
    // process.env.ACCESS_PIN might not be available in Edge Runtime if not configured? 
    // Actually Vercel env vars are available.

    // We can't easily check process.env in middleware for conditional logic if we want to be safe.
    // However, if we want to enforce protection, we assume it's enabled.

    const authToken = request.cookies.get('auth_token');
    const isLoginPage = request.nextUrl.pathname === '/login';
    const isApiAuth = request.nextUrl.pathname === '/api/auth';

    // Public paths that don't need auth
    if (isLoginPage || isApiAuth || request.nextUrl.pathname.startsWith('/_next') || request.nextUrl.pathname === '/favicon.ico') {
        return NextResponse.next();
    }

    // If no token, redirect to login
    if (!authToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
