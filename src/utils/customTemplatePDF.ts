import jsPDF from 'jspdf';
import {
  Invoice,
  Client,
  Business,
  AppSettings,
  CustomTemplate,
  FieldMapping,
} from '@/store/useStore';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const ROW_HEIGHT = 7;

function pxToMm(px: number) {
  // Editor canvas is ~600px tall mapped to A4 height for preview.
  return (px / 600) * (PAGE_HEIGHT - 2 * MARGIN) + MARGIN;
}
function pxToMmX(px: number) {
  return (px / 800) * (PAGE_WIDTH - 2 * MARGIN) + MARGIN;
}

function valueFor(
  field: FieldMapping,
  invoice: Invoice | Omit<Invoice, 'id'>,
  client: Client,
  business: Business,
  settings: AppSettings,
): string {
  switch (field.fieldType) {
    case 'businessName': return business.name;
    case 'clientName': return client.name;
    case 'invoiceNumber': return invoice.invoiceNumber;
    case 'date': return new Date(invoice.createdAt).toLocaleDateString('en-US');
    case 'dueDate': return new Date(invoice.dueDate).toLocaleDateString('en-US');
    case 'subtotal': return `${client.currencySymbol}${invoice.subtotal.toFixed(2)}`;
    case 'tax': return `${client.currencySymbol}${invoice.taxTotal.toFixed(2)}`;
    case 'total': return `${client.currencySymbol}${invoice.total.toFixed(2)}`;
    case 'notes': return invoice.notes || '';
    case 'logo': return '';
    default: return '';
  }
}

function drawItemsHeader(pdf: jsPDF, x: number, y: number, w: number) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('DESCRIPTION', x + 2, y + 5);
  pdf.text('QTY', x + w * 0.55, y + 5);
  pdf.text('PRICE', x + w * 0.7, y + 5);
  pdf.text('AMOUNT', x + w - 2, y + 5, { align: 'right' });
  pdf.setDrawColor(200);
  pdf.line(x, y + 6.5, x + w, y + 6.5);
  pdf.setFont('helvetica', 'normal');
}

export async function generateCustomTemplatePDF(
  template: CustomTemplate,
  invoice: Invoice | Omit<Invoice, 'id'>,
  client: Client,
  business: Business,
  settings: AppSettings,
): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4');

  // Background image (best-effort).
  if (template.backgroundImage?.startsWith('data:image/')) {
    try {
      const fmt = template.backgroundImage.includes('jpeg') ? 'JPEG' : 'PNG';
      pdf.addImage(template.backgroundImage, fmt, 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    } catch {
      /* ignore */
    }
  }

  // Render simple fields.
  for (const field of template.fieldMappings) {
    if (field.fieldType === 'items' || field.fieldType === 'logo') continue;
    const x = pxToMmX(field.x);
    const y = pxToMm(field.y);
    pdf.setFontSize(Math.max(8, Math.min(18, field.fontSize / 2)));
    pdf.setTextColor(field.color || '#000000');
    pdf.setFont('helvetica', field.fontWeight === 'bold' ? 'bold' : 'normal');
    const text = valueFor(field, invoice, client, business, settings);
    if (text) pdf.text(text, x, y, { maxWidth: pxToMmX(field.x + field.width) - x });
  }

  // Items table — supports overflow with repeating header.
  const itemsField = template.fieldMappings.find((f) => f.fieldType === 'items');
  if (itemsField && invoice.items.length > 0) {
    const tableX = pxToMmX(itemsField.x);
    const tableW = (itemsField.width / 800) * (PAGE_WIDTH - 2 * MARGIN);
    let y = pxToMm(itemsField.y);
    drawItemsHeader(pdf, tableX, y, tableW);
    y += 9;

    for (const item of invoice.items) {
      if (y > PAGE_HEIGHT - 20) {
        pdf.addPage();
        y = MARGIN + 10;
        drawItemsHeader(pdf, tableX, y, tableW);
        y += 9;
      }
      pdf.setFontSize(9);
      pdf.setTextColor('#111111');
      pdf.text(String(item.description).slice(0, 40), tableX + 2, y);
      pdf.text(String(item.quantity), tableX + tableW * 0.55, y);
      pdf.text(
        `${client.currencySymbol}${item.price.toFixed(2)}`,
        tableX + tableW * 0.7,
        y,
      );
      pdf.text(
        `${client.currencySymbol}${(item.quantity * item.price).toFixed(2)}`,
        tableX + tableW - 2,
        y,
        { align: 'right' },
      );
      y += ROW_HEIGHT;
    }

    // Totals on last page.
    if (y > PAGE_HEIGHT - 30) {
      pdf.addPage();
      y = MARGIN + 10;
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(
      `TOTAL: ${client.currencySymbol}${invoice.total.toFixed(2)}`,
      tableX + tableW - 2,
      y + 6,
      { align: 'right' },
    );
  }

  return pdf.output('blob');
}
