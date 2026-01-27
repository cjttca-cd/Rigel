import { BarChart3, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import type { JournalResponse } from '../../types';

interface MonthlyChartPanelProps {
    data: JournalResponse;
    dateFrom: string;
    dateTo: string;
}

// 收入科目颜色（蓝绿色系）
const INCOME_COLORS = [
    '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#34d399', '#22d3ee', '#38bdf8', '#60a5fa', '#818cf8'
];

// 支出科目颜色（橙红色系）
const EXPENSE_COLORS = [
    '#f97316', '#ef4444', '#ec4899', '#f59e0b', '#e11d48',
    '#fb923c', '#f87171', '#f472b6', '#fbbf24', '#fb7185'
];

type ChartMode = 'bar' | 'line';

interface MonthlyData {
    month: string;
    [key: string]: number | string;
}

interface AccountInfo {
    name: string;
    type: 'income' | 'expense';
    color: string;
}

// 自定义 Tooltip 组件
interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        name: string;
        value: number;
        color: string;
        dataKey: string;
    }>;
    label?: string;
    accounts: AccountInfo[];
}

function CustomTooltip({ active, payload, label, accounts }: CustomTooltipProps) {
    if (!active || !payload || payload.length === 0) return null;

    // 分离收入和支出
    const incomeItems = payload.filter(p => {
        const acc = accounts.find(a => a.name === p.dataKey);
        return acc?.type === 'income' && p.value !== 0;
    });
    const expenseItems = payload.filter(p => {
        const acc = accounts.find(a => a.name === p.dataKey);
        return acc?.type === 'expense' && p.value !== 0;
    });

    // 计算总计
    const totalIncome = incomeItems.reduce((sum, p) => sum + p.value, 0);
    const totalExpense = expenseItems.reduce((sum, p) => sum + Math.abs(p.value), 0);

    const formatAmount = (value: number) => {
        const absValue = Math.abs(value);
        if (absValue >= 10000) {
            return `¥${(absValue / 10000).toFixed(1)}万`;
        }
        return `¥${absValue.toLocaleString('ja-JP')}`;
    };

    return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl p-4 min-w-[200px]">
            <div className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">
                {label}
            </div>

            {/* 收入部分 */}
            {incomeItems.length > 0 && (
                <div className="mb-3">
                    <div className="text-xs font-medium text-emerald-600 mb-1.5 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        収入
                    </div>
                    {incomeItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-0.5 text-sm">
                            <span className="flex items-center gap-2">
                                <span
                                    className="w-3 h-3 rounded-sm"
                                    style={{ backgroundColor: item.color }}
                                ></span>
                                <span className="text-gray-700">{item.name}</span>
                            </span>
                            <span className="font-medium text-emerald-600">
                                {formatAmount(item.value)}
                            </span>
                        </div>
                    ))}
                    <div className="flex justify-between items-center pt-1 mt-1 border-t border-gray-100 text-sm font-medium">
                        <span className="text-gray-500">小計</span>
                        <span className="text-emerald-600">{formatAmount(totalIncome)}</span>
                    </div>
                </div>
            )}

            {/* 支出部分 */}
            {expenseItems.length > 0 && (
                <div>
                    <div className="text-xs font-medium text-orange-600 mb-1.5 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        支出
                    </div>
                    {expenseItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-0.5 text-sm">
                            <span className="flex items-center gap-2">
                                <span
                                    className="w-3 h-3 rounded-sm"
                                    style={{ backgroundColor: item.color }}
                                ></span>
                                <span className="text-gray-700">{item.name}</span>
                            </span>
                            <span className="font-medium text-orange-600">
                                {formatAmount(item.value)}
                            </span>
                        </div>
                    ))}
                    <div className="flex justify-between items-center pt-1 mt-1 border-t border-gray-100 text-sm font-medium">
                        <span className="text-gray-500">小計</span>
                        <span className="text-orange-600">{formatAmount(totalExpense)}</span>
                    </div>
                </div>
            )}

            {/* 净额 */}
            {incomeItems.length > 0 && expenseItems.length > 0 && (
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200 text-sm font-semibold">
                    <span className="text-gray-700">総額</span>
                    <span className={totalIncome - totalExpense >= 0 ? 'text-emerald-600' : 'text-orange-600'}>
                        {totalIncome - totalExpense >= 0 ? '+' : ''}{formatAmount(totalIncome - totalExpense)}
                    </span>
                </div>
            )}
        </div>
    );
}

export function MonthlyChartPanel({ data, dateFrom, dateTo }: MonthlyChartPanelProps) {
    const [chartMode, setChartMode] = useState<ChartMode>('bar');
    const [selectedAccount, setSelectedAccount] = useState<string>('all');

    // 处理数据：按月汇总各科目
    const { monthlyData, accounts } = useMemo(() => {
        // 按月份和科目汇总金额
        const monthMap = new Map<string, Map<string, number>>();
        const accountSet = new Map<string, 'income' | 'expense'>();

        // 遍历所有记录
        data.records.forEach(record => {
            const dateStr = record.transaction_date;
            if (!dateStr) return;

            // 提取月份 (YYYY-MM)
            const month = dateStr.substring(0, 7);

            if (!monthMap.has(month)) {
                monthMap.set(month, new Map());
            }
            const monthData = monthMap.get(month)!;

            // 根据 transaction_type 判断收入/支出
            if (record.transaction_type === 1) {
                // 收入：credit_item + credit_amount
                const itemName = record.credit_item;
                const amount = parseFloat(record.credit_amount) || 0;

                if (itemName && amount > 0) {
                    accountSet.set(itemName, 'income');
                    const current = monthData.get(itemName) || 0;
                    monthData.set(itemName, current + amount);
                }

                // 如果有税额，添加仮受消費税
                const taxAmount = parseFloat(record.credit_ct) || 0;
                if (taxAmount > 0) {
                    const taxName = '仮受消費税';
                    accountSet.set(taxName, 'income');
                    const current = monthData.get(taxName) || 0;
                    monthData.set(taxName, current + taxAmount);
                }
            } else if (record.transaction_type === 2) {
                // 支出：debit_item + debit_amount
                const itemName = record.debit_item;
                const amount = parseFloat(record.debit_amount) || 0;

                if (itemName && amount > 0) {
                    accountSet.set(itemName, 'expense');
                    const current = monthData.get(itemName) || 0;
                    monthData.set(itemName, current + amount);
                }

                // 如果有税额，添加仮払消費税
                const taxAmount = parseFloat(record.debit_ct) || 0;
                if (taxAmount > 0) {
                    const taxName = '仮払消費税';
                    accountSet.set(taxName, 'expense');
                    const current = monthData.get(taxName) || 0;
                    monthData.set(taxName, current + taxAmount);
                }
            }
        });

        // 生成所有月份列表（只包含有数据的范围）
        // 找到数据中最早和最晚的月份
        const dataMonths = Array.from(monthMap.keys()).sort();

        // 如果没有数据，返回空
        if (dataMonths.length === 0) {
            return { monthlyData: [], accounts: [] };
        }

        // 使用数据中的实际月份范围，而不是传入的日期范围
        const firstDataMonth = dataMonths[0];
        const lastDataMonth = dataMonths[dataMonths.length - 1];

        const allMonths: string[] = [];
        const [startYear, startMonth] = firstDataMonth.split('-').map(Number);
        const [endYear, endMonth] = lastDataMonth.split('-').map(Number);

        const current = new Date(startYear, startMonth - 1, 1);
        const endDate = new Date(endYear, endMonth - 1, 1);

        while (current <= endDate) {
            const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
            allMonths.push(monthStr);
            current.setMonth(current.getMonth() + 1);
        }

        // 构建科目信息列表
        const accounts: AccountInfo[] = [];
        let incomeIdx = 0;
        let expenseIdx = 0;

        accountSet.forEach((type, name) => {
            const color = type === 'income'
                ? INCOME_COLORS[incomeIdx++ % INCOME_COLORS.length]
                : EXPENSE_COLORS[expenseIdx++ % EXPENSE_COLORS.length];
            accounts.push({ name, type, color });
        });

        // 构建月度数据
        const monthlyData: MonthlyData[] = allMonths.map(month => {
            const monthData = monthMap.get(month);
            const result: MonthlyData = { month };

            accounts.forEach(acc => {
                const amount = monthData?.get(acc.name) || 0;
                if (acc.type === 'income') {
                    // 收入科目使用正值（显示在上方）
                    result[acc.name] = amount;
                } else {
                    // 支出科目使用负值（显示在下方）
                    result[acc.name] = -amount;
                }
            });

            return result;
        });

        return { monthlyData, accounts };
    }, [data, dateFrom, dateTo]);

    // 获取可选科目列表
    const accountOptions = useMemo(() => {
        return [
            { value: 'all', label: '全部科目' },
            ...accounts.map(acc => ({
                value: acc.name,
                label: `${acc.name} (${acc.type === 'income' ? '収入' : '支出'})`
            }))
        ];
    }, [accounts]);

    // 折线图数据
    const lineChartData = useMemo(() => {
        if (selectedAccount === 'all') return [];

        const selectedAcc = accounts.find(a => a.name === selectedAccount);
        if (!selectedAcc) return [];

        return monthlyData.map(md => {
            let total = 0;
            const accountValue = Math.abs(Number(md[selectedAccount]) || 0);

            accounts.forEach(acc => {
                if (acc.type === selectedAcc.type) {
                    total += Math.abs(Number(md[acc.name]) || 0);
                }
            });

            const percentage = total > 0 ? (accountValue / total) * 100 : 0;

            return {
                month: md.month,
                value: accountValue,
                percentage: Math.round(percentage * 10) / 10
            };
        });
    }, [monthlyData, selectedAccount, accounts]);

    // 格式化金额
    const formatAmount = (value: number) => {
        if (value === 0) return '¥0';
        const absValue = Math.abs(value);
        if (absValue >= 10000) {
            return `${value < 0 ? '-' : ''}¥${(absValue / 10000).toFixed(1)}万`;
        }
        return `${value < 0 ? '-' : ''}¥${absValue.toLocaleString('ja-JP')}`;
    };

    // 格式化月份显示
    const formatMonth = (month: string) => {
        const parts = month.split('-');
        if (parts.length === 2) {
            return `${parts[0].slice(2)}/${parts[1]}`;
        }
        return month;
    };

    // 收入科目和支出科目分开
    const incomeAccounts = accounts.filter(a => a.type === 'income');
    const expenseAccounts = accounts.filter(a => a.type === 'expense');

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900">月度统计图表</h2>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                            {dateFrom} ~ {dateTo}
                        </p>
                    </div>
                </div>

                {/* 图表模式切换 - 使用图标 */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => setChartMode('bar')}
                        className={`p-2 rounded-lg transition-all ${chartMode === 'bar'
                            ? 'bg-sky-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        title="柱状图"
                    >
                        <BarChart3 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setChartMode('line')}
                        className={`p-2 rounded-lg transition-all ${chartMode === 'line'
                            ? 'bg-sky-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        title="折线图"
                    >
                        <TrendingUp className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 科目筛选 */}
            {chartMode === 'line' && (
                <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-4 flex-wrap">
                        <label className="text-sm font-medium text-gray-700">选择科目：</label>
                        <select
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            {accountOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {selectedAccount !== 'all' && (
                            <span className="text-sm text-gray-500">
                                显示该科目占{accounts.find(a => a.name === selectedAccount)?.type === 'income' ? '収入' : '支出'}的百分比
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* 图表区域 */}
            <div className="p-2 sm:p-6 overflow-x-auto">
                {chartMode === 'bar' ? (
                    <div style={{ width: '100%', minWidth: '320px', height: 400 }}>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={monthlyData}
                                stackOffset="sign"
                                margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tickFormatter={formatMonth}
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    axisLine={{ stroke: '#d1d5db' }}
                                    tickLine={{ stroke: '#d1d5db' }}
                                />
                                <YAxis
                                    tickFormatter={formatAmount}
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                    axisLine={{ stroke: '#d1d5db' }}
                                    tickLine={{ stroke: '#d1d5db' }}
                                    width={80}
                                />
                                <Tooltip
                                    content={<CustomTooltip accounts={accounts} />}
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                />
                                {/* 隐藏默认图例，使用底部自定义图例 */}
                                <Legend content={() => null} />
                                <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1.5} />

                                {/* 收入科目（正值，上方） */}
                                {incomeAccounts.map((acc) => (
                                    <Bar
                                        key={acc.name}
                                        dataKey={acc.name}
                                        stackId="stack"
                                        fill={acc.color}
                                        radius={[2, 2, 0, 0]}
                                    />
                                ))}

                                {/* 支出科目（负值，下方） */}
                                {expenseAccounts.map((acc) => (
                                    <Bar
                                        key={acc.name}
                                        dataKey={acc.name}
                                        stackId="stack"
                                        fill={acc.color}
                                        radius={[0, 0, 2, 2]}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div style={{ width: '100%', height: 400 }}>
                        {selectedAccount === 'all' ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <TrendingUp className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500">请从上方下拉框选择一个科目</p>
                                    <p className="text-gray-400 text-sm mt-1">查看该科目的月度占比趋势</p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={400} minWidth={300}>
                                <LineChart
                                    data={lineChartData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="month"
                                        tickFormatter={formatMonth}
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tickFormatter={(v) => `${v}%`}
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                    />
                                    <Tooltip
                                        formatter={(value, name) => {
                                            const numValue = typeof value === 'number' ? value : 0;
                                            if (typeof name === 'string' && (name === 'percentage' || name.includes('占比'))) {
                                                return [`${numValue}%`, '占比'];
                                            }
                                            return [formatAmount(numValue), '金额'];
                                        }}
                                        labelFormatter={(label) => `${label}`}
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="percentage"
                                        name={`${selectedAccount} 占比`}
                                        stroke={accounts.find(a => a.name === selectedAccount)?.color || '#8b5cf6'}
                                        strokeWidth={3}
                                        dot={{ r: 6, strokeWidth: 2, fill: 'white' }}
                                        activeDot={{ r: 8, strokeWidth: 0, fill: accounts.find(a => a.name === selectedAccount)?.color || '#8b5cf6' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                )}
            </div>

            {/* 底部图例说明 */}
            <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-1.5">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
                        <span className="text-xs sm:text-sm text-gray-600">収入（上方）</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-orange-400 to-rose-400"></div>
                        <span className="text-xs sm:text-sm text-gray-600">支出（下方）</span>
                    </div>
                </div>
                <p className="text-center text-xs text-gray-400">
                    ※ 仅显示对象期间内有账目记录的月份
                </p>
            </div>
        </div>
    );
}
