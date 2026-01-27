import {
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    Bot,
    ChevronRight,
    FileText,
    Plus,
    TrendingUp
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Loading } from '../components/ui/Loading';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { queryTransactions } from '../services/api';
import type { Transaction } from '../types';

// 共享的缓存配置（与 DashboardPage 一致）
const CACHE_KEY_PREFIX = 'journal_transactions_';
const CACHE_KEY_UNINITIALIZED_PREFIX = 'journal_uninitialized_';
const CACHE_KEY_MONTHLY_PREFIX = 'journal_monthly_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟

interface CachedData {
    transactions: Transaction[];
    timestamp: number;
}

// 状态标签映射（与账目管理页面对齐）
const STATUS_CONFIG = {
    initialized: {
        label: '未仕訳',
        className: 'bg-amber-100 text-amber-700'
    },
    journaled: {
        label: '已仕訳',
        className: 'bg-emerald-100 text-emerald-700'
    },
    updated: {
        label: '修改',
        className: 'bg-violet-100 text-violet-700'
    }
} as const;

/**
 * 验证交易记录是否有效（非空对象）
 */
function isValidTransaction(tx: unknown): tx is Transaction {
    return (
        tx !== null &&
        typeof tx === 'object' &&
        'id' in tx &&
        typeof (tx as Transaction).id === 'string' &&
        (tx as Transaction).id !== ''
    );
}

export function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t, withLang } = useI18n();

    // 用户专属的缓存键
    const recentCacheKey = user?.uid ? `${CACHE_KEY_PREFIX}${user.uid}` : null;
    const uninitializedCacheKey = user?.uid ? `${CACHE_KEY_UNINITIALIZED_PREFIX}${user.uid}` : null;
    const monthlyCacheKey = user?.uid ? `${CACHE_KEY_MONTHLY_PREFIX}${user.uid}` : null;

    // 数据状态
    const [uninitializedTransactions, setUninitializedTransactions] = useState<Transaction[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [monthlyTransactions, setMonthlyTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    /**
     * 尝试从 localStorage 读取缓存
     */
    const readFromCache = useCallback((key: string | null): Transaction[] | null => {
        if (!key) return null;
        try {
            const cached = localStorage.getItem(key);
            if (cached) {
                const { transactions, timestamp }: CachedData = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_EXPIRY && Array.isArray(transactions)) {
                    return transactions.filter(isValidTransaction);
                }
            }
        } catch {
            // Ignore cache errors
        }
        return null;
    }, []);

    /**
     * 保存数据到 localStorage
     */
    const saveToCache = useCallback((key: string | null, transactions: Transaction[]) => {
        if (!key) return;
        try {
            localStorage.setItem(key, JSON.stringify({
                transactions,
                timestamp: Date.now()
            }));
        } catch {
            // Ignore cache save errors
        }
    }, []);

    /**
     * 获取所有未进行仕訳的账目 (status = initialized)
     */
    const fetchUninitializedTransactions = useCallback(async (): Promise<Transaction[]> => {
        const cached = readFromCache(uninitializedCacheKey);
        if (cached) return cached;

        try {
            const result = await queryTransactions({
                status_list: ['initialized'],
                sort_by: 'transaction_date',
                sort_order: 'desc'
            });
            if (result.status === 'successed' && result.detail) {
                const rawList = Array.isArray(result.detail) ? result.detail : [];
                const validList = rawList.filter(isValidTransaction);
                saveToCache(uninitializedCacheKey, validList);
                return validList;
            }
        } catch (error) {
            console.error('Failed to fetch uninitialized transactions:', error);
        }
        return [];
    }, [uninitializedCacheKey, readFromCache, saveToCache]);

    /**
     * 获取最近更新的账目（所有状态，按 updated_at 排序，20条）
     */
    const fetchRecentTransactions = useCallback(async (): Promise<Transaction[]> => {
        const cached = readFromCache(recentCacheKey);
        if (cached) return cached;

        try {
            const result = await queryTransactions({
                status_list: ['initialized', 'journaled', 'updated'],
                limit: 20,
                sort_by: 'updated_at',
                sort_order: 'desc'
            });
            if (result.status === 'successed' && result.detail) {
                const rawList = Array.isArray(result.detail) ? result.detail : [];
                const validList = rawList.filter(isValidTransaction);
                saveToCache(recentCacheKey, validList);
                return validList;
            }
        } catch (error) {
            console.error('Failed to fetch recent transactions:', error);
        }
        return [];
    }, [recentCacheKey, readFromCache, saveToCache]);

    /**
     * 获取本月账目数据（用于计算收入/支出）- 带缓存
     */
    const fetchMonthlyTransactions = useCallback(async (): Promise<Transaction[]> => {
        // 先尝试从缓存读取
        const cached = readFromCache(monthlyCacheKey);
        if (cached) {
            return cached;
        }

        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;

            // 当月第一天
            const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;

            // 当月最后一天
            const lastDay = new Date(year, month, 0).getDate();
            const dateTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

            const result = await queryTransactions({
                status_list: ['initialized', 'journaled', 'updated'],
                date_from: dateFrom,
                date_to: dateTo,
                sort_by: 'transaction_date',
                sort_order: 'desc'
            });

            if (result.status === 'successed' && result.detail) {
                const rawList = Array.isArray(result.detail) ? result.detail : [];
                const validList = rawList.filter(isValidTransaction);
                // 保存到缓存
                saveToCache(monthlyCacheKey, validList);
                return validList;
            }
        } catch (error) {
            console.error('Failed to fetch monthly transactions:', error);
        }
        return [];
    }, [monthlyCacheKey, readFromCache, saveToCache]);

    /**
     * 检测是否是浏览器刷新
     */
    const isPageReload = useCallback((): boolean => {
        try {
            if (performance.now() > 2000) return false;
            const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
            if (entries.length > 0 && entries[0].type === 'reload') return true;
        } catch {
            // Fallback
        }
        return false;
    }, []);

    /**
     * 清除所有首页相关缓存
     */
    const clearAllHomeCache = useCallback(() => {
        [uninitializedCacheKey, recentCacheKey, monthlyCacheKey].forEach(key => {
            if (key) {
                try { localStorage.removeItem(key); } catch { /* Ignore */ }
            }
        });
    }, [uninitializedCacheKey, recentCacheKey, monthlyCacheKey]);

    // 初始加载
    useEffect(() => {
        const loadData = async () => {
            if (isPageReload()) clearAllHomeCache();
            setLoading(true);
            const [uninitialized, recent, monthly] = await Promise.all([
                fetchUninitializedTransactions(),
                fetchRecentTransactions(),
                fetchMonthlyTransactions()
            ]);
            setUninitializedTransactions(uninitialized);
            setRecentTransactions(recent);
            setMonthlyTransactions(monthly);
            setLoading(false);
        };
        loadData();
    }, [fetchUninitializedTransactions, fetchRecentTransactions, fetchMonthlyTransactions, isPageReload, clearAllHomeCache]);

    // 计算本月收入/支出
    const monthlyStats = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;

        monthlyTransactions.forEach(tx => {
            const txType = tx.transaction_type || tx.amount_type;
            const isIncome = txType === 1;

            if (isIncome) {
                // 收入：使用 debit_amount 或 amount_total（确保转为数字）
                const rawAmount = tx.debit_amount || tx.amount_total || 0;
                const amount = typeof rawAmount === 'string' ? parseFloat(rawAmount) : rawAmount;
                totalIncome += amount || 0;
            } else {
                // 支出：使用 credit_amount 或 amount_total（确保转为数字）
                const rawAmount = tx.credit_amount || tx.amount_total || 0;
                const amount = typeof rawAmount === 'string' ? parseFloat(rawAmount) : rawAmount;
                totalExpense += amount || 0;
            }
        });

        // 计算 AI 仕訳进度
        const totalCount = recentTransactions.length;
        const processedCount = recentTransactions.filter(tx =>
            tx.status === 'journaled' || tx.status === 'updated'
        ).length;
        const progressPercent = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

        return {
            income: totalIncome,
            expense: totalExpense,
            processedCount,
            totalCount,
            progressPercent
        };
    }, [monthlyTransactions, recentTransactions]);

    // 显示数据
    const uninitializedCount = uninitializedTransactions.length;
    const displayedRecentTransactions = recentTransactions.slice(0, 5);

    // 格式化金额（不使用“万”，统一显示完整数字）
    const formatAmount = (amount: number | null | undefined): string => {
        if (amount === null || amount === undefined || isNaN(amount) || amount === 0) return '¥0';
        return `¥${Math.abs(amount).toLocaleString('ja-JP')}`;
    };

    // 格式化日期 (格式: 2025/12/19)
    const formatDate = (dateStr: string | undefined): string => {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '-';
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}/${month}/${day}`;
        } catch {
            return '-';
        }
    };

    // 获取状态配置
    const getStatusConfig = (status: string | undefined) => {
        const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.initialized;
        const labelMap: Record<string, string> = {
            '未仕訳': t('未仕訳'),
            '已仕訳': t('已仕訳'),
            '修改': t('修改')
        };
        return { ...config, label: labelMap[config.label] || config.label };
    };

    // 获取交易金额显示
    const getAmountDisplay = (tx: Transaction): { amount: number; isIncome: boolean } => {
        const txType = tx.transaction_type || tx.amount_type;
        const isIncome = txType === 1;
        let amountValue = isIncome ? tx.debit_amount : tx.credit_amount;
        if (!amountValue || amountValue === 0) amountValue = tx.amount_total || 0;
        return { amount: amountValue, isIncome };
    };

    // 获取科目名称
    const getAccountName = (tx: Transaction): string => {
        return tx.debit_item || tx.credit_item || t('未分类');
    };

    // 导航函数
    const handleViewAllUninitialized = () => {
        navigate(withLang('/transactions'), {
            state: {
                preloadedTransactions: uninitializedTransactions,
                filterType: 'uninitialized',
                isSearchResult: true
            }
        });
    };

    const handleViewMoreRecent = () => navigate(withLang('/transactions'));

    if (loading) {
        return (
            <Layout>
                <Loading text={t('加载中...')} />
            </Layout>
        );
    }

    // 获取当前月份显示
    const currentMonthLabel = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });

    return (
        <Layout>
            <div className="space-y-6">
                {/* ===== 本月概览 + 右侧卡片 ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* 左侧：本月概览 + AI仕訳助手 + 近期编辑账目 */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 本月概览 */}
                        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-2xl p-5 text-white shadow-xl shadow-blue-500/20">
                            {/* 标题区域 */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-blue-100 text-sm">{t('你好，{name}', { name: user?.displayName || user?.email?.split('@')[0] || t('用户') })}</p>
                                    <h2 className="text-xl font-bold mt-0.5">{t('{month}概览', { month: currentMonthLabel })}</h2>
                                </div>
                                <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                            </div>

                            {/* 收入/支出 两栏 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                                        <ArrowUpRight className="w-4 h-4" />
                                        <span>{t('收入')}</span>
                                    </div>
                                    <p className="text-2xl font-bold">{formatAmount(monthlyStats.income)}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                                        <ArrowDownRight className="w-4 h-4" />
                                        <span>{t('支出')}</span>
                                    </div>
                                    <p className="text-2xl font-bold">{formatAmount(monthlyStats.expense)}</p>
                                </div>
                            </div>
                        </div>

                        {/* AI仕訳助手卡片 */}
                        {uninitializedCount > 0 ? (
                            // 有未仕訳账目：显示完整卡片
                            <div
                                onClick={handleViewAllUninitialized}
                                className="bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl p-5 text-white cursor-pointer hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold">{t('AI 仕訳助手')}</h3>
                                        <p className="text-emerald-100 text-sm mt-1">
                                            {t('有 {count} 条需要进行 AI 仕訳', { count: uninitializedCount })}
                                        </p>
                                    </div>
                                    <button className="px-4 py-1.5 bg-white text-emerald-600 text-sm font-medium rounded-lg hover:bg-emerald-50 transition-colors shrink-0">
                                        {t('立即处理')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // 所有仕訳已完成：显示紧凑版 + 快捷报表按钮
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl p-4 text-white">
                                <div className="flex items-center justify-between gap-2">
                                    {/* 左侧：状态显示 */}
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center shrink-0">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                        <p className="text-white font-medium text-sm whitespace-nowrap">
                                            {t('所有仕訳已完成')} <span className="text-emerald-200">✓</span>
                                        </p>
                                    </div>

                                    {/* 右侧：快捷报表按钮 */}
                                    <Link
                                        to={withLang('/reports')}
                                        state={{
                                            reportType: 'monthly_chart',
                                            autoGenerate: true,
                                            period: 'last6months'
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg transition-colors shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <TrendingUp className="w-4 h-4" />
                                        <span className="text-sm font-medium whitespace-nowrap">{t('近6月收支')}</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* 近期编辑账目 */}
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900">{t('近期编辑账目')}</h2>
                                <button
                                    onClick={handleViewMoreRecent}
                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    {t('查看全部')}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {displayedRecentTransactions.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {displayedRecentTransactions.map((tx) => {
                                        const statusConfig = getStatusConfig(tx.status);
                                        const { amount, isIncome } = getAmountDisplay(tx);
                                        return (
                                            <div
                                                key={tx.id}
                                                onClick={handleViewMoreRecent}
                                                className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                            >
                                                {/* 第一行：状态标签 + 日期 + 金额（与账目管理页面移动端对齐） */}
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap shrink-0 ${statusConfig.className}`}>
                                                            {statusConfig.label}
                                                        </span>
                                                        <span className="text-sm text-gray-500">{formatDate(tx.transaction_date)}</span>
                                                    </div>
                                                    <span className={`text-sm font-semibold shrink-0 ${isIncome ? 'text-blue-600' : 'text-red-500'}`}>
                                                        {isIncome ? '+' : '-'}{formatAmount(amount)}
                                                    </span>
                                                </div>

                                                {/* 第二行：科目/描述 */}
                                                <p className="text-sm font-medium text-gray-900 truncate">{tx.description || getAccountName(tx)}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="px-6 py-12 text-center">
                                    <p className="text-gray-500">{t('暂无账目记录')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 右侧：快捷操作 + 財務諸表 */}
                    <div className="space-y-4">
                        {/* 快捷操作 */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5">
                            <h3 className="font-semibold text-gray-900 mb-4">{t('快捷操作')}</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate(withLang('/transactions'), { state: { openCreate: true } })}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <Plus className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="font-medium text-gray-900">{t('新增账目')}</span>
                                    <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-blue-500 transition-colors" />
                                </button>
                                <Link
                                    to={withLang('/reports')}
                                    state={{ reportType: 'monthly_chart' }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-violet-50 hover:bg-violet-100 transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-violet-500 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="font-medium text-gray-900">{t('月度收支统计')}</span>
                                    <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-violet-500 transition-colors" />
                                </Link>
                            </div>
                        </div>

                        {/* 財務諸表 */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5">
                            <h3 className="font-semibold text-gray-900 mb-4">{t('生成財務諸表')}</h3>
                            <div className="space-y-3">
                                <Link
                                    to={withLang('/reports')}
                                    state={{ reportType: 'trial_balance' }}
                                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                                >
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{t('試算表')}</h4>
                                        <p className="text-xs text-gray-500">{t('各仕訳科目的借贷合计和余额')}</p>
                                    </div>
                                    <span className="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        {t('查看')}
                                    </span>
                                </Link>

                                <Link
                                    to={withLang('/reports')}
                                    state={{ reportType: 'ledger' }}
                                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
                                >
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{t('総勘定元帳')}</h4>
                                        <p className="text-xs text-gray-500">{t('按仕訳科目记录所有账目明细')}</p>
                                    </div>
                                    <span className="text-xs text-purple-600 font-medium px-2 py-1 bg-purple-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        {t('查看')}
                                    </span>
                                </Link>

                                <Link
                                    to={withLang('/reports')}
                                    state={{ reportType: 'journal' }}
                                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all group"
                                >
                                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{t('仕訳帳')}</h4>
                                        <p className="text-xs text-gray-500">{t('账本，记录所有账目')}</p>
                                    </div>
                                    <span className="text-xs text-amber-600 font-medium px-2 py-1 bg-amber-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        {t('查看')}
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
