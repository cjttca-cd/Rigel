import { AlertTriangle } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { Button } from './Button';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'primary' | 'danger';
    loading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    variant = 'primary',
    loading = false
}: ConfirmDialogProps) {
    const { t } = useI18n();
    const finalConfirmText = confirmText ?? t('确认');
    const finalCancelText = cancelText ?? t('取消');
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* 背景遮罩 */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity animate-fade-in"
                onClick={onClose}
            />

            {/* 对话框 */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-scale-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 图标 */}
                    <div className={`
                        w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center
                        ${variant === 'danger' ? 'bg-red-100' : 'bg-sky-100'}
                    `}>
                        <AlertTriangle
                            className={`w-6 h-6 ${variant === 'danger' ? 'text-red-600' : 'text-sky-600'}`}
                        />
                    </div>

                    {/* 标题 */}
                    <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                        {title}
                    </h3>

                    {/* 消息 */}
                    <p className="text-gray-600 text-center mb-6">
                        {message}
                    </p>

                    {/* 按钮 */}
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading}
                            fullWidth
                        >
                            {finalCancelText}
                        </Button>
                        <Button
                            variant={variant === 'danger' ? 'danger' : 'primary'}
                            onClick={onConfirm}
                            loading={loading}
                            fullWidth
                        >
                            {finalConfirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
