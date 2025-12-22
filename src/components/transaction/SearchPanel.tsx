import { ChevronDown, ChevronUp, FileSpreadsheet, Search, X } from 'lucide-react';
import { useState } from 'react';
import type { QueryParams, SummaryRequest, TransactionStatus } from '../../types';
import { STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '../../types';
import { Button } from '../ui/Button';

interface SearchPanelProps {
    onSearch: (params: QueryParams) => void;
    onGenerateReport: (params: SummaryRequest) => void;
    loading?: boolean;
    reportLoading?: boolean;
}

const STATUS_OPTIONS: TransactionStatus[] = ['initialized', 'journaled', 'updated'];
const TRANSACTION_TYPE_OPTIONS: (1 | 2)[] = [1, 2];

type TabType = 'search' | 'report';

export function SearchPanel({
    onSearch,
    onGenerateReport,
    loading = false,
    reportLoading = false
}: SearchPanelProps) {
    const [expanded, setExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('search');

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

    // 账表生成相关状态
    const [reportDateFrom, setReportDateFrom] = useState('');
    const [reportDateTo, setReportDateTo] = useState('');
    const [summaryType, setSummaryType] = useState<1 | 2 | null>(null);

    // 计算已启用的筛选条件数量
    const enabledCount = [enableTransactionDate, enableTransactionType, enableUpdatedDate, enableStatus].filter(Boolean).length;

    // 账表生成按钮是否可用
    const canGenerateReport = reportDateFrom && reportDateTo && summaryType !== null;

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
        onSearch({});
    };

    const handleGenerateReport = () => {
        if (!canGenerateReport) return;
        onGenerateReport({
            date_from: reportDateFrom,
            date_to: reportDateTo,
            summary_type: summaryType as 1 | 2
        });
    };

    // Checkbox 组件
    const FilterCheckbox = ({
        checked,
        onChange,
        label
    }: {
        checked: boolean;
        onChange: (checked: boolean) => void;
        label: string;
    }) => (
        <label className="flex items-center gap-2 cursor-pointer select-none group">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500 focus:ring-2 transition-colors"
            />
            <span className={`text-sm font-medium transition-colors ${checked ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
                {label}
            </span>
        </label>
    );

    // 日期范围输入组件
    const DateRangeInput = ({
        fromValue,
        toValue,
        onFromChange,
        onToChange,
        className = 'mt-2 ml-6'
    }: {
        fromValue: string;
        toValue: string;
        onFromChange: (value: string) => void;
        onToChange: (value: string) => void;
        className?: string;
    }) => (
        <div className={`flex items-center gap-2 animate-fade-in ${className}`}>
            <input
                type="date"
                value={fromValue}
                onChange={(e) => onFromChange(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            <span className="text-gray-400 text-sm">至</span>
            <input
                type="date"
                value={toValue}
                onChange={(e) => onToChange(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
        </div>
    );

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* 折叠头部 */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">搜索 / 账表生成</span>
                    {enabledCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-sky-100 text-sky-700 rounded-full">
                            {enabledCount} 个条件
                        </span>
                    )}
                </div>
                {expanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {/* 展开内容 */}
            {expanded && (
                <div className="border-t border-gray-100 animate-fade-in">
                    {/* Tab 切换 */}
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('search')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'search'
                                ? 'text-sky-600 border-b-2 border-sky-600 bg-sky-50/50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Search className="w-4 h-4" />
                            搜索
                        </button>
                        <button
                            onClick={() => setActiveTab('report')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'report'
                                ? 'text-sky-600 border-b-2 border-sky-600 bg-sky-50/50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            账表生成
                        </button>
                    </div>

                    {/* 搜索 Tab 内容 */}
                    {activeTab === 'search' && (
                        <div className="px-4 pb-4">
                            <div className="pt-4 space-y-3">
                                {/* 发生日期 */}
                                <div>
                                    <FilterCheckbox
                                        checked={enableTransactionDate}
                                        onChange={setEnableTransactionDate}
                                        label="发生日期"
                                    />
                                    {enableTransactionDate && (
                                        <DateRangeInput
                                            fromValue={dateFrom}
                                            toValue={dateTo}
                                            onFromChange={setDateFrom}
                                            onToChange={setDateTo}
                                        />
                                    )}
                                </div>

                                {/* 类型（收入/支出）*/}
                                <div>
                                    <FilterCheckbox
                                        checked={enableTransactionType}
                                        onChange={setEnableTransactionType}
                                        label="类型"
                                    />
                                    {enableTransactionType && (
                                        <div className="flex flex-wrap gap-2 mt-2 ml-6 animate-fade-in">
                                            {TRANSACTION_TYPE_OPTIONS.map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => handleTransactionTypeToggle(type)}
                                                    className={`
                                                        px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors
                                                        ${transactionType === type
                                                            ? 'bg-sky-50 border-sky-300 text-sky-700'
                                                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                                        }
                                                    `}
                                                >
                                                    {TRANSACTION_TYPE_LABELS[type]}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 更新日期 */}
                                <div>
                                    <FilterCheckbox
                                        checked={enableUpdatedDate}
                                        onChange={setEnableUpdatedDate}
                                        label="更新日期"
                                    />
                                    {enableUpdatedDate && (
                                        <DateRangeInput
                                            fromValue={updatedFrom}
                                            toValue={updatedTo}
                                            onFromChange={setUpdatedFrom}
                                            onToChange={setUpdatedTo}
                                        />
                                    )}
                                </div>

                                {/* 状态筛选 */}
                                <div>
                                    <FilterCheckbox
                                        checked={enableStatus}
                                        onChange={setEnableStatus}
                                        label="状态"
                                    />
                                    {enableStatus && (
                                        <div className="flex flex-wrap gap-2 mt-2 ml-6 animate-fade-in">
                                            {STATUS_OPTIONS.map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleStatusToggle(status)}
                                                    className={`
                                                        px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors
                                                        ${statusList.includes(status)
                                                            ? 'bg-sky-50 border-sky-300 text-sky-700'
                                                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                                        }
                                                    `}
                                                >
                                                    {STATUS_LABELS[status]}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 按钮 */}
                                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 mt-4">
                                    <Button
                                        variant="ghost"
                                        onClick={handleReset}
                                        disabled={enabledCount === 0}
                                        icon={<X className="w-4 h-4" />}
                                    >
                                        重置
                                    </Button>
                                    <Button
                                        onClick={handleSearch}
                                        disabled={loading}
                                        icon={<Search className="w-4 h-4" />}
                                    >
                                        搜索
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 账表生成 Tab 内容 */}
                    {activeTab === 'report' && (
                        <div className="px-4 pb-4">
                            <div className="pt-4 space-y-4">
                                {/* 发生日期范围 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        发生日期 <span className="text-red-500">*</span>
                                    </label>
                                    <DateRangeInput
                                        fromValue={reportDateFrom}
                                        toValue={reportDateTo}
                                        onFromChange={setReportDateFrom}
                                        onToChange={setReportDateTo}
                                        className=""
                                    />
                                </div>

                                {/* 账表类型 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        账表类型 <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="summaryType"
                                                checked={summaryType === 1}
                                                onChange={() => setSummaryType(1)}
                                                className="w-4 h-4 text-sky-600 border-gray-300 focus:ring-sky-500"
                                            />
                                            <span className="text-sm text-gray-700">総勘定元帳</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="summaryType"
                                                checked={summaryType === 2}
                                                onChange={() => setSummaryType(2)}
                                                className="w-4 h-4 text-sky-600 border-gray-300 focus:ring-sky-500"
                                            />
                                            <span className="text-sm text-gray-700">試算表</span>
                                        </label>
                                    </div>
                                </div>

                                {/* 生成按钮 */}
                                <div className="flex justify-end pt-3 border-t border-gray-100 mt-4">
                                    <Button
                                        onClick={handleGenerateReport}
                                        disabled={!canGenerateReport || reportLoading}
                                        loading={reportLoading}
                                        icon={<FileSpreadsheet className="w-4 h-4" />}
                                    >
                                        生成
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
