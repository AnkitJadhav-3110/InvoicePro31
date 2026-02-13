import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Invoice, Client, Business, AppSettings } from '@/store/useStore';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 5;

interface PDFColors {
  primary: [number, number, number];
  accent: [number, number, number];
}

function getColors(template: string): PDFColors {
  switch (template) {
    case 'modern':
      return { primary: [99, 102, 241], accent: [139, 92, 246] };
    case 'corporate':
      return { primary: [37, 99, 235], accent: [59, 130, 246] };
    case 'dark':
      return { primary: [16, 185, 129], accent: [52, 211, 153] };
    case 'clean':
      return { primary: [20, 184, 166], accent: [45, 212, 191] };
    default:
      return { primary: [17, 24, 39], accent: [75, 85, 99] };
  }
}

function formatCurrency(amount: number, symbol: string) {
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

async function loadImageAsBase64(src: string): Promise<string | null> {
  if (!src) return null;
  // Already base64
  if (src.startsWith('data:image/')) return src;
  
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function getImageFormat(dataUrl: string): string {
  if (dataUrl.includes('image/png')) return 'PNG';
  if (dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')) return 'JPEG';
  if (dataUrl.includes('image/webp')) return 'PNG'; // fallback
  return 'PNG';
}

function addImageSafe(
  pdf: jsPDF,
  dataUrl: string,
  x: number,
  y: number,
  maxW: number,
  maxH: number
): { width: number; height: number } {
  try {
    const format = getImageFormat(dataUrl);
    const img = new Image();
    img.src = dataUrl;
    
    let w = maxW;
    let h = maxH;
    
    // Maintain aspect ratio
    if (img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio > maxW / maxH) {
        w = maxW;
        h = maxW / ratio;
      } else {
        h = maxH;
        w = maxH * ratio;
      }
    }
    
    pdf.addImage(dataUrl, format, x, y, w, h);
    return { width: w, height: h };
  } catch {
    return { width: 0, height: 0 };
  }
}

// Column definitions for the item table
const COL = {
  desc: { x: MARGIN + 3, w: 75 },
  qty: { x: MARGIN + 85, w: 20 },
  price: { x: MARGIN + 108, w: 25 },
  tax: { x: MARGIN + 133, w: 15 },
  amount: { x: PAGE_WIDTH - MARGIN - 3, w: 25 },
};

const TABLE_HEADER_HEIGHT = 8;
const TABLE_ROW_HEIGHT = 10;

function drawTableHeader(pdf: jsPDF, y: number, colors: PDFColors): number {
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(MARGIN, y, CONTENT_WIDTH, TABLE_HEADER_HEIGHT, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DESCRIPTION', COL.desc.x, y + 5.5);
  pdf.text('QTY', COL.qty.x + COL.qty.w / 2, y + 5.5, { align: 'center' });
  pdf.text('PRICE', COL.price.x + COL.price.w / 2, y + 5.5, { align: 'center' });
  pdf.text('TAX', COL.tax.x + COL.tax.w / 2, y + 5.5, { align: 'center' });
  pdf.text('AMOUNT', COL.amount.x, y + 5.5, { align: 'right' });
  return y + TABLE_HEADER_HEIGHT + 4;
}

function checkPageBreak(pdf: jsPDF, y: number, needed: number, colors: PDFColors): number {
  if (y + needed > PAGE_HEIGHT - 30) {
    pdf.addPage();
    let newY = MARGIN;
    // Repeat table header on new page
    newY = drawTableHeader(pdf, newY, colors);
    return newY;
  }
  return y;
}

export async function generateInvoicePDF(
  invoice: Invoice | Omit<Invoice, 'id'>,
  client: Client,
  business: Business,
  settings: AppSettings
): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const colors = getColors(invoice.template);
  const cs = settings.currencySymbol;
  let y = 0;

  // Load images
  const [logoData, signatureData] = await Promise.all([
    business.logo ? loadImageAsBase64(business.logo) : null,
    business.signature ? loadImageAsBase64(business.signature) : null,
  ]);

  // ===== HEADER BAR =====
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(0, 0, PAGE_WIDTH, 42, 'F');

  // Logo top-left
  let headerTextStartX = MARGIN;
  if (logoData) {
    const { width } = addImageSafe(pdf, logoData, MARGIN, 8, 28, 26);
    headerTextStartX = MARGIN + width + 4;
  }

  // Business name
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(business.name, headerTextStartX, 22);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(business.email, headerTextStartX, 28);

  // INVOICE title right
  pdf.setFontSize(26);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', PAGE_WIDTH - MARGIN, 20, { align: 'right' });
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoice.invoiceNumber, PAGE_WIDTH - MARGIN, 28, { align: 'right' });

  y = 52;

  // ===== PAID STAMP =====
  if (invoice.isPaid) {
    pdf.setTextColor(34, 197, 94);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    const stampX = PAGE_WIDTH - MARGIN - 30;
    pdf.text('PAID', stampX, y + 2, { align: 'center' });
    pdf.setDrawColor(34, 197, 94);
    pdf.setLineWidth(2);
    pdf.rect(stampX - 18, y - 8, 36, 16);
    y += 12;
  }

  // ===== FROM / BILL TO =====
  const midX = PAGE_WIDTH / 2 + 10;

  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FROM', MARGIN, y);
  pdf.text('BILL TO', midX, y);
  y += 5;

  pdf.setTextColor(17, 24, 39);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(business.name, MARGIN, y);
  pdf.text(client.name, midX, y);
  y += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(107, 114, 128);

  const businessLines = [
    business.address,
    `${business.city}, ${business.country}`,
    business.email,
    business.phone,
    business.taxId ? `Tax ID: ${business.taxId}` : '',
  ].filter(Boolean);

  const clientLines = [
    client.address,
    `${client.city}, ${client.country}`,
    client.email,
    client.phone,
    client.taxId ? `Tax ID: ${client.taxId}` : '',
  ].filter(Boolean);

  const maxLines = Math.max(businessLines.length, clientLines.length);
  businessLines.forEach((line, i) => pdf.text(line, MARGIN, y + i * 4));
  clientLines.forEach((line, i) => pdf.text(line, midX, y + i * 4));
  y += maxLines * 4 + 8;

  // ===== DATE ROW =====
  pdf.setFillColor(249, 250, 251);
  pdf.rect(MARGIN, y, CONTENT_WIDTH, 14, 'F');
  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE DATE', MARGIN + 5, y + 5);
  pdf.text('DUE DATE', MARGIN + 65, y + 5);
  pdf.setTextColor(17, 24, 39);
  pdf.setFontSize(9.5);
  pdf.text(formatDate(invoice.createdAt), MARGIN + 5, y + 11);
  pdf.text(formatDate(invoice.dueDate), MARGIN + 65, y + 11);
  y += 20;

  // ===== ITEMS TABLE =====
  y = drawTableHeader(pdf, y, colors);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  invoice.items.forEach((item, index) => {
    y = checkPageBreak(pdf, y, TABLE_ROW_HEIGHT, colors);

    const lineTotal = item.quantity * item.price;
    const lineDiscount = lineTotal * (item.discount / 100);
    const amount = lineTotal - lineDiscount;

    // Zebra striping
    if (index % 2 === 0) {
      pdf.setFillColor(249, 250, 251);
      pdf.rect(MARGIN, y - 3, CONTENT_WIDTH, TABLE_ROW_HEIGHT, 'F');
    }

    pdf.setTextColor(17, 24, 39);
    const desc = item.description || 'Item';
    // Truncate long descriptions
    const maxDescWidth = COL.desc.w;
    const truncated = pdf.splitTextToSize(desc, maxDescWidth)[0];
    pdf.text(truncated, COL.desc.x, y + 3);

    pdf.setTextColor(107, 114, 128);
    pdf.text(item.quantity.toString(), COL.qty.x + COL.qty.w / 2, y + 3, { align: 'center' });
    pdf.text(formatCurrency(item.price, cs), COL.price.x + COL.price.w / 2, y + 3, { align: 'center' });
    pdf.text(`${item.taxRate}%`, COL.tax.x + COL.tax.w / 2, y + 3, { align: 'center' });

    pdf.setTextColor(17, 24, 39);
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatCurrency(amount, cs), COL.amount.x, y + 3, { align: 'right' });
    pdf.setFont('helvetica', 'normal');

    if (item.discount > 0) {
      pdf.setFontSize(7);
      pdf.setTextColor(156, 163, 175);
      pdf.text(`${item.discount}% discount`, COL.desc.x, y + 7);
      pdf.setFontSize(9);
      y += 3;
    }

    y += TABLE_ROW_HEIGHT;
  });

  y += 6;

  // ===== TOTALS (Right aligned) =====
  y = checkPageBreak(pdf, y, 40, colors);
  const totalsX = PAGE_WIDTH - MARGIN - 60;

  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Subtotal', totalsX, y);
  pdf.setTextColor(17, 24, 39);
  pdf.text(formatCurrency(invoice.subtotal, cs), PAGE_WIDTH - MARGIN, y, { align: 'right' });

  if (invoice.discountTotal > 0) {
    y += 6;
    pdf.setTextColor(107, 114, 128);
    pdf.text('Discount', totalsX, y);
    pdf.setTextColor(220, 38, 38);
    pdf.text(`-${formatCurrency(invoice.discountTotal, cs)}`, PAGE_WIDTH - MARGIN, y, { align: 'right' });
  }

  y += 6;
  pdf.setTextColor(107, 114, 128);
  pdf.text('Tax', totalsX, y);
  pdf.setTextColor(17, 24, 39);
  pdf.text(formatCurrency(invoice.taxTotal, cs), PAGE_WIDTH - MARGIN, y, { align: 'right' });

  y += 8;
  pdf.setDrawColor(229, 231, 235);
  pdf.line(totalsX - 10, y - 3, PAGE_WIDTH - MARGIN, y - 3);

  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('TOTAL', totalsX, y + 2);
  pdf.text(formatCurrency(invoice.total, cs), PAGE_WIDTH - MARGIN, y + 2, { align: 'right' });

  y += 12;

  // ===== NOTES =====
  if (invoice.notes) {
    y = checkPageBreak(pdf, y, 20, colors);
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Notes', MARGIN, y);
    y += 5;
    pdf.setTextColor(107, 114, 128);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const notesLines = pdf.splitTextToSize(invoice.notes, CONTENT_WIDTH * 0.6);
    pdf.text(notesLines, MARGIN, y);
    y += notesLines.length * 3.5 + 4;
  }

  // ===== QR CODE =====
  if (invoice.paymentQR) {
    try {
      y = checkPageBreak(pdf, y, 35, colors);
      const qrDataUrl = await QRCode.toDataURL(invoice.paymentQR, { width: 200, margin: 1 });
      pdf.addImage(qrDataUrl, 'PNG', PAGE_WIDTH - MARGIN - 25, y, 25, 25);
      pdf.setFontSize(7);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Scan to Pay', PAGE_WIDTH - MARGIN - 12.5, y + 28, { align: 'center' });
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  }

  // ===== SIGNATURE (Bottom right above footer) =====
  if (signatureData) {
    const sigY = PAGE_HEIGHT - 45;
    addImageSafe(pdf, signatureData, PAGE_WIDTH - MARGIN - 40, sigY, 35, 15);
    pdf.setFontSize(7);
    pdf.setTextColor(107, 114, 128);
    pdf.text('Authorized Signature', PAGE_WIDTH - MARGIN - 22.5, sigY + 18, { align: 'center' });
  }

  // ===== FOOTER =====
  if (business.footerText) {
    pdf.setTextColor(156, 163, 175);
    pdf.setFontSize(8);
    pdf.text(business.footerText, PAGE_WIDTH / 2, PAGE_HEIGHT - 12, { align: 'center' });
  }

  // Return blob instead of saving directly
  const blob = pdf.output('blob');
  return blob;
}

export async function downloadInvoicePDF(
  invoice: Invoice | Omit<Invoice, 'id'>,
  client: Client,
  business: Business,
  settings: AppSettings
): Promise<void> {
  const blob = await generateInvoicePDF(invoice, client, business, settings);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoice.invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
