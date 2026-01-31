
import { NextResponse } from 'next/server';
import { getComments, addComment } from '@/lib/google-sheets';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const comments = await getComments();
        return NextResponse.json(comments);
    } catch (error: any) {
        console.error('Comments API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { date, owner, message } = body;

        if (!date || !owner || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await addComment({ date, owner, message });
        revalidatePath('/', 'layout'); // Clear cache
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Comments API POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
