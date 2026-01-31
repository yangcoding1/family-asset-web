export interface AssetRecord {
    _row_number: number;
    date: string;
    owner: 'Husband' | 'Wife' | 'Joint';
    net_cash: number;
    savings: number;
    stock_krw: number;
    fixed_asset: number;
    long_loan: number;
    total_asset: number;
    net_worth: number;
    memo: string;
}

export type ViewMode = 'All' | 'Husband' | 'Wife' | 'Joint';

export interface CommentRecord {
    _row_number?: number;
    date: string;
    owner: 'Husband' | 'Wife' | string;
    message: string;
}
