import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Ledger, Transaction, TrialBalanceResponse } from '../types';

// 扩展 jsPDF 类型
declare module 'jspdf' {
    interface jsPDF {
        autoTable: typeof autoTable;
        lastAutoTable: { finalY: number };
    }
}

// 字体数据缓存
let fontJPBase64: string | null = null;
let fontSCBase64: string | null = null;
let fontLoadPromise: Promise<void> | null = null;

// 加载字体数据
async function loadFontData(): Promise<{ jp: string; sc: string }> {
    if (fontJPBase64 && fontSCBase64) {
        return { jp: fontJPBase64, sc: fontSCBase64 };
    }

    if (!fontLoadPromise) {
        fontLoadPromise = (async () => {
            try {
                const [jpResponse, scResponse] = await Promise.all([
                    fetch('/fonts/NotoSansJP-Regular.ttf'),
                    fetch('/fonts/NotoSansSC-Regular.ttf')
                ]);

                if (!jpResponse.ok || !scResponse.ok) {
                    throw new Error('Font fetch failed');
                }

                const [jpBuffer, scBuffer] = await Promise.all([
                    jpResponse.arrayBuffer(),
                    scResponse.arrayBuffer()
                ]);

                const toBase64 = (buffer: ArrayBuffer): string => {
                    const bytes = new Uint8Array(buffer);
                    let binary = '';
                    for (let i = 0; i < bytes.length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    return btoa(binary);
                };

                fontJPBase64 = toBase64(jpBuffer);
                fontSCBase64 = toBase64(scBuffer);
            } catch (error) {
                console.error('Failed to load fonts:', error);
                throw new Error('字体加载失败');
            }
        })();
    }

    await fontLoadPromise;
    return { jp: fontJPBase64!, sc: fontSCBase64! };
}

// 为 jsPDF 实例注册字体
async function registerFont(doc: jsPDF): Promise<void> {
    const fonts = await loadFontData();

    doc.addFileToVFS('NotoSansJP-Regular.ttf', fonts.jp);
    doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal');

    doc.addFileToVFS('NotoSansSC-Regular.ttf', fonts.sc);
    doc.addFont('NotoSansSC-Regular.ttf', 'NotoSansSC', 'normal');

    doc.setFont('NotoSansJP');
}

// 通用 PDF 配置
interface PDFConfig {
    title: string;
    dateRange: string;
    companyName: string;
}

// A4 横向页面尺寸
const PAGE_WIDTH = 297;  // mm
const PAGE_HEIGHT = 210; // mm
const MARGIN = 14;
const USABLE_WIDTH = PAGE_WIDTH - MARGIN * 2; // 269mm

// 创建基础 PDF 文档（A4 横向）
function createBasePDF(): jsPDF {
    return new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });
}

// 添加页眉（第一页）
function addFirstPageHeader(doc: jsPDF, config: PDFConfig): number {
    // 标题（页面居中）
    doc.setFontSize(18);
    doc.text(config.title, PAGE_WIDTH / 2, 18, { align: 'center' });

    // 日期范围（页面居中）
    doc.setFontSize(11);
    doc.text(config.dateRange, PAGE_WIDTH / 2, 26, { align: 'center' });

    // 公司名称（右边距对齐）
    if (config.companyName) {
        doc.setFontSize(10);
        doc.text(config.companyName, PAGE_WIDTH - MARGIN, 34, { align: 'right' });
    }

    return 40;
}

// 添加页眉（后续页）
function addSubsequentPageHeader(doc: jsPDF, config: PDFConfig): number {
    doc.setFontSize(10);
    doc.text(`${config.title} (${config.dateRange})`, MARGIN, 12);

    if (config.companyName) {
        doc.text(config.companyName, PAGE_WIDTH - MARGIN, 12, { align: 'right' });
    }

    return 18;
}

// 添加页脚
function addPageFooter(doc: jsPDF, config: PDFConfig, pageNumber: number, totalPages: number): void {
    doc.setFontSize(9);

    if (config.companyName) {
        doc.text(config.companyName, MARGIN, PAGE_HEIGHT - 10);
    }

    doc.text(`Page ${pageNumber} / ${totalPages}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: 'right' });
}

// 格式化金额
function formatAmount(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '';
    if (amount === 0) return '0';
    return amount.toLocaleString('ja-JP');
}

// ========================================
// 仕訳帳 PDF
// ========================================
export async function generateJournalPDF(
    transactions: Transaction[],
    companyName: string,
    dateFrom: string,
    dateTo: string
): Promise<Blob> {
    const doc = createBasePDF();
    await registerFont(doc);

    const config: PDFConfig = {
        title: '仕訳帳',
        dateRange: `${dateFrom} ~ ${dateTo}`,
        companyName
    };

    const headers = [['日付', '種類', '決済', '備考', '借方科目', '借方金額', '借方税', '貸方科目', '貸方金額', '貸方税', '税率']];

    const FIN_TYPE_MAP: Record<number, string> = {
        1: '現金',
        2: '銀行',
        3: '電子',
        4: 'クレカ',
        5: '他'
    };

    const TRANSACTION_TYPE_MAP: Record<number, string> = {
        1: '収入',
        2: '支出'
    };

    const CT_RATE_MAP: Record<number, string> = {
        0: '非課税',
        1: '8%',
        2: '10%',
        3: '混合',
        4: '他'
    };

    const body = transactions.map(t => [
        t.transaction_date?.split('T')[0] || '',
        t.transaction_type ? TRANSACTION_TYPE_MAP[t.transaction_type] || '' : '',
        t.fin_type ? FIN_TYPE_MAP[t.fin_type] || '' : '',
        t.description || '',
        t.debit_item || '',
        formatAmount(t.debit_amount),
        formatAmount(t.debit_ct),
        t.credit_item || '',
        formatAmount(t.credit_amount),
        formatAmount(t.credit_ct),
        t.ct_rate !== undefined ? CT_RATE_MAP[t.ct_rate] || '' : ''
    ]);

    let isFirstPage = true;

    autoTable(doc, {
        head: headers,
        body: body,
        startY: addFirstPageHeader(doc, config),
        showHead: 'everyPage',
        tableWidth: USABLE_WIDTH,  // 铺满页面宽度
        styles: {
            font: 'NotoSansJP',
            fontSize: 9,
            cellPadding: 2,
            overflow: 'linebreak'
        },
        headStyles: {
            fillColor: [66, 139, 202],
            textColor: 255,
            fontStyle: 'normal',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'left' },   // 日付
            1: { halign: 'left' },   // 種類
            2: { halign: 'left' },   // 決済
            3: { halign: 'left', font: 'NotoSansSC', cellWidth: 50 },  // 備考 - 给更多空间
            4: { halign: 'left' },   // 借方科目
            5: { halign: 'right' },  // 借方金額
            6: { halign: 'right' },  // 借方税
            7: { halign: 'left' },   // 貸方科目
            8: { halign: 'right' },  // 貸方金額
            9: { halign: 'right' },  // 貸方税
            10: { halign: 'left' }   // 税率
        },
        didDrawPage: () => {
            if (!isFirstPage) {
                doc.setFont('NotoSansJP');
                addSubsequentPageHeader(doc, config);
            }
            isFirstPage = false;
        },
        margin: { left: MARGIN, right: MARGIN, top: 40, bottom: 18 }
    });

    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('NotoSansJP');
        addPageFooter(doc, config, i, totalPages);
    }

    return doc.output('blob');
}

// ========================================
// 試算表 PDF
// ========================================
export async function generateTrialBalancePDF(
    data: TrialBalanceResponse,
    companyName: string,
    dateFrom: string,
    dateTo: string
): Promise<Blob> {
    const doc = createBasePDF();
    await registerFont(doc);

    const config: PDFConfig = {
        title: '試算表',
        dateRange: `${dateFrom} ~ ${dateTo}`,
        companyName
    };

    const headers = [['借方残高', '借方合計', '勘定科目', '貸方合計', '貸方残高']];

    const body = data.entries.map(entry => [
        formatAmount(entry.借方残高),
        formatAmount(entry.借方合計),
        entry.勘定科目,
        formatAmount(entry.貸方合計),
        formatAmount(entry.貸方残高)
    ]);

    body.push([
        formatAmount(data.summary.借方残高),
        formatAmount(data.summary.借方合計),
        '合計',
        formatAmount(data.summary.貸方合計),
        formatAmount(data.summary.貸方残高)
    ]);

    let isFirstPage = true;

    autoTable(doc, {
        head: headers,
        body: body,
        startY: addFirstPageHeader(doc, config),
        showHead: 'everyPage',
        tableWidth: USABLE_WIDTH,  // 铺满页面宽度
        styles: {
            font: 'NotoSansJP',
            fontSize: 11,
            cellPadding: 3
        },
        headStyles: {
            fillColor: [66, 139, 202],
            textColor: 255,
            fontStyle: 'normal',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'right' },
            1: { halign: 'right' },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' }
        },
        didDrawPage: () => {
            if (!isFirstPage) {
                doc.setFont('NotoSansJP');
                addSubsequentPageHeader(doc, config);
            }
            isFirstPage = false;
        },
        margin: { left: MARGIN, right: MARGIN, top: 40, bottom: 18 }
    });

    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('NotoSansJP');
        addPageFooter(doc, config, i, totalPages);
    }

    return doc.output('blob');
}

// ========================================
// 総勘定元帳 PDF
// ========================================
export async function generateLedgerPDF(
    ledger: Ledger,
    companyName: string,
    dateFrom: string,
    dateTo: string
): Promise<Blob> {
    const doc = createBasePDF();
    await registerFont(doc);

    const config: PDFConfig = {
        title: `総勘定元帳 - ${ledger.勘定科目}`,
        dateRange: `${dateFrom} ~ ${dateTo}`,
        companyName
    };

    const headers = [['日付', '相手勘定科目', '摘要', '借方金額', '貸方金額', '残高']];

    const body = ledger.entries.map(entry => [
        entry.年月日,
        entry.相手勘定科目,
        entry.摘要 || '',
        formatAmount(entry.借方金額),
        formatAmount(entry.貸方金額),
        formatAmount(entry.残高)
    ]);

    body.push([
        '',
        '',
        '合計',
        formatAmount(ledger.summary.借方合計),
        formatAmount(ledger.summary.貸方合計),
        formatAmount(ledger.summary.残高)
    ]);

    let isFirstPage = true;

    autoTable(doc, {
        head: headers,
        body: body,
        startY: addFirstPageHeader(doc, config),
        showHead: 'everyPage',
        tableWidth: USABLE_WIDTH,  // 铺满页面宽度
        styles: {
            font: 'NotoSansJP',
            fontSize: 10,
            cellPadding: 2.5,
            overflow: 'linebreak'
        },
        headStyles: {
            fillColor: [66, 139, 202],
            textColor: 255,
            fontStyle: 'normal',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'left' },
            2: { halign: 'left', font: 'NotoSansSC', cellWidth: 100 },  // 摘要给更多空间
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' }
        },
        didDrawPage: () => {
            if (!isFirstPage) {
                doc.setFont('NotoSansJP');
                addSubsequentPageHeader(doc, config);
            }
            isFirstPage = false;
        },
        margin: { left: MARGIN, right: MARGIN, top: 40, bottom: 18 }
    });

    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('NotoSansJP');
        addPageFooter(doc, config, i, totalPages);
    }

    return doc.output('blob');
}
