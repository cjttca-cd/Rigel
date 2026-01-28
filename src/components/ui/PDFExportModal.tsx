import { FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

const COMPANY_NAME_STORAGE_KEY = 'pdf_export_company_name';

interface PDFExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (companyName: string) => void;
    title: string;
    loading?: boolean;
}

export function PDFExportModal({
    isOpen,
    onClose,
    onExport,
    title,
    loading = false
}: PDFExportModalProps) {
    const { t } = useI18n();
    const [companyName, setCompanyName] = useState('');

    // 从 localStorage 恢复上次输入的公司名
    useEffect(() => {
        if (isOpen) {
            const saved = localStorage.getItem(COMPANY_NAME_STORAGE_KEY);
            if (saved) {
                setCompanyName(saved);
            }
        }
    }, [isOpen]);

    const handleExport = () => {
        // 保存公司名到 localStorage
        if (companyName.trim()) {
            localStorage.setItem(COMPANY_NAME_STORAGE_KEY, companyName.trim());
        }
        onExport(companyName.trim());
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
        >
            <div className="space-y-4">
                <Input
                    label={t('公司名称')}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={t('例：株式会社 ○○○')}
                />
                <p className="text-xs text-gray-500">
                    {t('公司名称将显示在 PDF 的页眉和页脚中。留空也可以导出。')}
                </p>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        {t('取消')}
                    </Button>
                    <Button
                        onClick={handleExport}
                        loading={loading}
                        icon={<FileText className="w-4 h-4" />}
>
                        {t('导出 PDF')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
