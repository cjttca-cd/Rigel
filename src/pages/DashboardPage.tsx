import { ChevronDown, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { LedgerResult, TrialBalanceResult } from '../components/report';
import { ExportButton } from '../components/transaction/ExportButton';
import { SearchPanel } from '../components/transaction/SearchPanel';
import { TransactionForm } from '../components/transaction/TransactionForm';
import { TransactionTable } from '../components/transaction/TransactionTable';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Loading } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
    createTransaction,
    deleteTransactions,
    generateSummary,
    getDefaultQueryParams,
    processAIJournal,
    queryTransactions,
    updateTransaction
} from '../services/api';
import type {
    LedgerResponse,
    QueryParams,
    SummaryRequest,
    Transaction,
    TransactionInput,
    TransactionUpdate,
    TrialBalanceResponse
} from '../types';

const CACHE_KEY_PREFIX = 'journal_transactions_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CachedData {
    transactions: Transaction[];
    timestamp: number;
}

export function DashboardPage() {
    const { user } = useAuth();
    const { showToast } = useToast();

    // 用户专属的缓存键
    const cacheKey = user?.uid ? `${CACHE_KEY_PREFIX}${user.uid}` : null;

    // Data state
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    // Confirm dialogs
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showAIConfirm, setShowAIConfirm] = useState(false);

    // 分页状态
    const [currentOffset, setCurrentOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const PAGE_SIZE = 20;

    // 账表生成状态
    const [reportLoading, setReportLoading] = useState(false);
    const [showLedgerResult, setShowLedgerResult] = useState(false);
    const [showTrialBalanceResult, setShowTrialBalanceResult] = useState(false);
    const [ledgerData, setLedgerData] = useState<LedgerResponse | null>(null);
    const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceResponse | null>(null);
    const [reportDateRange, setReportDateRange] = useState({ from: '', to: '' });

    // Load transactions
    const loadTransactions = useCallback(async (params?: QueryParams, useCache = true) => {
        // 验证交易数据是否有效
        const isValidTransaction = (tx: unknown): tx is Transaction => {
            return tx !== null &&
                typeof tx === 'object' &&
                'id' in tx &&
                typeof (tx as Transaction).id === 'string' &&
                (tx as Transaction).id !== '';
        };

        if (useCache && cacheKey) {
            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const { transactions: cachedTx, timestamp }: CachedData = JSON.parse(cached);
                    if (Date.now() - timestamp < CACHE_EXPIRY && Array.isArray(cachedTx)) {
                        const validTx = cachedTx.filter(isValidTransaction);
                        setTransactions(validTx);
                        setLoading(false);
                        return;
                    }
                }
            } catch {
                // Ignore cache errors
            }
        }

        setLoading(true);
        const queryParams = params || getDefaultQueryParams();

        try {
            const response = await queryTransactions(queryParams);
            setLoading(false);

            if (response.status === 'successed' && response.detail) {
                // 过滤掉无效的交易记录
                const rawList = Array.isArray(response.detail) ? response.detail : [];
                const txList = rawList.filter(isValidTransaction);
                setTransactions(txList);

                // 重置分页状态
                setCurrentOffset(0);
                setHasMore(txList.length >= PAGE_SIZE);

                // Save to cache if user is logged in
                if (cacheKey && txList.length > 0) {
                    try {
                        localStorage.setItem(cacheKey, JSON.stringify({
                            transactions: txList,
                            timestamp: Date.now()
                        }));
                    } catch {
                        // Ignore cache save errors
                    }
                }
            } else {
                setTransactions([]);
                setHasMore(false);
                // 不显示错误提示，因为后端目前不可用是预期情况
                // 用户已经可以看到"暂无账目数据"的空状态
            }
        } catch {
            setLoading(false);
            setTransactions([]);
            setHasMore(false);
            // 网络错误时也不显示 toast，空状态已说明问题
        }
    }, [cacheKey, showToast, PAGE_SIZE]);

    // 页面加载时滚动到顶部
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    // Create transaction
    const handleCreate = async (data: TransactionInput) => {
        setActionLoading(true);
        try {
            const response = await createTransaction(data);
            console.log('Create response:', response); // Debug log

            if (response.status === 'successed') {
                showToast('success', '账目创建成功');
                setShowCreateModal(false);
                loadTransactions(undefined, false);
            } else {
                showToast('error', response.message || '创建失败');
                // 失败时也关闭弹窗，让用户可以重试
                setShowCreateModal(false);
            }
        } catch (error) {
            console.error('Create error:', error);
            showToast('error', '创建失败');
            setShowCreateModal(false);
        } finally {
            setActionLoading(false);
        }
    };

    // Update transaction
    const handleUpdate = async (data: TransactionUpdate) => {
        setActionLoading(true);
        try {
            const response = await updateTransaction(data);
            console.log('Update response:', response); // Debug log

            if (response.status === 'successed') {
                showToast('success', '账目更新成功');
                loadTransactions(undefined, false);
            } else {
                showToast('error', response.message || '更新失败');
            }
        } catch (error) {
            console.error('Update error:', error);
            showToast('error', '更新失败');
        } finally {
            setActionLoading(false);
            setShowEditModal(false);
            setEditingTransaction(null);
        }
    };

    // Delete transactions
    const handleDelete = async () => {
        if (selectedIds.length === 0) return;

        setActionLoading(true);
        const response = await deleteTransactions(selectedIds);
        setActionLoading(false);
        setShowDeleteConfirm(false);

        if (response.status === 'successed') {
            showToast('success', `成功删除 ${selectedIds.length} 条账目`);
            setSelectedIds([]);
            loadTransactions(undefined, false);
        } else {
            showToast('error', response.message || '删除失败');
        }
    };

    // Process AI Journal
    const handleAIJournal = async () => {
        if (selectedIds.length === 0) return;
        if (selectedIds.length > 100) {
            showToast('error', 'AI仕訳一次最多处理100条记录');
            return;
        }

        setActionLoading(true);
        const response = await processAIJournal(selectedIds);
        setActionLoading(false);
        setShowAIConfirm(false);

        if (response.status === 'successed') {
            showToast('success', 'AI仕訳处理完成');
            setSelectedIds([]);
            loadTransactions(undefined, false);
        } else {
            showToast('error', response.message || 'AI处理失败');
        }
    };

    // Open edit modal
    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setShowEditModal(true);
    };

    // Search handler
    const [isSearchActive, setIsSearchActive] = useState(false);

    const handleSearch = (params: QueryParams) => {
        // 检查是否有实际的搜索条件
        const hasSearchParams = !!(
            params.date_from || params.date_to ||
            params.updated_from || params.updated_to ||
            params.transaction_type ||
            (params.status_list && params.status_list.length > 0)
        );
        setIsSearchActive(hasSearchParams);
        loadTransactions(params, false);
    };

    // Refresh handler
    const handleRefresh = () => {
        setIsSearchActive(false);
        loadTransactions(undefined, false);
    };

    // 账表生成处理
    const handleGenerateReport = async (params: SummaryRequest) => {
        setReportLoading(true);
        setReportDateRange({ from: params.date_from, to: params.date_to });

        try {
            const response = await generateSummary(params);

            if (response.status === 'successed' && response.detail) {
                if (params.summary_type === 1) {
                    // 総勘定元帳
                    setLedgerData(response.detail as LedgerResponse);
                    setShowLedgerResult(true);
                } else {
                    // 試算表
                    setTrialBalanceData(response.detail as TrialBalanceResponse);
                    setShowTrialBalanceResult(true);
                }
            } else {
                // 处理错误
                const message = response.message || '生成失败';

                if (message.includes('initialized records')) {
                    // 存在未记账数据
                    showToast('warning', '存在未执行 AI仕訳 的账目，已显示在列表中。请选择账目执行 AI仕訳 后，再次尝试生成账表。');
                    // 将未处理的数据载入到 Dashboard
                    const initializedRecords = response.detail as unknown as Transaction[];
                    if (Array.isArray(initializedRecords) && initializedRecords.length > 0) {
                        setTransactions(initializedRecords);
                        setIsSearchActive(false);
                    }
                } else if (message.includes('Authentication')) {
                    showToast('error', '登录已过期，请重新登录');
                } else if (message.includes('No available records')) {
                    showToast('info', '该期间内没有可生成账表的账目');
                } else if (message.includes('Input data')) {
                    showToast('error', '输入参数有误，请检查日期格式');
                } else if (message.includes('Database')) {
                    showToast('error', '服务器错误，请稍后重试');
                } else if (message.includes('Switch')) {
                    showToast('error', '系统错误，请联系管理员');
                } else {
                    showToast('error', message);
                }
            }
        } catch (error) {
            console.error('Generate report error:', error);
            showToast('error', '生成账表失败');
        } finally {
            setReportLoading(false);
        }
    };

    // 加载更多
    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        const newOffset = currentOffset + PAGE_SIZE;

        try {
            const params = getDefaultQueryParams();
            params.offset = newOffset;
            params.limit = PAGE_SIZE;

            const response = await queryTransactions(params);

            if (response.status === 'successed' && response.detail) {
                const rawList = Array.isArray(response.detail) ? response.detail : [];
                const newTxList = rawList.filter((tx): tx is Transaction =>
                    tx !== null && typeof tx === 'object' && 'id' in tx && typeof tx.id === 'string' && tx.id !== ''
                );

                if (newTxList.length > 0) {
                    setTransactions(prev => [...prev, ...newTxList]);
                    setCurrentOffset(newOffset);
                    setHasMore(newTxList.length >= PAGE_SIZE);
                } else {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch {
            showToast('error', '加载更多失败');
        } finally {
            setLoadingMore(false);
        }
    };

    // 只有在初始加载时才显示全屏加载状态
    // 搜索时不显示全屏加载，防止 SearchPanel 被卸载导致状态丢失
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // 初始加载完成后设置为 false
    useEffect(() => {
        if (!loading && isInitialLoad) {
            setIsInitialLoad(false);
        }
    }, [loading, isInitialLoad]);

    if (loading && isInitialLoad) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loading size="lg" text="加载中..." />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* 页面标题 */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">账目列表</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            共 {transactions.length} 条记录
                            {selectedIds.length > 0 && (
                                <span className="text-sky-600 font-medium">
                                    {' '}· 已选择 {selectedIds.length} 条
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={handleRefresh}
                            disabled={loading}
                            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                        >
                            刷新列表
                        </Button>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            icon={<Plus className="w-4 h-4" />}
                        >
                            新增
                        </Button>
                    </div>
                </div>

                {/* 搜索面板 */}
                <SearchPanel
                    onSearch={handleSearch}
                    onGenerateReport={handleGenerateReport}
                    loading={loading}
                    reportLoading={reportLoading}
                />

                {/* 操作工具栏 */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <span className="text-sm text-gray-500">
                            {selectedIds.length > 0
                                ? `已选择 ${selectedIds.length} 条记录`
                                : '请先勾选要进行操作的账目'
                            }
                        </span>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => setShowAIConfirm(true)}
                                disabled={selectedIds.length === 0}
                                icon={<Sparkles className="w-4 h-4" />}
                            >
                                AI仕訳
                            </Button>

                            <ExportButton
                                transactions={transactions}
                                selectedIds={selectedIds}
                                disabled={selectedIds.length === 0}
                            />

                            <Button
                                variant="danger"
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={selectedIds.length === 0}
                                icon={<Trash2 className="w-4 h-4" />}
                            >
                                删除
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 数据表格 */}
                <TransactionTable
                    transactions={transactions}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    onEdit={handleEdit}
                    loading={loading}
                    isSearchResult={isSearchActive}
                />

                {/* 加载更多按钮 */}
                {!isSearchActive && hasMore && transactions.length > 0 && (
                    <div className="mt-4 flex justify-center">
                        <Button
                            variant="secondary"
                            onClick={handleLoadMore}
                            loading={loadingMore}
                            icon={<ChevronDown className="w-4 h-4" />}
                        >
                            加载更多
                        </Button>
                    </div>
                )}

                {/* 显示当前加载数量 */}
                {!isSearchActive && transactions.length > 0 && (
                    <p className="mt-2 text-center text-sm text-gray-400">
                        已加载 {transactions.length} 条账目
                        {!hasMore && '（已全部加载）'}
                    </p>
                )}
            </div>

            {/* 新增弹窗 */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="新增账目"
                size="lg"
            >
                <TransactionForm
                    mode="create"
                    onSubmit={handleCreate}
                    onCancel={() => setShowCreateModal(false)}
                    loading={actionLoading}
                />
            </Modal>

            {/* 编辑弹窗 */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingTransaction(null);
                }}
                title="编辑账目"
                size="lg"
            >
                {editingTransaction && (() => {
                    // 辅助函数：将字符串或数字转换为数字
                    const toNumber = (val: unknown): number => {
                        if (typeof val === 'number') return val;
                        if (typeof val === 'string') return parseFloat(val) || 0;
                        return 0;
                    };

                    // 计算金额: (debit_amount + credit_amount + debit_ct + credit_ct) / 2
                    const calculatedAmount = Math.round(
                        (toNumber(editingTransaction.debit_amount) +
                            toNumber(editingTransaction.credit_amount) +
                            toNumber(editingTransaction.debit_ct) +
                            toNumber(editingTransaction.credit_ct)) / 2
                    );

                    // 类型: 基于 transaction_type 字段 (1=收入, 2=支出)
                    const rawTransactionType = toNumber(editingTransaction.transaction_type);
                    const amountType: 1 | 2 = rawTransactionType === 1 ? 1 : 2;

                    // ct_rate 转换为数字
                    const ctRate = toNumber(editingTransaction.ct_rate);

                    // 税务类型: ct_rate === 0 为非课税(1)，否则为课税(2)
                    const taxType: 1 | 2 = ctRate === 0 ? 1 : 2;

                    // 税率: 直接使用 ct_rate (1=8%, 2=10%, 3=混合, 4=其の他)
                    const taxRate = ctRate > 0 ? ctRate as 1 | 2 | 3 | 4 : undefined;

                    // 课税额: 当 ct_rate === 3 或 4 时，取 debit_ct 或 credit_ct 中大于0的值
                    const taxAmount = (ctRate === 3 || ctRate === 4)
                        ? Math.max(toNumber(editingTransaction.debit_ct), toNumber(editingTransaction.credit_ct))
                        : undefined;

                    return (
                        <TransactionForm
                            mode="edit"
                            initialData={{
                                id: editingTransaction.id,
                                status: editingTransaction.status,  // 传递当前状态给 webhook
                                transaction_date: editingTransaction.transaction_date,
                                description: editingTransaction.description,
                                amount_total: calculatedAmount,
                                amount_type: amountType,
                                fin_type: (editingTransaction.fin_type as 1 | 2 | 3 | 4 | 5) || 1,
                                tax_type: taxType,
                                tax_rate: taxRate,
                                tax_amount: taxAmount,
                                debit_item: editingTransaction.debit_item,
                                credit_item: editingTransaction.credit_item
                            }}
                            onSubmit={(data) => handleUpdate(data as TransactionUpdate)}
                            onCancel={() => {
                                setShowEditModal(false);
                                setEditingTransaction(null);
                            }}
                            loading={actionLoading}
                        />
                    );
                })()}
            </Modal>

            {/* 删除确认 */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="确认删除"
                message={`确定要删除选中的 ${selectedIds.length} 条账目吗？此操作不可恢复。`}
                confirmText="删除"
                variant="danger"
                loading={actionLoading}
            />

            {/* AI仕訳确认 */}
            <ConfirmDialog
                isOpen={showAIConfirm}
                onClose={() => setShowAIConfirm(false)}
                onConfirm={handleAIJournal}
                title="AI 仕訳"
                message={`确定要对选中的 ${selectedIds.length} 条账目执行 AI 仕訳吗？`}
                confirmText="执行"
                variant="primary"
                loading={actionLoading}
            />

            {/* 総勘定元帳结果 */}
            {ledgerData && (
                <LedgerResult
                    isOpen={showLedgerResult}
                    onClose={() => setShowLedgerResult(false)}
                    data={ledgerData}
                    dateFrom={reportDateRange.from}
                    dateTo={reportDateRange.to}
                />
            )}

            {/* 試算表结果 */}
            {trialBalanceData && (
                <TrialBalanceResult
                    isOpen={showTrialBalanceResult}
                    onClose={() => setShowTrialBalanceResult(false)}
                    data={trialBalanceData}
                    dateFrom={reportDateRange.from}
                    dateTo={reportDateRange.to}
                />
            )}
        </Layout>
    );
}
