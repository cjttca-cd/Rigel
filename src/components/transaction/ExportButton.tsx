import { Download } from 'lucide-react';
import type { Transaction } from '../../types';
import { CT_RATE_LABELS_JP, FIN_TYPE_LABELS_JP, TRANSACTION_TYPE_LABELS_JP } from '../../types';
import { Button } from '../ui/Button';

interface ExportButtonProps {
    transactions: Transaction[];
    selectedIds: string[];
    disabled?: boolean;
}

export function ExportButton({ transactions, selectedIds, disabled = false }: ExportButtonProps) {
    const handleExport = () => {
        // Filter selected transactions
        const dataToExport = selectedIds.length > 0
            ? transactions.filter(t => selectedIds.includes(t.id))
            : transactions;

        if (dataToExport.length === 0) return;

        // Define CSV headers - 使用日文表示
        const headers = [
            '日付',
            '種類',           // transaction_type
            '決済方法',       // fin_type
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

        // Convert transactions to CSV rows - 使用日文标签
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
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `仕訳帳_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Button
            variant="secondary"
            onClick={handleExport}
            disabled={disabled}
            icon={<Download className="w-4 h-4" />}
        >
            导出
        </Button>
    );
}
