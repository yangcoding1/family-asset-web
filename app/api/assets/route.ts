import { NextResponse } from 'next/server';
import { getAssets, addAsset, deleteAssets } from '@/lib/google-sheets';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic'; // While fetch is cached, we want the route handler to be dynamic to accept request params/body safely

export async function GET() {
  try {
    const data = await getAssets();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await addAsset(body);
    revalidatePath('/', 'layout'); // Refresh dashboard data
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { rows } = await req.json();
    if (!rows || !Array.isArray(rows)) throw new Error("Invalid rows");

    await deleteAssets(rows);
    revalidatePath('/', 'layout'); // Refresh dashboard data
    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
