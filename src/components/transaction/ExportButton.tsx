import { saveAs } from 'file-saver';
import { ChevronDown, Download, FileText } from 'lucide-react';
import { useRef, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import type { Transaction } from '../../types';
import { CT_RATE_LABELS_JP, FIN_TYPE_LABELS_JP, TRANSACTION_TYPE_LABELS_JP } from '../../types';
import { generateJournalPDF } from '../../utils/pdfGenerator';
import { Button } from '../ui/Button';
import { PDFExportModal } from '../ui/PDFExportModal';

interface ExportButtonProps {
    transactions: Transaction[];
    selectedIds: string[];
    disabled?: boolean;
}

export function ExportButton({ transactions, selectedIds, disabled = false }: ExportButtonProps) {
    const { showToast } = useToast();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showPDFModal, setShowPDFModal] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 获取要导出的数据
    const getDataToExport = () => {
        return selectedIds.length > 0
            ? transactions.filter(t => selectedIds.includes(t.id))
            : transactions;
    };

    // 计算日期范围
    const getDateRange = (data: Transaction[]) => {
        const dates = data
            .map(t => t.transaction_date?.split('T')[0])
            .filter(Boolean)
            .sort();

        if (dates.length === 0) {
            const today = new Date().toISOString().split('T')[0];
            return { from: today, to: today };
        }

        return {
            from: dates[0] as string,
            to: dates[dates.length - 1] as string
        };
    };

    // 导出 CSV
    const handleExportCSV = () => {
        const dataToExport = getDataToExport();
        if (dataToExport.length === 0) return;

        const { from, to } = getDateRange(dataToExport);

        // Define CSV headers - 使用日文表示
        const headers = [
            '日付',
            '種類',
            '決済方法',
            '備考',
            '借方科目',
            '借方金額',
            '借方税額',
            '貸方科目',
            '貸方金額',
            '貸方税額',
            '税率',
            '記帳日時',
            '更新日時'
        ];

        // Convert transactions to CSV rows
        const rows = dataToExport.map(t => [
            t.transaction_date?.split('T')[0] || '',
            t.transaction_type ? TRANSACTION_TYPE_LABELS_JP[t.transaction_type] : '',
            t.fin_type ? FIN_TYPE_LABELS_JP[t.fin_type as 1 | 2 | 3 | 4 | 5] : '',
            `"${(t.description || '').replace(/"/g, '""')}"`,
            t.debit_item || '',
            t.debit_amount || '',
            t.debit_ct || '',
            t.credit_item || '',
            t.credit_amount || '',
            t.credit_ct || '',
            t.ct_rate !== undefined ? CT_RATE_LABELS_JP[t.ct_rate] || '' : '',
            t.created_at?.split('T')[0] || '',
            t.updated_at?.split('T')[0] || ''
        ]);

        // Create CSV content with BOM for Excel compatibility
        const BOM = '\uFEFF';
        const csvContent = BOM + [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `仕訳帳_${from}_${to}.csv`);

        setShowDropdown(false);
    };

    // 导出 PDF
    const handleExportPDF = async (companyName: string) => {
        const dataToExport = getDataToExport();
        if (dataToExport.length === 0) return;

        const { from, to } = getDateRange(dataToExport);

        setPdfLoading(true);
        try {
            const blob = await generateJournalPDF(dataToExport, companyName, from, to);
            saveAs(blob, `仕訳帳_${from}_${to}.pdf`);
            setShowPDFModal(false);
            showToast('success', 'PDF 导出成功');
        } catch (error) {
            console.error('PDF export error:', error);
            showToast('error', 'PDF 导出失败');
        } finally {
            setPdfLoading(false);
        }
    };

    // 点击外部关闭下拉菜单
    const handleClickOutside = (e: React.MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
            setShowDropdown(false);
        }
    };

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                <Button
                    variant="secondary"
                    onClick={() => setShowDropdown(!showDropdown)}
                    disabled={disabled}
                    icon={<Download className="w-4 h-4" />}
                >
                    <span className="inline-flex items-center gap-1">
                        导出
                        <ChevronDown className="w-3 h-3" />
                    </span>
                </Button>

                {showDropdown && (
                    <div
                        className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                        onClick={handleClickOutside}
                    >
                        <button
                            onClick={handleExportCSV}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <Download className="w-4 h-4" />
                            导出 CSV
                        </button>
                        <button
                            onClick={() => {
                                setShowDropdown(false);
                                setShowPDFModal(true);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <FileText className="w-4 h-4" />
                            导出 PDF
                        </button>
                    </div>
                )}
            </div>

            <PDFExportModal
                isOpen={showPDFModal}
                onClose={() => setShowPDFModal(false)}
                onExport={handleExportPDF}
                title="导出仕訳帳 PDF"
                loading={pdfLoading}
            />
        </>
    );
}
