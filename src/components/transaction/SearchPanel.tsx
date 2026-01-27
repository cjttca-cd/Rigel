import { Filter, Plus, RefreshCw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { QueryParams, TransactionStatus } from '../../types';
import { STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '../../types';
import { useI18n } from '../../contexts/I18nContext';
import { Button } from '../ui/Button';

interface SearchPanelProps {
    onSearch: (params: QueryParams) => void;
    onReset: () => void;
    onCreateNew: () => void;
    onLocalSearch: (keyword: string) => void;  // 本地搜索回调
    loading?: boolean;
    title: string;           // 标题
    count: number;           // 数量
    showHint?: boolean;      // 是否显示提示
}

const STATUS_OPTIONS: TransactionStatus[] = ['initialized', 'journaled', 'updated'];
const TRANSACTION_TYPE_OPTIONS: (1 | 2)[] = [1, 2];

function FilterCheckbox({
    checked,
    onChange,
    label
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
}) {
    return (
        <label className="flex items-center gap-2 cursor-pointer select-none group">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
        </label>
    );
}

function DateRangeInput({
    fromValue,
    toValue,
    onFromChange,
    onToChange,
    t
}: {
    fromValue: string;
    toValue: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
    t: (key: string, vars?: Record<string, string | number>) => string;
}) {
    return (
        <div className="flex items-center gap-2 mt-2 ml-6 animate-fade-in">
            <input
                type="date"
                value={fromValue}
                onChange={(e) => onFromChange(e.target.value)}
                min="1900-01-01"
                max="9999-12-31"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-white"
            />
            <span className="text-gray-400 text-sm shrink-0">{t('至')}</span>
            <input
                type="date"
                value={toValue}
                onChange={(e) => onToChange(e.target.value)}
                min="1900-01-01"
                max="9999-12-31"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-white"
            />
        </div>
    );
}

export function SearchPanel({
    onSearch,
    onReset,
    onCreateNew,
    onLocalSearch,
    loading = false,
    title,
    count,
    showHint = true
}: SearchPanelProps) {
    const { t } = useI18n();
    const [expanded, setExpanded] = useState(false);
    const [localSearchKeyword, setLocalSearchKeyword] = useState('');

    // 搜索相关状态
    const [enableTransactionDate, setEnableTransactionDate] = useState(false);
    const [enableTransactionType, setEnableTransactionType] = useState(false);
    const [enableUpdatedDate, setEnableUpdatedDate] = useState(false);
    const [enableStatus, setEnableStatus] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [updatedFrom, setUpdatedFrom] = useState('');
    const [updatedTo, setUpdatedTo] = useState('');
    const [transactionType, setTransactionType] = useState<1 | 2 | null>(null);
    const [statusList, setStatusList] = useState<TransactionStatus[]>([]);

    // 计算已启用的筛选条件数量
    const enabledCount = [enableTransactionDate, enableTransactionType, enableUpdatedDate, enableStatus].filter(Boolean).length;

    // 本地搜索防抖
    useEffect(() => {
        const timer = setTimeout(() => {
            onLocalSearch(localSearchKeyword);
        }, 300);
        return () => clearTimeout(timer);
    }, [localSearchKeyword, onLocalSearch]);

    const handleStatusToggle = (status: TransactionStatus) => {
        if (statusList.includes(status)) {
            setStatusList(statusList.filter(s => s !== status));
        } else {
            setStatusList([...statusList, status]);
        }
    };

    const handleTransactionTypeToggle = (type: 1 | 2) => {
        if (transactionType === type) {
            setTransactionType(null);
        } else {
            setTransactionType(type);
        }
    };

    const handleSearch = () => {
        onSearch({
            date_from: enableTransactionDate ? (dateFrom || null) : null,
            date_to: enableTransactionDate ? (dateTo || null) : null,
            updated_from: enableUpdatedDate ? (updatedFrom || null) : null,
            updated_to: enableUpdatedDate ? (updatedTo || null) : null,
            transaction_type: enableTransactionType && transactionType ? transactionType : undefined,
            status_list: enableStatus && statusList.length > 0 ? statusList : undefined
        });
        setExpanded(false);
    };

    const handleReset = () => {
        setEnableTransactionDate(false);
        setEnableTransactionType(false);
        setEnableUpdatedDate(false);
        setEnableStatus(false);
        setDateFrom('');
        setDateTo('');
        setUpdatedFrom('');
        setUpdatedTo('');
        setTransactionType(null);
        setStatusList([]);
        setLocalSearchKeyword('');
        onReset();
    };

    return (
        <div className="space-y-3">
            {/* ===== 桌面端布局 ===== */}
            <div className="hidden lg:flex items-center justify-between gap-4">
                {/* 左侧：标题 + 数量/提示 */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm text-gray-500">{t('共 {count} 条', { count })}</span>
                        {showHint && count > 0 && (
                            <span className="text-xs text-gray-400">
                                {t('*勾选后可批量进行 仕訳 / 导出 / 删除')}
                            </span>
                        )}
                    </div>
                </div>

                {/* 右侧：搜索 + 筛选 + 新增 */}
                <div className="flex items-center gap-3">
                    {/* 本地搜索框 */}
                    <div className="relative w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={localSearchKeyword}
                            onChange={(e) => setLocalSearchKeyword(e.target.value)}
                            placeholder={t('搜索列表内账目概述')}
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors"
                        />
                    </div>

                    {/* 筛选按钮 */}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg border transition-all shrink-0
                            ${expanded || enabledCount > 0
                                ? 'bg-sky-50 border-sky-200 text-sky-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }
                        `}
                    >
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('筛选')}</span>
                        {enabledCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-sky-600 text-white rounded-full">
                                {enabledCount}
                            </span>
                        )}
                    </button>

                    {/* 新增按钮 */}
                    <Button
                        onClick={onCreateNew}
                        icon={<Plus className="w-4 h-4" />}
                        className="shrink-0"
                    >
                        {t('新增账目')}
                    </Button>
                </div>
            </div>

            {/* ===== 移动端布局 ===== */}
            <div className="lg:hidden space-y-3">
                {/* 标题行 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                        <span className="text-sm text-gray-500">{t('共 {count} 条', { count })}</span>
                    </div>
                </div>

                {/* 搜索 + 筛选 */}
                <div className="flex items-center gap-2">
                    {/* 本地搜索框 */}
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={localSearchKeyword}
                            onChange={(e) => setLocalSearchKeyword(e.target.value)}
                            placeholder={t('搜索列表内账目概述')}
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors"
                        />
                    </div>

                    {/* 筛选按钮 */}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all shrink-0
                            ${expanded || enabledCount > 0
                                ? 'bg-sky-50 border-sky-200 text-sky-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }
                        `}
                    >
                        <Filter className="w-4 h-4" />
                        {enabledCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-sky-600 text-white rounded-full">
                                {enabledCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* ===== 筛选面板展开内容 ===== */}
            {expanded && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 animate-fade-in shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 发生日期 */}
                        <div className="space-y-2">
                            <FilterCheckbox
                                checked={enableTransactionDate}
                                onChange={setEnableTransactionDate}
                                label={t('发生日期')}
                            />
                            {enableTransactionDate && (
                                <DateRangeInput
                                    fromValue={dateFrom}
                                    toValue={dateTo}
                                    onFromChange={setDateFrom}
                                    onToChange={setDateTo}
                                    t={t}
                                />
                            )}
                        </div>

                        {/* 更新日期 */}
                        <div className="space-y-2">
                            <FilterCheckbox
                                checked={enableUpdatedDate}
                                onChange={setEnableUpdatedDate}
                                label={t('更新日期')}
                            />
                            {enableUpdatedDate && (
                                <DateRangeInput
                                    fromValue={updatedFrom}
                                    toValue={updatedTo}
                                    onFromChange={setUpdatedFrom}
                                    onToChange={setUpdatedTo}
                                    t={t}
                                />
                            )}
                        </div>

                        {/* 类型（收入/支出）*/}
                        <div className="space-y-2">
                            <FilterCheckbox
                                checked={enableTransactionType}
                                onChange={setEnableTransactionType}
                                label={t('类型')}
                            />
                            {enableTransactionType && (
                                <div className="flex flex-wrap gap-2 ml-6 animate-fade-in">
                                    {TRANSACTION_TYPE_OPTIONS.map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => handleTransactionTypeToggle(type)}
                                            className={`
                                                px-4 py-1.5 text-sm font-medium rounded-lg border transition-all
                                                ${transactionType === type
                                                    ? type === 1
                                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                                        : 'bg-red-50 border-red-300 text-red-700'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            {TRANSACTION_TYPE_LABELS[type]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 状态筛选 */}
                        <div className="space-y-2">
                            <FilterCheckbox
                                checked={enableStatus}
                                onChange={setEnableStatus}
                                label={t('状态')}
                            />
                            {enableStatus && (
                                <div className="flex flex-wrap gap-2 ml-6 animate-fade-in">
                                    {STATUS_OPTIONS.map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusToggle(status)}
                                            className={`
                                                px-3 py-1.5 text-sm font-medium rounded-lg border transition-all
                                                ${statusList.includes(status)
                                                    ? status === 'initialized'
                                                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                                                        : status === 'journaled'
                                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                                            : 'bg-violet-50 border-violet-300 text-violet-700'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            {STATUS_LABELS[status]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            onClick={handleReset}
                            icon={<RefreshCw className="w-4 h-4" />}
                        >
                            {t('重置')}
                        </Button>
                        <Button
                            onClick={handleSearch}
                            disabled={loading || enabledCount === 0}
                            icon={<Search className="w-4 h-4" />}
                        >
                            {t('应用筛选')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
