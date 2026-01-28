import { saveAs } from 'file-saver';
import { Download, FileText } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useToast } from '../../contexts/ToastContext';
import type { TrialBalanceResponse } from '../../types';
import { generateTrialBalancePDF } from '../../utils/pdfGenerator';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { PDFExportModal } from '../ui/PDFExportModal';

interface TrialBalanceResultProps {
    isOpen: boolean;
    onClose: () => void;
    data: TrialBalanceResponse;
    dateFrom: string;
    dateTo: string;
}

export function TrialBalanceResult({ isOpen, onClose, data, dateFrom, dateTo }: TrialBalanceResultProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [showPDFModal, setShowPDFModal] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);

    // 格式化金额
    const formatAmount = (amount: number | undefined): string => {
        if (amount === undefined || amount === 0) return '-';
        return `¥${amount.toLocaleString()}`;
    };

    // 导出 CSV
    const handleExportCSV = () => {
        const BOM = '\uFEFF';
        const headers = ['借方残高', '借方合計', '勘定科目', '貸方合計', '貸方残高'];

        const rows = data.entries.map(entry => [
            entry.借方残高 || '',
            entry.借方合計 || '',
            entry.勘定科目,
            entry.貸方合計 || '',
            entry.貸方残高 || ''
        ]);

        // 添加合计行
        rows.push([
            data.summary.借方残高,
            data.summary.借方合計,
            '合計',
            data.summary.貸方合計,
            data.summary.貸方残高
        ]);

        const csvContent = BOM + [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `試算表_${dateFrom}_${dateTo}.csv`);
    };

    // 导出 PDF
    const handleExportPDF = async (companyName: string) => {
        setPdfLoading(true);
        try {
            const blob = await generateTrialBalancePDF(data, companyName, dateFrom, dateTo);
            saveAs(blob, `試算表_${dateFrom}_${dateTo}.pdf`);
            setShowPDFModal(false);
            showToast('success', t('PDF 导出成功'));
        } catch (error) {
            console.error('PDF export error:', error);
            showToast('error', t('PDF 导出失败'));
        } finally {
            setPdfLoading(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={`試算表  ${dateFrom} ~ ${dateTo}`}
                size="lg"
            >
                <div className="space-y-4">
                    {/* 预览表格 */}
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-right font-medium text-gray-700">{t('借方残高')}</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-700">{t('借方合計')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-700">{t('勘定科目')}</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-700">{t('貸方合計')}</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-700">{t('貸方残高')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.entries.map((entry, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-right text-gray-700">
                                            {formatAmount(entry.借方残高)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-700">
                                            {formatAmount(entry.借方合計)}
                                        </td>
                                        <td className="px-4 py-3 text-center font-medium text-gray-900">
                                            {entry.勘定科目}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-700">
                                            {formatAmount(entry.貸方合計)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-700">
                                            {formatAmount(entry.貸方残高)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-100 font-medium">
                                <tr>
                                    <td className="px-4 py-3 text-right text-gray-900">
                                        {formatAmount(data.summary.借方残高)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-900">
                                        {formatAmount(data.summary.借方合計)}
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-900">
                                        {t('合計')}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-900">
                                        {formatAmount(data.summary.貸方合計)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-900">
                                        {formatAmount(data.summary.貸方残高)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* 按钮区域 */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button
                            variant="secondary"
                            onClick={handleExportCSV}
                            icon={<Download className="w-4 h-4" />}
                        >
                            {t('导出 CSV')}
                        </Button>
                        <Button
                            onClick={() => setShowPDFModal(true)}
                            icon={<FileText className="w-4 h-4" />}
                        >
                            {t('导出 PDF')}
                        </Button>
                        <Button variant="ghost" onClick={onClose}>
                            {t('关闭')}
                        </Button>
                    </div>
                </div>
            </Modal>

            <PDFExportModal
                isOpen={showPDFModal}
                onClose={() => setShowPDFModal(false)}
                onExport={handleExportPDF}
                title={t('导出試算表 PDF')}
                loading={pdfLoading}
            />
        </>
    );
}
