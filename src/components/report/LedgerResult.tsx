import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { Download, FileText, Package } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import type { Ledger, LedgerResponse } from '../../types';
import { generateLedgerPDF } from '../../utils/pdfGenerator';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { PDFExportModal } from '../ui/PDFExportModal';

interface LedgerResultProps {
    isOpen: boolean;
    onClose: () => void;
    data: LedgerResponse;
    dateFrom: string;
    dateTo: string;
}

export function LedgerResult({ isOpen, onClose, data, dateFrom, dateTo }: LedgerResultProps) {
    const { showToast } = useToast();
    const [showPDFModal, setShowPDFModal] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null);
    const [exportAllPDF, setExportAllPDF] = useState(false);

    // 生成单个科目的 CSV 内容
    const generateLedgerCSV = (ledger: Ledger): string => {
        const BOM = '\uFEFF';
        const headers = ['日付', '相手勘定科目', '摘要', '借方金額', '貸方金額', '残高'];

        const rows = ledger.entries.map(entry => [
            entry.年月日,
            entry.相手勘定科目,
            `"${(entry.摘要 || '').replace(/"/g, '""')}"`,
            entry.借方金額 ?? '',
            entry.貸方金額 ?? '',
            entry.残高
        ]);

        // 添加合计行
        rows.push([
            '合計',
            '',
            '',
            ledger.summary.借方合計,
            ledger.summary.貸方合計,
            ledger.summary.残高
        ]);

        return BOM + [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
    };

    // 导出单个科目 CSV
    const handleExportSingleCSV = (ledger: Ledger) => {
        const csvContent = generateLedgerCSV(ledger);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `総勘定元帳_${ledger.勘定科目}_${dateFrom}_${dateTo}.csv`);
    };

    // 导出单个科目 PDF
    const handleExportSinglePDF = (ledger: Ledger) => {
        setSelectedLedger(ledger);
        setExportAllPDF(false);
        setShowPDFModal(true);
    };

    // 导出全部 CSV (ZIP)
    const handleExportAllCSV = async () => {
        const zip = new JSZip();

        data.ledgers.forEach(ledger => {
            const csvContent = generateLedgerCSV(ledger);
            zip.file(`総勘定元帳_${ledger.勘定科目}_${dateFrom}_${dateTo}.csv`, csvContent);
        });

        const blob = await zip.generateAsync({ type: 'blob' });
        saveAs(blob, `総勘定元帳_${dateFrom}_${dateTo}.zip`);
    };

    // 导出全部 PDF (ZIP)
    const handleExportAllPDFClick = () => {
        setSelectedLedger(null);
        setExportAllPDF(true);
        setShowPDFModal(true);
    };

    // 实际执行 PDF 导出
    const handlePDFExport = async (companyName: string) => {
        setPdfLoading(true);
        try {
            if (exportAllPDF) {
                // 导出全部科目的 PDF 打包成 ZIP
                const zip = new JSZip();

                for (const ledger of data.ledgers) {
                    const blob = await generateLedgerPDF(ledger, companyName, dateFrom, dateTo);
                    const arrayBuffer = await blob.arrayBuffer();
                    zip.file(`総勘定元帳_${ledger.勘定科目}_${dateFrom}_${dateTo}.pdf`, arrayBuffer);
                }

                const zipBlob = await zip.generateAsync({ type: 'blob' });
                saveAs(zipBlob, `総勘定元帳_${dateFrom}_${dateTo}.zip`);
            } else if (selectedLedger) {
                // 导出单个科目
                const blob = await generateLedgerPDF(selectedLedger, companyName, dateFrom, dateTo);
                saveAs(blob, `総勘定元帳_${selectedLedger.勘定科目}_${dateFrom}_${dateTo}.pdf`);
            }

            setShowPDFModal(false);
            showToast('success', 'PDF 导出成功');
        } catch (error) {
            console.error('PDF export error:', error);
            showToast('error', 'PDF 导出失败');
        } finally {
            setPdfLoading(false);
        }
    };

    // 格式化金额
    const formatAmount = (amount: number | undefined): string => {
        if (amount === undefined || amount === 0) return '-';
        return `¥${amount.toLocaleString()}`;
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={`総勘定元帳  ${dateFrom} ~ ${dateTo}`}
                size="lg"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        共 {data.total_accounts} 个科目
                    </p>

                    {/* 科目列表 */}
                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700">勘定科目</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-700">借方合計</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-700">貸方合計</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-700">导出</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.ledgers.map((ledger, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {ledger.勘定科目}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-700">
                                            {formatAmount(ledger.summary.借方合計)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-700">
                                            {formatAmount(ledger.summary.貸方合計)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleExportSingleCSV(ledger)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                                    title="导出 CSV"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    CSV
                                                </button>
                                                <button
                                                    onClick={() => handleExportSinglePDF(ledger)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded transition-colors"
                                                    title="导出 PDF"
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                    PDF
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 按钮区域 */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button
                            variant="secondary"
                            onClick={handleExportAllCSV}
                            icon={<Package className="w-4 h-4" />}
                        >
                            全部 CSV (ZIP)
                        </Button>
                        <Button
                            onClick={handleExportAllPDFClick}
                            icon={<Package className="w-4 h-4" />}
                        >
                            全部 PDF (ZIP)
                        </Button>
                        <Button variant="ghost" onClick={onClose}>
                            关闭
                        </Button>
                    </div>
                </div>
            </Modal>

            <PDFExportModal
                isOpen={showPDFModal}
                onClose={() => setShowPDFModal(false)}
                onExport={handlePDFExport}
                title={exportAllPDF
                    ? "导出全部総勘定元帳 PDF"
                    : `导出総勘定元帳 PDF - ${selectedLedger?.勘定科目}`
                }
                loading={pdfLoading}
            />
        </>
    );
}
