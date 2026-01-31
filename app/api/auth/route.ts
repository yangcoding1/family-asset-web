import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { pin } = await req.json();
        const CORRECT_PIN = process.env.ACCESS_PIN;

        // If no PIN is set in env, allow access (or default to something? strict is better: fail)
        // But for user experience, if no PIN set, maybe we should have warned.
        // Let's assume user will set ACCESS_PIN. If not set, maybe default to "1234"? 
        // Better: if not set, deny all or allow all? 
        // Middleware allows if no PIN set? 
        // Let's stick to strict: must match env.

        if (pin === CORRECT_PIN) {
            const cookieStore = await cookies();
            cookieStore.set('auth_token', 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/',
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
