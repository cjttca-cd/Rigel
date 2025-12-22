import { saveAs } from 'file-saver';
import { Download } from 'lucide-react';
import type { TrialBalanceResponse } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface TrialBalanceResultProps {
    isOpen: boolean;
    onClose: () => void;
    data: TrialBalanceResponse;
    dateFrom: string;
    dateTo: string;
}

export function TrialBalanceResult({ isOpen, onClose, data, dateFrom, dateTo }: TrialBalanceResultProps) {
    // 格式化金额
    const formatAmount = (amount: number | undefined): string => {
        if (amount === undefined || amount === 0) return '-';
        return `¥${amount.toLocaleString()}`;
    };

    // 导出 CSV
    const handleExport = () => {
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

    return (
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
                                <th className="px-4 py-3 text-right font-medium text-gray-700">借方残高</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">借方合計</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-700">勘定科目</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">貸方合計</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">貸方残高</th>
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
                                    合計
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
                        onClick={handleExport}
                        icon={<Download className="w-4 h-4" />}
                    >
                        导出CSV
                    </Button>
                    <Button variant="ghost" onClick={onClose}>
                        关闭
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
