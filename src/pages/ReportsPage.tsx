import { BarChart3, BookOpen, ChevronDown, FileSpreadsheet, FileText, Scale, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { JournalResult } from '../components/report/JournalResult';
import { LedgerResult } from '../components/report/LedgerResult';
import { MonthlyChartPanel } from '../components/report/MonthlyChartPanel';
import { TrialBalanceResult } from '../components/report/TrialBalanceResult';
import { Button } from '../components/ui/Button';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { generateSummary } from '../services/api';
import type { JournalResponse, LedgerResponse, SummaryRequest, Transaction, TrialBalanceResponse } from '../types';

type ReportType = 'trial_balance' | 'ledger' | 'journal' | 'monthly_chart';

// 报表类型配置 - 每个报表都有独特的颜色和图标
const REPORT_CONFIGS = {
    trial_balance: {
        labelKey: '試算表',
        subtitle: 'Trial Balance',
        descriptionKey: '汇总所有仕訳科目的借贷合计和余额，用于核对账目平衡',
        icon: Scale,
        gradient: 'from-blue-400 via-blue-500 to-indigo-500',
        bgLight: 'bg-blue-50',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-200',
        shadowColor: 'shadow-blue-500/20'
    },
    ledger: {
        labelKey: '総勘定元帳',
        subtitle: 'General Ledger',
        descriptionKey: '按仕訳科目分类记录所有账目明细，便于查看每个科目的收支历史',
        icon: BookOpen,
        gradient: 'from-teal-400 via-teal-500 to-emerald-500',
        bgLight: 'bg-teal-50',
        textColor: 'text-teal-600',
        borderColor: 'border-teal-200',
        shadowColor: 'shadow-teal-500/20'
    },
    journal: {
        labelKey: '仕訳帳',
        subtitle: 'Journal',
        descriptionKey: '完整的账本记录，按时间顺序记录所有账目',
        icon: FileSpreadsheet,
        gradient: 'from-violet-400 via-violet-500 to-purple-500',
        bgLight: 'bg-violet-50',
        textColor: 'text-violet-600',
        borderColor: 'border-violet-200',
        shadowColor: 'shadow-violet-500/20'
    },
    monthly_chart: {
        labelKey: '月度收支统计',
        subtitle: 'Monthly Chart',
        descriptionKey: '可视化图表展示月度总收入和支出情况',
        icon: TrendingUp,
        gradient: 'from-amber-400 via-orange-400 to-orange-500',
        bgLight: 'bg-amber-50',
        textColor: 'text-amber-600',
        borderColor: 'border-amber-200',
        shadowColor: 'shadow-amber-500/20'
    }
} as const;

const REPORT_TYPES: ReportType[] = ['monthly_chart', 'trial_balance', 'ledger', 'journal'];

export function ReportsPage() {
    const location = useLocation();
    const { t } = useI18n();
    const locationState = location.state as {
        reportType?: ReportType;
        autoGenerate?: boolean;
        period?: 'last6months';
    } | null;

    const initialReportType = locationState?.reportType || 'monthly_chart';
    const shouldAutoGenerate = locationState?.autoGenerate === true;
    const autoGeneratePeriod = locationState?.period;

    // 计算近6个月的日期范围
    const getLast6MonthsRange = () => {
        const now = new Date();
        // 开始日期：往回5个月的1号（共6个月）
        const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        // 结束日期：当月的最后一天
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const formatLocalDate = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        return {
            from: formatLocalDate(from),
            to: formatLocalDate(to)
        };
    };

    const [reportType, setReportType] = useState<ReportType>(initialReportType);
    const [dateFrom, setDateFrom] = useState(() => {
        if (shouldAutoGenerate && autoGeneratePeriod === 'last6months') {
            return getLast6MonthsRange().from;
        }
        const now = new Date();
        return `${now.getFullYear()}-01-01`;
    });
    const [dateTo, setDateTo] = useState(() => {
        if (shouldAutoGenerate && autoGeneratePeriod === 'last6months') {
            return getLast6MonthsRange().to;
        }
        const now = new Date();
        return `${now.getFullYear()}-12-31`;
    });
    const [loading, setLoading] = useState(false);
    const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceResponse | null>(null);
    const [ledgerData, setLedgerData] = useState<LedgerResponse | null>(null);
    const [journalData, setJournalData] = useState<JournalResponse | null>(null);
    const [monthlyChartData, setMonthlyChartData] = useState<JournalResponse | null>(null);

    // 移动端折叠状态
    const [mobileExpandedType, setMobileExpandedType] = useState<ReportType | null>(initialReportType);

    // 结果区域 ref（用于自动滚动）
    const resultRef = useRef<HTMLDivElement>(null);

    const { showToast } = useToast();
    const navigate = useNavigate();

    // 同步展开状态和选中状态
    useEffect(() => {
        setMobileExpandedType(reportType);
    }, [reportType]);

    // 生成报表
    const handleGenerateReport = async () => {
        if (!dateFrom || !dateTo) {
            showToast('error', t('请选择日期范围'));
            return;
        }

        setLoading(true);
        setTrialBalanceData(null);
        setLedgerData(null);
        setJournalData(null);
        setMonthlyChartData(null);

        try {
            let summaryType: 1 | 2 | 3;
            if (reportType === 'trial_balance') {
                summaryType = 2;
            } else if (reportType === 'journal' || reportType === 'monthly_chart') {
                summaryType = 3;
            } else {
                summaryType = 1;
            }
            const params: SummaryRequest = {
                summary_type: summaryType,
                date_from: dateFrom,
                date_to: dateTo
            };

            const result = await generateSummary(params);

            if (result.status === 'successed' && result.detail) {
                if (reportType === 'trial_balance') {
                    setTrialBalanceData(result.detail as TrialBalanceResponse);
                    showToast('success', t('试算表 生成成功'));
                } else if (reportType === 'ledger') {
                    setLedgerData(result.detail as LedgerResponse);
                    showToast('success', t('総勘定元帳 生成成功'));
                } else if (reportType === 'journal') {
                    setJournalData(result.detail as JournalResponse);
                    showToast('success', t('仕訳帳 生成成功'));
                } else if (reportType === 'monthly_chart') {
                    setMonthlyChartData(result.detail as JournalResponse);
                    showToast('success', t('月度收支统计 生成成功'));
                    // 自动滚动到图表结果
                    setTimeout(() => {
                        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            } else {
                if (result.message?.includes('initialized records') && Array.isArray(result.detail)) {
                    const uninitializedTransactions = result.detail as Transaction[];
                    showToast('warning', t('日期范围内有 {count} 条账目未进行 AI 仕訳，正在跳转...', { count: uninitializedTransactions.length }));
                    setTimeout(() => {
                        navigate('/transactions', {
                            state: {
                                preloadedTransactions: uninitializedTransactions,
                                filterType: 'uninitialized',
                                isSearchResult: true
                            }
                        });
                    }, 1000);
                } else {
                    throw new Error(result.message || t('生成失败'));
                }
            }
        } catch (error) {
            console.error('Report generation error:', error);
            showToast('error', t('报表生成失败'));
        } finally {
            setLoading(false);
        }
    };

    // 自动生成报表（从首页快捷入口进入时）
    const hasAutoGeneratedRef = useRef(false);
    useEffect(() => {
        if (shouldAutoGenerate && !hasAutoGeneratedRef.current && dateFrom && dateTo) {
            hasAutoGeneratedRef.current = true;
            // 清除 location state，防止刷新页面重复触发
            window.history.replaceState({}, document.title);
            // 延迟一点执行，确保页面已渲染
            setTimeout(() => {
                handleGenerateReport();
            }, 100);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldAutoGenerate, dateFrom, dateTo]);

    // 快速设置日期范围
    // 例如：当前是2026年1月，选择"近3个月"
    // 开始日期：2025年11月1日（倒数3个月的1号）
    // 结束日期：2026年1月31日（当月的最后一天）
    const setQuickDateRange = (months: number) => {
        const now = new Date();

        // 开始日期：倒数N个月的1号
        // 例如：当前1月，近3个月 = 往回2个月 = 从11月1日开始
        const from = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

        // 结束日期：当月的最后一天
        // new Date(year, month + 1, 0) 会得到当月的最后一天
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // 使用本地时间格式化日期（避免 toISOString() 的 UTC 时区偏移问题）
        const formatLocalDate = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        setDateFrom(formatLocalDate(from));
        setDateTo(formatLocalDate(to));
    };

    // 处理移动端折叠点击
    const handleMobileToggle = (type: ReportType) => {
        if (mobileExpandedType === type) {
            // 点击已展开的项，不收起，只是确认选中
            setReportType(type);
        } else {
            // 展开新项并选中
            setMobileExpandedType(type);
            setReportType(type);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* 标题 */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('报表中心')}</h1>
                </div>

                {/* ===== 桌面端：横向卡片选择 ===== */}
                <div className="hidden lg:block">
                    {/* 报表类型选择 - 横向排列 */}
                    <div className="mb-6">
                        <h2 className="text-sm font-medium text-gray-700 mb-4">{t('选择报表类型')}</h2>
                        <div className="grid grid-cols-4 gap-4">
                            {REPORT_TYPES.map((type) => {
                                const config = REPORT_CONFIGS[type];
                                const Icon = config.icon;
                                const isSelected = reportType === type;

                                return (
                                    <button
                                        key={type}
                                        onClick={() => setReportType(type)}
                                        className={`
                                            relative group text-left rounded-2xl overflow-hidden transition-all duration-300
                                            ${isSelected
                                                ? `ring-2 ring-offset-2 ring-${type === 'trial_balance' ? 'blue' : type === 'ledger' ? 'teal' : type === 'journal' ? 'violet' : 'amber'}-500 shadow-lg ${config.shadowColor}`
                                                : 'hover:shadow-md'
                                            }
                                        `}
                                    >
                                        {/* 渐变背景 */}
                                        <div className={`
                                            absolute inset-0 bg-gradient-to-br ${config.gradient} 
                                            transition-opacity duration-300
                                            ${isSelected ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'}
                                        `} />

                                        {/* 卡片内容 */}
                                        <div className="relative p-5 h-full">
                                            {/* 图标区域 */}
                                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>

                                            {/* 标题 */}
                                            <h3 className="text-lg font-bold text-white mb-1">
                                                {t(config.labelKey)}
                                            </h3>
                                            <p className="text-xs text-white/70 mb-3">
                                                {config.subtitle}
                                            </p>

                                            {/* 描述 */}
                                            <p className="text-sm text-white/80 line-clamp-2">
                                                {t(config.descriptionKey)}
                                            </p>

                                            {/* 选中指示器 */}
                                            {isSelected && (
                                                <div className="absolute top-3 right-3">
                                                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                                        <svg className={`w-4 h-4 ${config.textColor}`} fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 设置与输出区域 */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        <h2 className="text-sm font-medium text-gray-700 mb-4">{t('设置与输出')}</h2>
                        <div className="flex items-end gap-6">
                            {/* 日期范围 */}
                            <div className="flex-1">
                                <div className="flex items-center gap-4">
                                    {/* 快速选择按钮 */}
                                    {reportType === 'monthly_chart' && (
                                        <div className="flex gap-2 mr-4">
                                            <button
                                                type="button"
                                                onClick={() => setQuickDateRange(3)}
                                                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                            >
                                                {t('近3个月')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setQuickDateRange(6)}
                                                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                            >
                                                {t('近6个月')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setQuickDateRange(12)}
                                                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                            >
                                                {t('近12个月')}
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">{t('开始日期')}</label>
                                            <input
                                                type="date"
                                                value={dateFrom}
                                                onChange={(e) => setDateFrom(e.target.value)}
                                                min="1900-01-01"
                                                max="9999-12-31"
                                                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                            />
                                        </div>
                                        <span className="text-gray-400 mt-5">~</span>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">{t('结束日期')}</label>
                                            <input
                                                type="date"
                                                value={dateTo}
                                                onChange={(e) => setDateTo(e.target.value)}
                                                min="1900-01-01"
                                                max="9999-12-31"
                                                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 生成按钮 */}
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleGenerateReport}
                                loading={loading}
                                icon={<FileText className="w-5 h-5" />}
                            >
                                {t('生成报表')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ===== 移动端：手风琴折叠式 ===== */}
                <div className="lg:hidden space-y-6">
                    {/* 报表类型选择 - 折叠手风琴 */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <h2 className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-b border-gray-100">
                            {t('选择报表类型')}
                        </h2>
                        <div className="divide-y divide-gray-100">
                            {REPORT_TYPES.map((type) => {
                                const config = REPORT_CONFIGS[type];
                                const Icon = config.icon;
                                const isExpanded = mobileExpandedType === type;
                                const isSelected = reportType === type;

                                return (
                                    <div key={type}>
                                        {/* 折叠头部 */}
                                        <button
                                            onClick={() => handleMobileToggle(type)}
                                            className={`
                                                w-full flex items-center justify-between p-4 text-left transition-colors
                                                ${isSelected ? config.bgLight : 'hover:bg-gray-50'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`
                                                    w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                                                    ${isSelected ? `bg-gradient-to-br ${config.gradient}` : 'bg-gray-100'}
                                                `}>
                                                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className={`font-medium block truncate ${isSelected ? config.textColor : 'text-gray-900'}`}>
                                                        {t(config.labelKey)}
                                                    </span>
                                                    <p className="text-xs text-gray-500 truncate">{config.subtitle}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {isSelected && (
                                                    <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                                                        {t('已选择')}
                                                    </span>
                                                )}
                                                <ChevronDown
                                                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                                />
                                            </div>
                                        </button>

                                        {/* 展开内容 */}
                                        <div className={`
                                            overflow-hidden transition-all duration-200 ease-in-out
                                            ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}
                                        `}>
                                            <div className={`px-4 pb-4 pt-2 ${config.bgLight} border-l-4 ${config.borderColor}`}>
                                                <p className="text-sm text-gray-600">
                                                    {t(config.descriptionKey)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 日期范围 */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-4">
                        <h2 className="text-sm font-medium text-gray-700 mb-4">{t('日期范围')}</h2>

                        {/* 快速选择按钮 */}
                        {reportType === 'monthly_chart' && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setQuickDateRange(3)}
                                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                >
                                    {t('近3个月')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQuickDateRange(6)}
                                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                >
                                    {t('近6个月')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQuickDateRange(12)}
                                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                >
                                    {t('近12个月')}
                                </button>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">{t('开始日期')}</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    min="1900-01-01"
                                    max="9999-12-31"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">{t('结束日期')}</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    min="1900-01-01"
                                    max="9999-12-31"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 生成按钮 - 固定在底部 */}
                    <div className="pb-20">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleGenerateReport}
                            loading={loading}
                            icon={<FileText className="w-5 h-5" />}
                            fullWidth
                        >
                            {t('生成报表')}
                        </Button>
                    </div>
                </div>

                {/* 报表结果区域 */}
                {trialBalanceData && (
                    <TrialBalanceResult
                        isOpen={true}
                        data={trialBalanceData}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        onClose={() => setTrialBalanceData(null)}
                    />
                )}

                {ledgerData && (
                    <LedgerResult
                        isOpen={true}
                        data={ledgerData}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        onClose={() => setLedgerData(null)}
                    />
                )}

                {monthlyChartData && (
                    <div ref={resultRef}>
                        <MonthlyChartPanel
                            data={monthlyChartData}
                            dateFrom={dateFrom}
                            dateTo={dateTo}
                        />
                    </div>
                )}

                {journalData && (
                    <JournalResult
                        isOpen={true}
                        data={journalData}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        onClose={() => setJournalData(null)}
                    />
                )}
            </div>
        </Layout>
    );
}
