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

const KNOWN_FIELD_TYPES = new Set<FieldMapping['fieldType']>([
  'businessName',
  'clientName',
  'invoiceNumber',
  'date',
  'dueDate',
  'items',
  'subtotal',
  'tax',
  'total',
  'notes',
  'logo',
]);

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

/**
 * Validates a field mapping for required, finite numeric inputs and known
 * field types. Returns false (skip) for anything malformed so we never emit
 * placeholders like NaN/undefined into the PDF.
 */
function isValidField(field: FieldMapping | undefined | null): field is FieldMapping {
  if (!field) return false;
  if (!KNOWN_FIELD_TYPES.has(field.fieldType as FieldMapping['fieldType'])) return false;
  if (!isFiniteNumber(field.x) || !isFiniteNumber(field.y)) return false;
  if (!isFiniteNumber(field.width) || !isFiniteNumber(field.height)) return false;
  if (field.x < 0 || field.y < 0 || field.width <= 0 || field.height <= 0) return false;
  if (!isFiniteNumber(field.fontSize) || field.fontSize <= 0) return false;
  return true;
}

export class TemplateMappingError extends Error {
  issues: string[];
  constructor(issues: string[]) {
    super(issues[0] ?? 'Invalid template mapping');
    this.issues = issues;
    this.name = 'TemplateMappingError';
  }
}

export interface TemplateValidationResult {
  ok: boolean;
  issues: string[];
}

/**
 * Validates a CustomTemplate's mappings BEFORE PDF generation. Returns a
 * list of human-readable issues so the editor can surface them inline and
 * refuse to generate a malformed PDF.
 */
export function validateTemplateMapping(
  template: Pick<CustomTemplate, 'fieldMappings' | 'backgroundImage' | 'name'>,
): TemplateValidationResult {
  const issues: string[] = [];
  if (!template) {
    return { ok: false, issues: ['Template is missing.'] };
  }
  if (!template.backgroundImage || !/^data:image\//.test(template.backgroundImage)) {
    issues.push('Background image is missing or invalid.');
  }
  if (!Array.isArray(template.fieldMappings) || template.fieldMappings.length === 0) {
    issues.push('At least one field must be mapped.');
    return { ok: false, issues };
  }

  const required: FieldMapping['fieldType'][] = ['businessName', 'clientName', 'invoiceNumber', 'total', 'items'];
  const present = new Set(template.fieldMappings.map((f) => f.fieldType));
  for (const r of required) {
    if (!present.has(r)) issues.push(`Required field "${r}" is not mapped.`);
  }

  template.fieldMappings.forEach((f, i) => {
    if (!f || typeof f !== 'object') {
      issues.push(`Field #${i + 1} is not an object.`);
      return;
    }
    if (!KNOWN_FIELD_TYPES.has(f.fieldType as FieldMapping['fieldType'])) {
      issues.push(`Field #${i + 1} has unknown type "${String(f.fieldType)}".`);
    }
    for (const key of ['x', 'y', 'width', 'height', 'fontSize'] as const) {
      const v = (f as any)[key];
      if (typeof v !== 'number' || !Number.isFinite(v)) {
        issues.push(`Field "${f.fieldType}" has non-numeric ${key}.`);
      }
    }
    if (isFiniteNumber(f.width) && f.width <= 0) issues.push(`Field "${f.fieldType}" has non-positive width.`);
    if (isFiniteNumber(f.height) && f.height <= 0) issues.push(`Field "${f.fieldType}" has non-positive height.`);
    if (isFiniteNumber(f.x) && f.x < 0) issues.push(`Field "${f.fieldType}" has negative x.`);
    if (isFiniteNumber(f.y) && f.y < 0) issues.push(`Field "${f.fieldType}" has negative y.`);
    if (typeof f.color !== 'string' || !/^#?[0-9a-fA-F]{3,8}$/.test(f.color)) {
      issues.push(`Field "${f.fieldType}" has invalid color.`);
    }
  });

  return { ok: issues.length === 0, issues };
}

function pxToMm(px: number) {
  return (px / 600) * (PAGE_HEIGHT - 2 * MARGIN) + MARGIN;
}
function pxToMmX(px: number) {
  return (px / 800) * (PAGE_WIDTH - 2 * MARGIN) + MARGIN;
}

function safe(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s === 'NaN' || s === 'undefined' || s === 'null') return '';
  return s;
}

function valueFor(
  field: FieldMapping,
  invoice: Invoice | Omit<Invoice, 'id'>,
  client: Client,
  business: Business,
  _settings: AppSettings,
): string {
  const sym = safe(client.currencySymbol);
  const num = (n: unknown) => (isFiniteNumber(n) ? (n as number).toFixed(2) : '');
  switch (field.fieldType) {
    case 'businessName': return safe(business?.name);
    case 'clientName': return safe(client?.name);
    case 'invoiceNumber': return safe(invoice.invoiceNumber);
    case 'date': {
      const d = new Date(invoice.createdAt);
      return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US');
    }
    case 'dueDate': {
      const d = new Date(invoice.dueDate);
      return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US');
    }
    case 'subtotal': return num(invoice.subtotal) ? `${sym}${num(invoice.subtotal)}` : '';
    case 'tax': return num(invoice.taxTotal) ? `${sym}${num(invoice.taxTotal)}` : '';
    case 'total': return num(invoice.total) ? `${sym}${num(invoice.total)}` : '';
    case 'notes': return safe(invoice.notes);
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

function drawBackground(pdf: jsPDF, bg?: string) {
  if (!bg || !bg.startsWith('data:image/')) return;
  try {
    const fmt = bg.includes('jpeg') ? 'JPEG' : 'PNG';
    pdf.addImage(bg, fmt, 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  } catch {
    /* ignore */
  }
}

function drawSimpleFields(
  pdf: jsPDF,
  template: CustomTemplate,
  invoice: Invoice | Omit<Invoice, 'id'>,
  client: Client,
  business: Business,
  settings: AppSettings,
) {
  for (const field of template.fieldMappings) {
    if (!isValidField(field)) continue;
    if (field.fieldType === 'items' || field.fieldType === 'logo') continue;
    const text = valueFor(field, invoice, client, business, settings);
    if (!text) continue;
    const x = pxToMmX(field.x);
    const y = pxToMm(field.y);
    pdf.setFontSize(Math.max(8, Math.min(18, field.fontSize / 2)));
    pdf.setTextColor(field.color || '#000000');
    pdf.setFont('helvetica', field.fontWeight === 'bold' ? 'bold' : 'normal');
    pdf.text(text, x, y, { maxWidth: pxToMmX(field.x + field.width) - x });
  }
}

export interface GenerateCustomTemplateOptions {
  /** When true, refuse to generate a PDF for invalid mappings (throws TemplateMappingError). */
  strict?: boolean;
}

export async function generateCustomTemplatePDF(
  template: CustomTemplate,
  invoice: Invoice | Omit<Invoice, 'id'>,
  client: Client,
  business: Business,
  settings: AppSettings,
  options: GenerateCustomTemplateOptions = {},
): Promise<Blob> {
  if (options.strict) {
    const v = validateTemplateMapping(template ?? ({} as CustomTemplate));
    if (!v.ok) throw new TemplateMappingError(v.issues);
  }
  if (!template || !Array.isArray(template.fieldMappings)) {
    // Graceful: produce an empty but valid PDF rather than throwing.
    const pdf = new jsPDF('p', 'mm', 'a4');
    return pdf.output('blob');
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  drawBackground(pdf, template.backgroundImage);
  drawSimpleFields(pdf, template, invoice, client, business, settings);

  const itemsField = template.fieldMappings.find(
    (f) => isValidField(f) && f.fieldType === 'items',
  );
  if (itemsField && Array.isArray(invoice.items) && invoice.items.length > 0) {
    const tableX = pxToMmX(itemsField.x);
    const tableW = (itemsField.width / 800) * (PAGE_WIDTH - 2 * MARGIN);
    let y = pxToMm(itemsField.y);
    drawItemsHeader(pdf, tableX, y, tableW);
    y += 9;

    for (const item of invoice.items) {
      if (y > PAGE_HEIGHT - 20) {
        pdf.addPage();
        drawBackground(pdf, template.backgroundImage);
        // Repeat all mapped fields (totals, notes, invoiceNumber, etc.) on overflow.
        drawSimpleFields(pdf, template, invoice, client, business, settings);
        y = MARGIN + 10;
        drawItemsHeader(pdf, tableX, y, tableW);
        y += 9;
      }
      pdf.setFontSize(9);
      pdf.setTextColor('#111111');
      const desc = safe(item?.description).slice(0, 40);
      const qty = isFiniteNumber(item?.quantity) ? String(item.quantity) : '';
      const price = isFiniteNumber(item?.price) ? `${safe(client.currencySymbol)}${item.price.toFixed(2)}` : '';
      const amount =
        isFiniteNumber(item?.quantity) && isFiniteNumber(item?.price)
          ? `${safe(client.currencySymbol)}${(item.quantity * item.price).toFixed(2)}`
          : '';
      if (desc) pdf.text(desc, tableX + 2, y);
      if (qty) pdf.text(qty, tableX + tableW * 0.55, y);
      if (price) pdf.text(price, tableX + tableW * 0.7, y);
      if (amount) pdf.text(amount, tableX + tableW - 2, y, { align: 'right' });
      y += ROW_HEIGHT;
    }

    if (y > PAGE_HEIGHT - 30) {
      pdf.addPage();
      drawBackground(pdf, template.backgroundImage);
      drawSimpleFields(pdf, template, invoice, client, business, settings);
      y = MARGIN + 10;
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    const totalStr = isFiniteNumber(invoice.total)
      ? `TOTAL: ${safe(client.currencySymbol)}${invoice.total.toFixed(2)}`
      : '';
    if (totalStr) pdf.text(totalStr, tableX + tableW - 2, y + 6, { align: 'right' });
  }

  return pdf.output('blob');
}
