import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { useState } from 'react';
import type { QueryParams, TransactionStatus } from '../../types';
import { STATUS_LABELS } from '../../types';
import { Button } from '../ui/Button';

interface SearchPanelProps {
    onSearch: (params: QueryParams) => void;
    loading?: boolean;
}

const STATUS_OPTIONS: TransactionStatus[] = ['initialized', 'journaled', 'updated'];

export function SearchPanel({ onSearch, loading = false }: SearchPanelProps) {
    const [expanded, setExpanded] = useState(false);

    // 各筛选条件的启用状态
    const [enableTransactionDate, setEnableTransactionDate] = useState(false);
    const [enableCreatedDate, setEnableCreatedDate] = useState(false);
    const [enableUpdatedDate, setEnableUpdatedDate] = useState(false);
    const [enableStatus, setEnableStatus] = useState(false);

    // 筛选条件的值
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [createdFrom, setCreatedFrom] = useState('');
    const [createdTo, setCreatedTo] = useState('');
    const [updatedFrom, setUpdatedFrom] = useState('');
    const [updatedTo, setUpdatedTo] = useState('');
    const [statusList, setStatusList] = useState<TransactionStatus[]>([]);

    // 计算已启用的筛选条件数量
    const enabledCount = [enableTransactionDate, enableCreatedDate, enableUpdatedDate, enableStatus].filter(Boolean).length;

    const handleStatusToggle = (status: TransactionStatus) => {
        if (statusList.includes(status)) {
            setStatusList(statusList.filter(s => s !== status));
        } else {
            setStatusList([...statusList, status]);
        }
    };

    const handleSearch = () => {
        onSearch({
            date_from: enableTransactionDate ? (dateFrom || null) : null,
            date_to: enableTransactionDate ? (dateTo || null) : null,
            created_from: enableCreatedDate ? (createdFrom || null) : null,
            created_to: enableCreatedDate ? (createdTo || null) : null,
            updated_from: enableUpdatedDate ? (updatedFrom || null) : null,
            updated_to: enableUpdatedDate ? (updatedTo || null) : null,
            status_list: enableStatus && statusList.length > 0 ? statusList : undefined
        });
    };

    const handleReset = () => {
        setEnableTransactionDate(false);
        setEnableCreatedDate(false);
        setEnableUpdatedDate(false);
        setEnableStatus(false);
        setDateFrom('');
        setDateTo('');
        setCreatedFrom('');
        setCreatedTo('');
        setUpdatedFrom('');
        setUpdatedTo('');
        setStatusList([]);
        onSearch({});
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
        onToChange
    }: {
        fromValue: string;
        toValue: string;
        onFromChange: (value: string) => void;
        onToChange: (value: string) => void;
    }) => (
        <div className="flex items-center gap-2 mt-2 ml-6 animate-fade-in">
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
                    <span className="text-sm font-medium text-gray-700">搜索</span>
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
                <div className="px-4 pb-4 border-t border-gray-100 animate-fade-in">
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

                        {/* 创建日期 */}
                        <div>
                            <FilterCheckbox
                                checked={enableCreatedDate}
                                onChange={setEnableCreatedDate}
                                label="创建日期"
                            />
                            {enableCreatedDate && (
                                <DateRangeInput
                                    fromValue={createdFrom}
                                    toValue={createdTo}
                                    onFromChange={setCreatedFrom}
                                    onToChange={setCreatedTo}
                                />
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
        </div>
    );
}
