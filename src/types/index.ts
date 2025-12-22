// User types
export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

// Transaction types - 按照n8n工作流返回的字段
export interface Transaction {
    id: string;
    transaction_date: string;  // 发生日期
    description: string;       // 概述
    transaction_type?: 1 | 2;  // 收入(1) / 支出(2)
    fin_type?: 1 | 2 | 3 | 4 | 5;  // 支付/收款方式
    debit_item?: string;       // 借方科目
    debit_amount?: number;     // 借方金額
    debit_ct?: number;         // 借方税額
    credit_item?: string;      // 貸方科目
    credit_amount?: number;    // 貸方金額
    credit_ct?: number;        // 貸方税額
    ct_rate?: number;          // 税率 (0=非课税, 1=8%, 2=10%, 3=混合)
    status: TransactionStatus;
    created_at: string;
    updated_at: string;
    // 旧字段保留兼容
    amount_total?: number;
    amount_type?: 1 | 2;
    tax_type?: 1 | 2;
    tax_rate?: 1 | 2 | 3;
    tax_amount?: number;
}

export type TransactionStatus = 'initialized' | 'journaled' | 'updated';

// Status labels in Chinese
export const STATUS_LABELS: Record<TransactionStatus, string> = {
    initialized: 'AI未处理',
    journaled: 'AI已处理',
    updated: '手动修改'
};

// Status colors for badges
export const STATUS_COLORS: Record<TransactionStatus, string> = {
    initialized: 'status-initialized',
    journaled: 'status-journaled',
    updated: 'status-updated'
};

// 税率标签 ct_rate: 0=非课税, 1=8%, 2=10%, 3=混合, 4=其他
export const CT_RATE_LABELS: Record<number, string> = {
    0: '非课税',
    1: '8%',
    2: '10%',
    3: '混合',
    4: '其他'
};

// 税率标签（日语版，用于CSV导出）
export const CT_RATE_LABELS_JP: Record<number, string> = {
    0: '非課税',
    1: '8%',
    2: '10%',
    3: '混合',
    4: 'その他'
};

// Amount type labels (旧字段兼容)
export const AMOUNT_TYPE_LABELS: Record<1 | 2, string> = {
    1: '收入',
    2: '支出'
};

// Transaction type labels for display
export const TRANSACTION_TYPE_LABELS: Record<1 | 2, string> = {
    1: '收入',
    2: '支出'
};

// Japanese labels for CSV export
export const TRANSACTION_TYPE_LABELS_JP: Record<1 | 2, string> = {
    1: '収入',
    2: '支出'
};

export const FIN_TYPE_LABELS_JP: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: '現金',
    2: '銀行振込/デビット',
    3: '電子マネー/QR決済',
    4: '個人クレジットカード',
    5: '法人クレジットカード'
};

// Tax type labels (旧字段兼容)
export const TAX_TYPE_LABELS: Record<1 | 2, string> = {
    1: '非课税',
    2: '课税'
};

// Tax rate labels (旧字段兼容)
export const TAX_RATE_LABELS: Record<1 | 2 | 3 | 4, string> = {
    1: '8%',
    2: '10%',
    3: '8%10%混合',
    4: '其他'
};

// Fin type labels (支付/收款方式)
export const FIN_TYPE_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: '现金',
    2: '银行账户',
    3: '电子支付',
    4: '个人信用卡',
    5: '公司信用卡'
};

// Form input types
export interface TransactionInput {
    transaction_date: string;
    description: string;
    amount_total: number;
    amount_type: 1 | 2;
    fin_type: 1 | 2 | 3 | 4 | 5;
    tax_type: 1 | 2;
    tax_rate?: 1 | 2 | 3 | 4;
    tax_amount?: number;
}

export interface TransactionUpdate extends TransactionInput {
    id: string;
    status: TransactionStatus;  // 当前状态，发送给 webhook 进行处理
    debit_item?: string;
    credit_item?: string;
}

// Query parameters
export interface QueryParams {
    date_from?: string | null;
    date_to?: string | null;
    updated_from?: string | null;
    updated_to?: string | null;
    transaction_type?: 1 | 2;  // 类型: 收入(1)/支出(2)
    status_list?: TransactionStatus[];
    // 分页参数
    limit?: number;
    offset?: number;
    // 排序参数
    sort_by?: 'transaction_date' | 'updated_at' | 'created_at' | 'debit_amount' | 'credit_amount';
    sort_order?: 'asc' | 'desc';
}

// API Response types
export interface APIResponse<T> {
    status: 'successed' | 'failed';
    message: string;
    detail?: T;
}

export interface DeleteResult {
    requested_id: string;
    record_found: boolean;
    deleted_data: Transaction[] | null;
}

export interface AIJournalResult {
    processed_count: number;
    success_list: string[];
    failed_list: string[];
}

// OCR识别结果
export interface OCRResult {
    transaction_date: string;   // 发生日期 YYYY-MM-DD
    amount_total: number;       // 金额
    fin_type: 1 | 2 | 3 | 4 | 5;  // 支付方式
    tax_type: 1 | 2;            // 税务类型
    tax_rate: 1 | 2 | 3 | 4;    // 税率
    tax_amount: number;         // 税额
}

// 账表生成请求参数
export interface SummaryRequest {
    date_from: string;  // YYYY-MM-DD
    date_to: string;    // YYYY-MM-DD
    summary_type: 1 | 2; // 1=総勘定元帳, 2=試算表
}

// 総勘定元帳 类型
export interface LedgerEntry {
    年月日: string;
    相手勘定科目: string;
    摘要: string;
    借方金額: number | null;
    貸方金額: number | null;
    残高: number;
    備考?: string;
}

export interface Ledger {
    勘定科目: string;
    entries: LedgerEntry[];
    summary: {
        借方合計: number;
        貸方合計: number;
        残高: number;
    };
}

export interface LedgerResponse {
    success: boolean;
    total_accounts: number;
    ledgers: Ledger[];
}

// 試算表 类型
export interface TrialBalanceEntry {
    勘定科目: string;
    借方合計: number;
    貸方合計: number;
    借方残高: number;
    貸方残高: number;
}

export interface TrialBalanceResponse {
    success: boolean;
    total_accounts: number;
    entries: TrialBalanceEntry[];
    summary: {
        借方合計: number;
        貸方合計: number;
        借方残高: number;
        貸方残高: number;
    };
}

// Toast notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}
