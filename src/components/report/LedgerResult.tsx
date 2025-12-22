import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { Download, Package } from 'lucide-react';
import type { Ledger, LedgerResponse } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface LedgerResultProps {
    isOpen: boolean;
    onClose: () => void;
    data: LedgerResponse;
    dateFrom: string;
    dateTo: string;
}

export function LedgerResult({ isOpen, onClose, data, dateFrom, dateTo }: LedgerResultProps) {
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

    // 导出单个科目
    const handleExportSingle = (ledger: Ledger) => {
        const csvContent = generateLedgerCSV(ledger);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `総勘定元帳_${ledger.勘定科目}_${dateFrom}_${dateTo}.csv`);
    };

    // 导出全部（ZIP）
    const handleExportAll = async () => {
        const zip = new JSZip();

        data.ledgers.forEach(ledger => {
            const csvContent = generateLedgerCSV(ledger);
            zip.file(`総勘定元帳_${ledger.勘定科目}_${dateFrom}_${dateTo}.csv`, csvContent);
        });

        const blob = await zip.generateAsync({ type: 'blob' });
        saveAs(blob, `総勘定元帳_${dateFrom}_${dateTo}.zip`);
    };

    // 格式化金额
    const formatAmount = (amount: number | undefined): string => {
        if (amount === undefined || amount === 0) return '-';
        return `¥${amount.toLocaleString()}`;
    };

    return (
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
                                <th className="px-4 py-3 text-center font-medium text-gray-700">操作</th>
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
                                        <button
                                            onClick={() => handleExportSingle(ledger)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            导出
                                        </button>
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
                        onClick={handleExportAll}
                        icon={<Package className="w-4 h-4" />}
                    >
                        全部导出(ZIP)
                    </Button>
                    <Button variant="ghost" onClick={onClose}>
                        关闭
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
