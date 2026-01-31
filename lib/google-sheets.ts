
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { unstable_cache } from 'next/cache';
import { CommentRecord, AssetRecord } from '@/types';

// Centralized Auth
const getAuth = () => {
    return new JWT({
        email: process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
};

const getDoc = async () => {
    const auth = getAuth();
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, auth);
    await doc.loadInfo();
    return doc;
};

// --- Parsers ---

function parseMoney(value: any): number {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    const clean = String(value).replace(/[₩,\s]/g, '');
    const floatVal = parseFloat(clean);
    return isNaN(floatVal) ? 0 : floatVal;
}

// --- Cached Fetchers ---

export const getAssets = unstable_cache(
    async (): Promise<AssetRecord[]> => {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle['DB'];
        if (!sheet) throw new Error("Sheet 'DB' not found");

        const rows = await sheet.getRows();
        const data = rows.map((row) => ({
            _row_number: row.rowNumber,
            date: row.get('date'),
            owner: row.get('owner'),
            net_cash: parseMoney(row.get('net_cash')),
            savings: parseMoney(row.get('savings')),
            stock_krw: parseMoney(row.get('stock_krw')),
            fixed_asset: parseMoney(row.get('fixed_asset')),
            long_loan: parseMoney(row.get('long_loan')),
            total_asset: parseMoney(row.get('total_asset')),
            net_worth: parseMoney(row.get('net_worth')),
            memo: row.get('memo') || '',
        })).filter(item => item.date);

        data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return data;
    },
    ['assets-data'], // Cache Key
    {
        tags: ['assets'], // Revalidation Tag
        revalidate: 3600 // Revalidate every hour by default, or on demand
    }
);

export const getComments = unstable_cache(
    async (): Promise<CommentRecord[]> => {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle['Comments'];
        if (!sheet) return [];

        const rows = await sheet.getRows();
        const comments = rows.map((row) => ({
            date: row.get('Date'),
            owner: row.get('Owner'), // Casting handled by consumer or validated here
            message: row.get('Comments'),
        })).filter((c: any) => c.date && c.message) as CommentRecord[];

        comments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return comments;
    },
    ['comments-data'],
    {
        tags: ['comments'],
        revalidate: 3600
    }
);

// --- Mutations (Direct Access) ---

export async function addAsset(data: any) {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['DB'];
    await sheet.addRow(data);
}

export async function deleteAssets(rowNumbers: number[]) {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['DB'];
    const allRows = await sheet.getRows();
    const sortedRows = rowNumbers.sort((a, b) => b - a);

    for (const rowNum of sortedRows) {
        const rowToDelete = allRows.find(r => r.rowNumber === rowNum);
        if (rowToDelete) await rowToDelete.delete();
    }
}

export async function addComment(data: { date: string, owner: string, message: string }) {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Comments'];
    if (!sheet) throw new Error("Comments sheet missing");

    await sheet.addRow({
        Date: data.date,
        Owner: data.owner,
        Comments: data.message
    });
}
