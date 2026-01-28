import { saveAs } from 'file-saver';
import { BookOpen, Download, FileText } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useToast } from '../../contexts/ToastContext';
import type { JournalResponse } from '../../types';
import { generateJournalRecordsPDF } from '../../utils/pdfGenerator';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { PDFExportModal } from '../ui/PDFExportModal';

interface JournalResultProps {
    isOpen: boolean;
    onClose: () => void;
    data: JournalResponse;
    dateFrom: string;
    dateTo: string;
}

export function JournalResult({ isOpen, onClose, data, dateFrom, dateTo }: JournalResultProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [showPDFModal, setShowPDFModal] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);

    // 格式化日期
    const formatDate = (dateStr: string | undefined): string => {
        if (!dateStr) return '-';
        return dateStr.split('T')[0];
    };

    // 导出 CSV
    const handleExportCSV = () => {
        const BOM = '\uFEFF';
        const headers = ['日付', '備考', '借方科目', '借方金額', '借方税額', '貸方科目', '貸方金額', '貸方税額'];

        const rows = data.records.map(r => [
            formatDate(r.transaction_date),
            `"${(r.description || '').replace(/"/g, '""')}"`,
            r.debit_item || '',
            r.debit_amount || '',
            r.debit_ct || '',
            r.credit_item || '',
            r.credit_amount || '',
            r.credit_ct || ''
        ]);

        const csvContent = BOM + [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `仕訳帳_${dateFrom}_${dateTo}.csv`);
        showToast('success', t('CSV 导出成功'));
    };

    // 导出 PDF
    const handleExportPDF = async (companyName: string) => {
        setPdfLoading(true);
        try {
            const blob = await generateJournalRecordsPDF(data.records, companyName, dateFrom, dateTo);
            saveAs(blob, `仕訳帳_${dateFrom}_${dateTo}.pdf`);
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
                title={`仕訳帳  ${dateFrom} ~ ${dateTo}`}
                size="md"
            >
                <div className="space-y-6">
                    {/* 统计信息卡片 */}
                    <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
                            <BookOpen className="w-7 h-7 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-amber-700 font-medium">{t('账目总数')}</p>
                            <p className="text-3xl font-bold text-gray-900">{data.total_count} <span className="text-base font-normal text-gray-500">{t('条')}</span></p>
                        </div>
                    </div>

                    {/* 说明文字 */}
                    <p className="text-sm text-gray-500 text-center">
                        {t('请选择导出格式下载仕訳帳文件')}
                    </p>

                    {/* 按钮区域 */}
                    <div className="flex justify-center gap-4 pt-2">
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={handleExportCSV}
                            icon={<Download className="w-5 h-5" />}
                        >
                            {t('导出 CSV')}
                        </Button>
                        <Button
                            size="lg"
                            onClick={() => setShowPDFModal(true)}
                            icon={<FileText className="w-5 h-5" />}
                        >
                            {t('导出 PDF')}
                        </Button>
                    </div>

                    {/* 关闭按钮 */}
                    <div className="flex justify-center pt-2 border-t border-gray-100">
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
                title={t('导出仕訳帳 PDF')}
                loading={pdfLoading}
            />
        </>
    );
}
