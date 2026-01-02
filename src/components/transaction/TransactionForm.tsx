import { Camera, Loader2, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ocrReceipt } from '../../services/api';
import type { OCRResult, TransactionInput, TransactionUpdate } from '../../types';
import { Button } from '../ui/Button';
import { ImageCropper } from '../ui/ImageCropper';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface TransactionFormProps {
    mode: 'create' | 'edit';
    initialData?: TransactionUpdate;
    onSubmit: (data: TransactionInput | TransactionUpdate) => void;
    onCancel: () => void;
    loading?: boolean;
}

const AMOUNT_TYPE_OPTIONS = [
    { value: 1, label: '收入' },
    { value: 2, label: '支出' }
];

const TAX_TYPE_OPTIONS = [
    { value: 1, label: '非课税' },
    { value: 2, label: '课税' }
];

const TAX_RATE_OPTIONS = [
    { value: 1, label: '8%' },
    { value: 2, label: '10%' },
    { value: 3, label: '8%10%混合' },
    { value: 4, label: '其他' }
];

const FIN_TYPE_OPTIONS = [
    { value: 1, label: '现金' },
    { value: 2, label: '银行账户' },
    { value: 3, label: '电子支付' },
    { value: 4, label: '个人信用卡' },
    { value: 5, label: '公司信用卡' }
];

// 字段标签映射
const FIELD_LABELS: Record<string, string> = {
    transaction_date: '发生日期',
    amount_total: '金额',
    fin_type: '支付方式',
    tax_type: '税务类型',
    tax_rate: '税率',
    tax_amount: '税额'
};

// 格式化显示值
const formatDisplayValue = (field: string, value: unknown): string => {
    if (value === null || value === undefined) return '-';

    switch (field) {
        case 'amount_total':
        case 'tax_amount':
            return `¥${(value as number).toLocaleString()}`;
        case 'fin_type':
            return FIN_TYPE_OPTIONS.find(o => o.value === value)?.label || '-';
        case 'tax_type':
            return TAX_TYPE_OPTIONS.find(o => o.value === value)?.label || '-';
        case 'tax_rate':
            return TAX_RATE_OPTIONS.find(o => o.value === value)?.label || '-';
        default:
            return String(value);
    }
};

interface OcrChange {
    field: string;
    oldValue: unknown;
    newValue: unknown;
}

export function TransactionForm({
    mode,
    initialData,
    onSubmit,
    onCancel,
    loading = false
}: TransactionFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 初始值全部设为空/undefined
    const [formData, setFormData] = useState({
        transaction_date: '',
        description: '',
        amount_total: 0,
        amount_type: undefined as 1 | 2 | undefined,
        fin_type: undefined as 1 | 2 | 3 | 4 | 5 | undefined,
        tax_type: undefined as 1 | 2 | undefined,
        tax_rate: undefined as 1 | 2 | 3 | 4 | undefined,
        tax_amount: undefined as number | undefined,
        debit_item: '',
        credit_item: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isInitialized, setIsInitialized] = useState(false);

    // OCR 相关状态
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrError, setOcrError] = useState<string | null>(null);

    // 编辑模式 OCR 确认弹窗
    const [showOcrConfirm, setShowOcrConfirm] = useState(false);
    const [ocrChanges, setOcrChanges] = useState<OcrChange[]>([]);
    const [pendingOcrResult, setPendingOcrResult] = useState<OCRResult | null>(null);

    // Initialize form with existing data
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                transaction_date: initialData.transaction_date?.split('T')[0] || '',
                description: initialData.description || '',
                amount_total: initialData.amount_total || 0,
                amount_type: initialData.amount_type,
                fin_type: initialData.fin_type,
                tax_type: initialData.tax_type,
                tax_rate: initialData.tax_rate,
                tax_amount: initialData.tax_amount,
                debit_item: initialData.debit_item || '',
                credit_item: initialData.credit_item || ''
            });
            setIsInitialized(true);
        }
    }, [mode, initialData]);

    // Auto-calculate tax amount
    useEffect(() => {
        if (mode === 'edit' && !isInitialized) {
            return;
        }

        if (formData.tax_type === 2 && formData.tax_rate && formData.tax_rate !== 3 && formData.tax_rate !== 4 && formData.amount_total > 0) {
            const rate = formData.tax_rate === 1 ? 0.08 : 0.1;
            const taxAmount = Math.round(formData.amount_total * rate / (1 + rate));
            setFormData(prev => ({ ...prev, tax_amount: taxAmount }));
        } else if (formData.tax_type === 1) {
            setFormData(prev => ({ ...prev, tax_amount: undefined, tax_rate: undefined }));
        }
    }, [formData.amount_total, formData.tax_type, formData.tax_rate, mode, isInitialized]);

    // 检查表单是否可以提交
    const isFormValid = (): boolean => {
        if (!formData.transaction_date) return false;
        if (!formData.description.trim()) return false;
        if (formData.amount_total <= 0) return false;
        if (!formData.amount_type) return false;
        if (!formData.fin_type) return false;
        if (!formData.tax_type) return false;

        if (formData.tax_type === 2) {
            if (!formData.tax_rate) return false;
            if ((formData.tax_rate === 3 || formData.tax_rate === 4)) {
                if (!formData.tax_amount || formData.tax_amount <= 0) return false;
            }
        }

        // 编辑模式：如果原来有科目，不能清空
        if (mode === 'edit' && initialData) {
            if (initialData.debit_item && !formData.debit_item?.trim()) return false;
            if (initialData.credit_item && !formData.credit_item?.trim()) return false;
        }

        return true;
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.transaction_date) {
            newErrors.transaction_date = '请选择发生日期';
        }

        if (!formData.description.trim()) {
            newErrors.description = '请输入概述';
        }

        if (formData.amount_total <= 0) {
            newErrors.amount_total = '金额必须大于0';
        }

        if (!formData.amount_type) {
            newErrors.amount_type = '请选择类型';
        }

        if (!formData.fin_type) {
            newErrors.fin_type = '请选择支付方式';
        }

        if (!formData.tax_type) {
            newErrors.tax_type = '请选择税务类型';
        }

        if (formData.tax_type === 2 && !formData.tax_rate) {
            newErrors.tax_rate = '请选择税率';
        }

        if (formData.tax_type === 2 && (formData.tax_rate === 3 || formData.tax_rate === 4)) {
            if (!formData.tax_amount || formData.tax_amount <= 0) {
                newErrors.tax_amount = '该税率时必须输入税额';
            }
        }

        // 编辑模式：如果原来有科目，不能清空
        if (mode === 'edit' && initialData) {
            if (initialData.debit_item && !formData.debit_item?.trim()) {
                newErrors.debit_item = '借方科目不能清空';
            }
            if (initialData.credit_item && !formData.credit_item?.trim()) {
                newErrors.credit_item = '贷方科目不能清空';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const submitData: TransactionInput | TransactionUpdate = {
            transaction_date: formData.transaction_date,
            description: formData.description,
            amount_total: formData.amount_total,
            amount_type: formData.amount_type!,
            fin_type: formData.fin_type!,
            tax_type: formData.tax_type!,
            tax_rate: formData.tax_type === 2 ? formData.tax_rate : undefined,
            tax_amount: formData.tax_type === 2 ? formData.tax_amount : undefined
        };

        if (mode === 'edit' && initialData) {
            (submitData as TransactionUpdate).id = initialData.id;
            (submitData as TransactionUpdate).status = initialData.status;  // 发送当前状态给 webhook
            (submitData as TransactionUpdate).debit_item = formData.debit_item || undefined;
            (submitData as TransactionUpdate).credit_item = formData.credit_item || undefined;
        }

        onSubmit(submitData);
    };

    const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // OCR 相关函数
    const handleOcrButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setShowCropper(true);
            setOcrError(null);
        }
        e.target.value = '';
    };

    // 应用 OCR 结果到表单
    const applyOcrResult = (result: OCRResult) => {
        setFormData(prev => ({
            ...prev,
            // 只有 n8n 返回非 null 的值才填入
            transaction_date: result.transaction_date ?? prev.transaction_date,
            amount_total: result.amount_total ?? prev.amount_total,
            fin_type: result.fin_type ?? prev.fin_type,
            tax_type: result.tax_type ?? prev.tax_type,
            tax_rate: result.tax_rate ?? prev.tax_rate,
            tax_amount: result.tax_amount ?? prev.tax_amount
        }));
    };

    // 计算需要确认的变更
    const calculateChanges = (result: OCRResult): OcrChange[] => {
        const changes: OcrChange[] = [];
        const fieldsToCheck: (keyof OCRResult)[] = [
            'transaction_date', 'amount_total', 'fin_type',
            'tax_type', 'tax_rate', 'tax_amount'
        ];

        for (const field of fieldsToCheck) {
            const newValue = result[field];
            const oldValue = formData[field as keyof typeof formData];

            // 只有当 n8n 返回有效值（非 null）且与当前值不同时才记录
            if (newValue !== null && newValue !== undefined && newValue !== oldValue) {
                changes.push({ field, oldValue, newValue });
            }
        }

        return changes;
    };

    const handleCropConfirm = async (croppedImageBase64: string) => {
        setShowCropper(false);
        setSelectedFile(null);
        setOcrLoading(true);
        setOcrError(null);

        try {
            const response = await ocrReceipt(croppedImageBase64);

            if (response.status === 'successed' && response.detail) {
                const result = response.detail;

                if (mode === 'create') {
                    // 新增模式：直接填入
                    applyOcrResult(result);
                } else {
                    // 编辑模式：检查是否有变更需要确认
                    const changes = calculateChanges(result);

                    if (changes.length > 0) {
                        // 有变更，显示确认弹窗
                        setOcrChanges(changes);
                        setPendingOcrResult(result);
                        setShowOcrConfirm(true);
                    } else {
                        // 没有变更（或所有值都相同/null）
                        setOcrError('识别结果与当前数据相同，无需更新');
                    }
                }
            } else {
                setOcrError(response.message || '识别失败，请手动输入');
            }
        } catch (error) {
            console.error('OCR error:', error);
            setOcrError('识别失败，请手动输入');
        } finally {
            setOcrLoading(false);
        }
    };

    const handleCropCancel = () => {
        setShowCropper(false);
        setSelectedFile(null);
    };

    // 确认 OCR 变更
    const handleOcrConfirm = () => {
        if (pendingOcrResult) {
            applyOcrResult(pendingOcrResult);
        }
        setShowOcrConfirm(false);
        setPendingOcrResult(null);
        setOcrChanges([]);
    };

    // 取消 OCR 变更
    const handleOcrConfirmCancel = () => {
        setShowOcrConfirm(false);
        setPendingOcrResult(null);
        setOcrChanges([]);
    };

    const needsManualTaxAmount = formData.tax_type === 2 && (formData.tax_rate === 3 || formData.tax_rate === 4);

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. 概述（最上面，2行高度） */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        概述（可指定仕訳項目）
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        rows={2}
                        className={`
                            w-full px-4 py-3 bg-white text-gray-900 border rounded-lg resize-none
                            placeholder:text-gray-400 transition-all duration-200
                            focus:outline-none focus:ring-2
                            ${errors.description
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                : 'border-gray-300 focus:border-sky-500 focus:ring-sky-500/20'
                            }
                        `}
                        placeholder="请输入账目概述"
                    />
                    {errors.description && (
                        <p className="mt-2 text-sm text-red-500">{errors.description}</p>
                    )}
                </div>

                {/* 2. 类型 + AI识图按钮 */}
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="类型"
                        value={formData.amount_type ?? ''}
                        onChange={(e) => updateField('amount_type', e.target.value ? Number(e.target.value) as 1 | 2 : undefined)}
                        options={AMOUNT_TYPE_OPTIONS}
                        placeholder="请选择"
                        error={errors.amount_type}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            AI识图
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={handleOcrButtonClick}
                            disabled={ocrLoading}
                            className={`
                                w-full px-4 py-3 rounded-lg border-2 border-dashed
                                flex items-center justify-center gap-3
                                transition-all duration-200
                                ${ocrLoading
                                    ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-sky-50 to-violet-50 border-sky-300 text-sky-600 hover:from-sky-100 hover:to-violet-100 hover:border-sky-400'
                                }
                            `}
                            title="拍照或选择图片进行AI识别"
                        >
                            {ocrLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <Camera className="w-6 h-6" />
                                    <Sparkles className="w-5 h-5" />
                                </>
                            )}
                        </button>
                        {ocrError && (
                            <p className="mt-2 text-sm text-red-500">{ocrError}</p>
                        )}
                    </div>
                </div>

                {/* 3. 发生日期 + 金额 */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="w-full overflow-hidden">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            发生日期
                        </label>
                        <input
                            type="date"
                            value={formData.transaction_date}
                            onChange={(e) => updateField('transaction_date', e.target.value)}
                            min="1900-01-01"
                            max="9999-12-31"
                            style={{ boxSizing: 'border-box', minWidth: 0 }}
                            className={`
                                w-full max-w-full px-4 py-3 bg-white text-gray-900 border rounded-lg
                                transition-all duration-200
                                focus:outline-none focus:ring-2
                                ${errors.transaction_date
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                    : 'border-gray-300 focus:border-sky-500 focus:ring-sky-500/20'
                                }
                            `}
                        />
                        {errors.transaction_date && (
                            <p className="mt-2 text-sm text-red-500">{errors.transaction_date}</p>
                        )}
                    </div>

                    <Input
                        label="金额"
                        type="number"
                        min={0}
                        step={1}
                        value={formData.amount_total || ''}
                        onChange={(e) => updateField('amount_total', Number(e.target.value))}
                        error={errors.amount_total}
                    />
                </div>

                {/* 4. 支付/收款方式 + 税务类型 */}
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="支付/收款方式"
                        value={formData.fin_type ?? ''}
                        onChange={(e) => updateField('fin_type', e.target.value ? Number(e.target.value) as 1 | 2 | 3 | 4 | 5 : undefined)}
                        options={FIN_TYPE_OPTIONS}
                        placeholder="请选择"
                        error={errors.fin_type}
                    />

                    <Select
                        label="税务类型"
                        value={formData.tax_type ?? ''}
                        onChange={(e) => updateField('tax_type', e.target.value ? Number(e.target.value) as 1 | 2 : undefined)}
                        options={TAX_TYPE_OPTIONS}
                        placeholder="请选择"
                        error={errors.tax_type}
                    />
                </div>

                {/* 5. 税率 + 总课税额（课税时显示，同一行） */}
                {formData.tax_type === 2 && (
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="税率"
                            value={formData.tax_rate || ''}
                            onChange={(e) => updateField('tax_rate', Number(e.target.value) as 1 | 2 | 3)}
                            options={TAX_RATE_OPTIONS}
                            placeholder="请选择税率"
                            error={errors.tax_rate}
                        />

                        {/* 混合税率或其他时显示总课税额输入框 */}
                        {needsManualTaxAmount ? (
                            <Input
                                label="总课税额"
                                type="number"
                                min={0}
                                step={1}
                                value={formData.tax_amount || ''}
                                onChange={(e) => updateField('tax_amount', Number(e.target.value) || undefined)}
                                error={errors.tax_amount}
                            />
                        ) : (
                            <div /> /* 占位，保持布局 */
                        )}
                    </div>
                )}

                {/* 自动计算的税额显示 */}
                {formData.tax_type === 2 && formData.tax_rate && formData.tax_rate !== 3 && formData.tax_rate !== 4 && formData.tax_amount !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">
                            预估税额: <span className="font-semibold text-gray-900">¥{formData.tax_amount.toLocaleString()}</span>
                        </p>
                    </div>
                )}

                {/* 编辑模式下显示科目 */}
                {mode === 'edit' && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                        <Input
                            label="借方科目"
                            value={formData.debit_item}
                            onChange={(e) => updateField('debit_item', e.target.value)}
                            placeholder={initialData?.debit_item ? '不可清空' : '可为空'}
                            error={errors.debit_item}
                        />

                        <Input
                            label="貸方科目"
                            value={formData.credit_item}
                            onChange={(e) => updateField('credit_item', e.target.value)}
                            placeholder={initialData?.credit_item ? '不可清空' : '可为空'}
                            error={errors.credit_item}
                        />
                    </div>
                )}

                {/* 按钮 */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        取消
                    </Button>
                    <Button
                        type="submit"
                        loading={loading}
                        disabled={!isFormValid()}
                    >
                        {mode === 'create' ? '创建' : '保存'}
                    </Button>
                </div>
            </form>

            {/* 图片裁剪弹窗 */}
            {showCropper && selectedFile && (
                <ImageCropper
                    file={selectedFile}
                    onConfirm={handleCropConfirm}
                    onCancel={handleCropCancel}
                />
            )}

            {/* 编辑模式 OCR 确认弹窗 */}
            {showOcrConfirm && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div
                        className="fixed inset-0 bg-black/50 transition-opacity"
                        onClick={handleOcrConfirmCancel}
                    />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                识别结果确认
                            </h3>

                            <p className="text-sm text-gray-600 mb-4">
                                以下字段将被更新：
                            </p>

                            <div className="space-y-3 mb-6">
                                {ocrChanges.map((change, index) => (
                                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700">
                                            {FIELD_LABELS[change.field] || change.field}
                                        </span>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-400 line-through">
                                                {formatDisplayValue(change.field, change.oldValue)}
                                            </span>
                                            <span className="text-gray-400">→</span>
                                            <span className="text-sky-600 font-medium">
                                                {formatDisplayValue(change.field, change.newValue)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={handleOcrConfirmCancel}
                                    fullWidth
                                >
                                    取消
                                </Button>
                                <Button
                                    onClick={handleOcrConfirm}
                                    fullWidth
                                >
                                    确认更新
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
