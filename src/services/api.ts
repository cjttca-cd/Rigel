import { config } from '../config';
import type {
    APIResponse,
    DeleteResult,
    LedgerResponse,
    OCRResult,
    QueryParams,
    SummaryRequest,
    Transaction,
    TransactionInput,
    TransactionUpdate,
    TrialBalanceResponse
} from '../types';
import { getIdToken } from './firebase';

const N8N_BASE_URL = config.N8N_BASE_URL;

// Webhook paths
const WEBHOOKS = {
    DATA_ENTRY: '/webhook/72fc1a9b-1807-45c5-a94b-8929bf40a224',
    DATA_DELETE: '/webhook/957b0297-d509-4d97-9094-262d9bc27b29',
    DATA_UPDATE: '/webhook/42950520-dff5-4bc6-8505-15a3078fb3ff',
    AI_JOURNAL: '/webhook/42fd082c-bafd-47ac-b450-2f39b689e0d0',
    DATA_QUERY: '/webhook/53aa1136-cd3b-4a55-9d0c-c00de74a888c',
    AI_OCR: '/webhook/4a8142b4-db3c-4ade-83e7-b03309ef0c59',
    DATA_SUMMARY: '/webhook/7a29fc9c-bf4b-4140-8cec-de44bbd0c49e'
};

// Generic API call helper
async function apiCall<T>(
    endpoint: string,
    body: Record<string, unknown>
): Promise<APIResponse<T>> {
    const token = await getIdToken();

    if (!token) {
        return {
            status: 'failed',
            message: '未登录或登录已过期，请重新登录'
        };
    }

    try {
        const response = await fetch(`${N8N_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Handle empty response
        const text = await response.text();
        if (!text) {
            return {
                status: 'failed',
                message: '服务器返回空响应'
            };
        }

        try {
            const data = JSON.parse(text);
            return data as APIResponse<T>;
        } catch {
            console.error('Failed to parse JSON response:', text.substring(0, 100));
            return {
                status: 'failed',
                message: '服务器响应格式错误'
            };
        }
    } catch (error) {
        // Don't log network errors to console to reduce noise
        return {
            status: 'failed',
            message: error instanceof Error ? error.message : '网络请求失败'
        };
    }
}

// Create a new transaction
export async function createTransaction(
    data: TransactionInput
): Promise<APIResponse<Transaction>> {
    return apiCall<Transaction>(WEBHOOKS.DATA_ENTRY, data as unknown as Record<string, unknown>);
}

// Delete transactions by IDs
export async function deleteTransactions(
    ids: string[]
): Promise<APIResponse<DeleteResult[]>> {
    return apiCall<DeleteResult[]>(WEBHOOKS.DATA_DELETE, {
        target_list: ids
    });
}

// Update a transaction
export async function updateTransaction(
    data: TransactionUpdate
): Promise<APIResponse<Transaction>> {
    return apiCall<Transaction>(WEBHOOKS.DATA_UPDATE, data as unknown as Record<string, unknown>);
}

// Process AI Journal for selected transactions
export async function processAIJournal(
    ids: string[]
): Promise<APIResponse<Transaction[]>> {
    if (ids.length > 100) {
        return {
            status: 'failed',
            message: 'AI仕訳一次最多处理100条记录'
        };
    }

    return apiCall<Transaction[]>(WEBHOOKS.AI_JOURNAL, {
        target_list: ids
    });
}

// Query transactions with filters
export async function queryTransactions(
    params: QueryParams
): Promise<APIResponse<Transaction[]>> {
    return apiCall<Transaction[]>(WEBHOOKS.DATA_QUERY, {
        date_from: params.date_from || null,
        date_to: params.date_to || null,
        updated_from: params.updated_from || null,
        updated_to: params.updated_to || null,
        amount_type: params.transaction_type || null,  // n8n expects amount_type
        status_list: params.status_list || ['initialized', 'journaled', 'updated'],
        // 分页参数
        limit: params.limit || null,
        offset: params.offset || null,
        // 排序参数
        sort_by: params.sort_by || null,
        sort_order: params.sort_order || null
    });
}

// Get default query params (latest 50 records by updated_at)
export function getDefaultQueryParams(): QueryParams {
    return {
        date_from: null,
        date_to: null,
        updated_from: null,
        updated_to: null,
        transaction_type: undefined,
        status_list: ['initialized', 'journaled', 'updated'],
        // 默认获取最新20条
        limit: 20,
        offset: 0,
        sort_by: 'updated_at',
        sort_order: 'desc'
    };
}

// OCR receipt recognition
export async function ocrReceipt(
    imageBase64: string
): Promise<APIResponse<OCRResult>> {
    return apiCall<OCRResult>(WEBHOOKS.AI_OCR, {
        image: imageBase64
    });
}

// Generate summary report (総勘定元帳 or 試算表)
export async function generateSummary(
    params: SummaryRequest
): Promise<APIResponse<LedgerResponse | TrialBalanceResponse>> {
    return apiCall<LedgerResponse | TrialBalanceResponse>(WEBHOOKS.DATA_SUMMARY, {
        date_from: params.date_from,
        date_to: params.date_to,
        summary_type: params.summary_type
    });
}
