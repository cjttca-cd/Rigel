import { ArrowDownWideNarrow, ChevronDown, ChevronUp, Edit3, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Transaction } from '../../types';
import { useI18n } from '../../contexts/I18nContext';
import { CT_RATE_LABELS, FIN_TYPE_LABELS, STATUS_COLORS, STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '../../types';

interface TransactionTableProps {
    transactions: Transaction[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    onEdit: (transaction: Transaction) => void;
    loading?: boolean;
    isSearchResult?: boolean;  // 是否是搜索结果（用于显示不同的空状态消息）
}

type SortField = 'transaction_date' | 'updated_at' | 'debit_amount' | 'credit_amount';
type SortOrder = 'asc' | 'desc';

export function TransactionTable({
    transactions,
    selectedIds,
    onSelectionChange,
    onEdit,
    loading = false,
    isSearchResult = false
}: TransactionTableProps) {
    const { t } = useI18n();
    const [sortField, setSortField] = useState<SortField>('transaction_date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const sortedTransactions = useMemo(() => {
        if (!transactions || !Array.isArray(transactions)) return [];

        return [...transactions].sort((a, b) => {
            let aVal: number;
            let bVal: number;

            switch (sortField) {
                case 'transaction_date':
                    aVal = new Date(a.transaction_date || '').getTime() || 0;
                    bVal = new Date(b.transaction_date || '').getTime() || 0;
                    break;
                case 'updated_at':
                    aVal = new Date(a.updated_at || '').getTime() || 0;
                    bVal = new Date(b.updated_at || '').getTime() || 0;
                    break;
                case 'debit_amount':
                    aVal = a.debit_amount || 0;
                    bVal = b.debit_amount || 0;
                    break;
                case 'credit_amount':
                    aVal = a.credit_amount || 0;
                    bVal = b.credit_amount || 0;
                    break;
                default:
                    aVal = 0;
                    bVal = 0;
            }

            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }, [transactions, sortField, sortOrder]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    // 移动端排序选项
    const SORT_OPTIONS = [
        { field: 'transaction_date' as SortField, order: 'desc' as SortOrder, label: '发生日期（新→旧）' },
        { field: 'transaction_date' as SortField, order: 'asc' as SortOrder, label: '发生日期（旧→新）' },
        { field: 'updated_at' as SortField, order: 'desc' as SortOrder, label: '更新日期（新→旧）' },
        { field: 'updated_at' as SortField, order: 'asc' as SortOrder, label: '更新日期（旧→新）' },
        { field: 'debit_amount' as SortField, order: 'desc' as SortOrder, label: '借方金额（高→低）' },
        { field: 'debit_amount' as SortField, order: 'asc' as SortOrder, label: '借方金额（低→高）' },
    ];

    const handleMobileSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const [field, order] = e.target.value.split(':');
        setSortField(field as SortField);
        setSortOrder(order as SortOrder);
    };

    const handleSelectAll = () => {
        const txList = transactions || [];
        if (selectedIds.length === txList.length && txList.length > 0) {
            onSelectionChange([]);
        } else {
            onSelectionChange(txList.map(t => t.id));
        }
    };

    const handleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter(i => i !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    const formatDate = (dateStr: string | undefined | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('zh-CN');
    };

    const formatAmount = (amount: number | undefined | null) => {
        if (amount === undefined || amount === null) return '-';
        return `¥${Math.round(amount).toLocaleString()}`;
    };

    const getCtRateLabel = (rate: number | undefined | null) => {
        if (rate === undefined || rate === null) return '-';
        return CT_RATE_LABELS[rate] || '-';
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-14 bg-gray-100 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    // Empty state
    if (!transactions || transactions.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 py-16 px-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                </div>
                {isSearchResult ? (
                    <>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('没有搜索到符合条件的账目')}</h3>
                        <p className="text-gray-500 text-sm">{t('请改变搜索条件再次尝试')}</p>
                    </>
                ) : (
                    <>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('未发现近期进行操作的账目')}</h3>
                        <p className="text-gray-500 text-sm">{t('点击上方"新增"按钮可添加账目，也可定义搜索条件进行搜索')}</p>
                    </>
                )}
            </div>
        );
    }

    const allSelected = selectedIds.length === transactions.length && transactions.length > 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* ===== 桌面端表格 ===== */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="w-12 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4"
                                />
                            </th>
                            <TableHeader
                                key="date"
                                label="发生日期"
                                sortable
                                active={sortField === 'transaction_date'}
                                order={sortOrder}
                                onClick={() => handleSort('transaction_date')}
                            />
                            <TableHeader
                                key="updated_at"
                                label="更新日"
                                align="center"
                                sortable
                                active={sortField === 'updated_at'}
                                order={sortOrder}
                                onClick={() => handleSort('updated_at')}
                            />
                            <TableHeader key="status" label="状态" align="center" className="min-w-[60px]" />
                            <TableHeader key="transaction_type" label="类型" align="center" className="min-w-[50px]" />
                            <TableHeader key="desc" label="概述" className="min-w-[180px]" />
                            <TableHeader key="fin_type" label="支付方式" align="center" />
                            <TableHeader key="debit_item" label="借方科目" />
                            <TableHeader
                                key="debit_amount"
                                label="借方金額"
                                align="right"
                                sortable
                                active={sortField === 'debit_amount'}
                                order={sortOrder}
                                onClick={() => handleSort('debit_amount')}
                            />
                            <TableHeader key="debit_ct" label="借方税額" align="right" />
                            <TableHeader key="credit_item" label="貸方科目" separator />
                            <TableHeader
                                key="credit_amount"
                                label="貸方金額"
                                align="right"
                                sortable
                                active={sortField === 'credit_amount'}
                                order={sortOrder}
                                onClick={() => handleSort('credit_amount')}
                            />
                            <TableHeader key="credit_ct" label="貸方税額" align="right" />
                            <TableHeader key="ct_rate" label="税率" align="center" />
                            <th key="actions" className="w-16 px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                                操作
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedTransactions.map((tx, index) => (
                            <tr
                                key={tx.id || `tx-${index}`}
                                className={`
                                    transition-colors hover:bg-gray-50
                                    ${selectedIds.includes(tx.id) ? 'bg-sky-50 hover:bg-sky-100' : ''}
                                `}
                            >
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(tx.id)}
                                        onChange={() => handleSelectOne(tx.id)}
                                        className="w-4 h-4"
                                    />
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                    {formatDate(tx.transaction_date)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 text-center whitespace-nowrap">
                                    {formatDate(tx.updated_at)}
                                </td>
                                <td className="px-4 py-2 text-center whitespace-nowrap">
                                    <span className={`
                                        inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full whitespace-nowrap
                                        ${STATUS_COLORS[tx.status] || 'bg-gray-100 text-gray-600'}
                                    `}>
                                        {STATUS_LABELS[tx.status] || '未知'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-center whitespace-nowrap">
                                    {tx.transaction_type ? (
                                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${tx.transaction_type === 1
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {TRANSACTION_TYPE_LABELS[tx.transaction_type]}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 max-w-[200px]">
                                    <span className="line-clamp-2" title={tx.description || ''}>
                                        {tx.description || '-'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 text-center whitespace-nowrap">
                                    {tx.fin_type ? FIN_TYPE_LABELS[tx.fin_type as 1 | 2 | 3 | 4 | 5] : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                    {tx.debit_item || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap font-mono">
                                    {formatAmount(tx.debit_amount)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 text-right whitespace-nowrap font-mono">
                                    {formatAmount(tx.debit_ct)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap border-l border-gray-200">
                                    {tx.credit_item || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap font-mono">
                                    {formatAmount(tx.credit_amount)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 text-right whitespace-nowrap font-mono">
                                    {formatAmount(tx.credit_ct)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 text-center whitespace-nowrap">
                                    {getCtRateLabel(tx.ct_rate)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => onEdit(tx)}
                                        className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                                        title="编辑"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ===== 移动端/平板卡片视图 ===== */}
            <div className="lg:hidden">
                {/* 工具栏：全选 + 排序 */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <label className="flex items-center justify-center w-11 h-11 rounded-lg hover:bg-gray-100 transition-colors">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={handleSelectAll}
                                className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                            />
                        </label>
                        <span className="text-sm text-gray-600">
                            {selectedIds.length > 0 ? t('已选择 {count} 项', { count: selectedIds.length }) : t('全选')}
                        </span>
                    </div>

                    {/* 排序下拉 */}
                    <div className="flex items-center gap-2 min-w-0">
                        <ArrowDownWideNarrow className="w-4 h-4 text-gray-400" />
                        <select
                            value={`${sortField}:${sortOrder}`}
                            onChange={handleMobileSortChange}
                            className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-1.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 w-[170px] max-w-[170px] truncate"
                        >
                            {SORT_OPTIONS.map((option, idx) => (
                                <option key={idx} value={`${option.field}:${option.order}`}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 卡片列表 */}
                <div className="divide-y divide-gray-100">
                    {sortedTransactions.map((tx, index) => (
                        <MobileTransactionCard
                            key={tx.id || `card-${index}`}
                            transaction={tx}
                            isSelected={selectedIds.includes(tx.id)}
                            onSelect={() => handleSelectOne(tx.id)}
                            onEdit={() => onEdit(tx)}
                            formatDate={formatDate}
                            formatAmount={formatAmount}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// 表头组件
interface TableHeaderProps {
    label: string;
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
    active?: boolean;
    order?: 'asc' | 'desc';
    onClick?: () => void;
    separator?: boolean;
    className?: string;
}

function TableHeader({
    label,
    align = 'left',
    sortable = false,
    active = false,
    order = 'desc',
    onClick,
    separator = false,
    className = ''
}: TableHeaderProps) {
    const alignClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
    };

    return (
        <th
            className={`
                px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap
                ${alignClass[align]}
                ${sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}
                ${separator ? 'border-l border-gray-200' : ''}
                ${className}
            `}
            onClick={sortable ? onClick : undefined}
        >
            <div className={`inline-flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
                {label}
                {sortable && active && (
                    order === 'asc'
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />
                )}
            </div>
        </th>
    );
}

// 移动端卡片组件 - 可折叠详情
interface MobileTransactionCardProps {
    transaction: Transaction;
    isSelected: boolean;
    onSelect: () => void;
    onEdit: () => void;
    formatDate: (date: string | undefined | null) => string;
    formatAmount: (amount: number | undefined | null) => string;
}

function MobileTransactionCard({
    transaction: tx,
    isSelected,
    onSelect,
    onEdit,
    formatDate,
    formatAmount
}: MobileTransactionCardProps) {
    const { t } = useI18n();
    const [expanded, setExpanded] = useState(false);

    // 计算总金额显示
    const totalAmount = Math.max(tx.debit_amount || 0, tx.credit_amount || 0);
    const isIncome = tx.transaction_type === 1;

    return (
        <div className={`p-4 transition-colors ${isSelected ? 'bg-sky-50' : ''}`}>
            <div className="flex gap-3">
                {/* 勾选框 */}
                <div className="pt-0.5">
                    <label className="flex items-center justify-center w-11 h-11 -ml-2 -mt-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onSelect}
                            className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                        />
                    </label>
                </div>

                {/* 内容区 */}
                <div className="flex-1 min-w-0">
                    {/* 第一行：状态 + 日期 + 金额 */}
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className={`
                                inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full
                                ${STATUS_COLORS[tx.status] || 'bg-gray-100 text-gray-600'}
                            `}>
                                {STATUS_LABELS[tx.status] || '未知'}
                            </span>
                            <span className="text-sm text-gray-500">
                                {formatDate(tx.transaction_date)}
                            </span>
                        </div>
                        <span className={`text-base font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isIncome ? '+' : '-'}{formatAmount(totalAmount)}
                        </span>
                    </div>

                    {/* 第二行：描述 */}
                    <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-1">
                        {tx.description || '-'}
                    </p>

                    {/* 折叠切换 + 操作按钮 */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 min-h-[44px] px-2 -ml-2 rounded-lg"
                        >
                            {expanded ? (
                                <>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                    {t('收起详情')}
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                    {t('展开详情')}
                                </>
                            )}
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                                {formatDate(tx.updated_at)} {t('更新')}
                            </span>
                            <button
                                onClick={onEdit}
                                className="inline-flex items-center gap-1 min-h-[44px] min-w-[44px] px-3 text-xs font-medium text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            >
                                <Edit3 className="w-3 h-3" />
                                {t('编辑')}
                            </button>
                        </div>
                    </div>

                    {/* 展开的详情区域 - 更紧凑的布局 */}
                    {expanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 animate-fade-in text-sm">
                            {/* 借方行 */}
                            <div className="flex items-center justify-between gap-3 min-w-0">
                                <span className="text-gray-500 min-w-0 truncate">
                                    {t('借方：{item}', { item: tx.debit_item || '-' })}
                                </span>
                                <span className="text-sky-600 font-medium shrink-0">{formatAmount(tx.debit_amount)}</span>
                            </div>
                            {/* 貸方行 */}
                            <div className="flex items-center justify-between gap-3 min-w-0">
                                <span className="text-gray-500 min-w-0 truncate">
                                    {t('貸方：{item}', { item: tx.credit_item || '-' })}
                                </span>
                                <span className="text-emerald-600 font-medium shrink-0">{formatAmount(tx.credit_amount)}</span>
                            </div>
                            {/* 税 + 支付方式 */}
                            <div className="flex items-center justify-between gap-3 min-w-0">
                                <span className="text-gray-500 min-w-0 truncate">
                                    {t('税：{tax}', {
                                        tax: (() => {
                                            const taxAmount = (tx.debit_ct || 0) > 0 ? tx.debit_ct : tx.credit_ct;
                                            switch (tx.ct_rate) {
                                                case 0:
                                                    return t('非课税');
                                                case 1:
                                                    return t('8%（{amount}）', { amount: formatAmount(taxAmount) });
                                                case 2:
                                                    return t('10%（{amount}）', { amount: formatAmount(taxAmount) });
                                                case 3:
                                                    return t('混合（{amount}）', { amount: formatAmount(taxAmount) });
                                                case 4:
                                                    return t('其他（{amount}）', { amount: formatAmount(taxAmount) });
                                                default:
                                                    return '-';
                                            }
                                        })()
                                    })}
                                </span>
                                <span className="text-gray-700 shrink-0">{tx.fin_type ? FIN_TYPE_LABELS[tx.fin_type as 1 | 2 | 3 | 4 | 5] : '-'}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
