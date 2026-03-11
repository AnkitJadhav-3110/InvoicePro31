import jsPDF from 'jspdf';
import { Invoice, Client, Business, AppSettings } from '@/store/useStore';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

// Corporate blue palette
const BLUE = [0, 70, 140] as [number, number, number];
const DARK_BLUE = [0, 40, 90] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];
const BLACK = [17, 24, 39] as [number, number, number];
const GRAY = [107, 114, 128] as [number, number, number];
const LIGHT_GRAY = [229, 231, 235] as [number, number, number];
const TABLE_HEADER_BG = [0, 70, 140] as [number, number, number];

function formatCurrency(amount: number, symbol: string) {
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

async function loadImageAsBase64(src: string): Promise<string | null> {
  if (!src) return null;
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
  return 'JPEG';
}

function addImageSafe(
  pdf: jsPDF, dataUrl: string, x: number, y: number, maxW: number, maxH: number
): { width: number; height: number } {
  try {
    const format = getImageFormat(dataUrl);
    const img = new Image();
    img.src = dataUrl;
    let w = maxW, h = maxH;
    if (img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio > maxW / maxH) { w = maxW; h = maxW / ratio; }
      else { h = maxH; w = maxH * ratio; }
    }
    pdf.addImage(dataUrl, format, x, y, w, h);
    return { width: w, height: h };
  } catch {
    return { width: 0, height: 0 };
  }
}

export async function generateCorporateBluePDF(
  invoice: Invoice | Omit<Invoice, 'id'>,
  client: Client,
  business: Business,
  settings: AppSettings
): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const cs = settings.currencySymbol;

  // Load logo & signature
  const [logoData, signatureData] = await Promise.all([
    business.logo ? loadImageAsBase64(business.logo) : null,
    business.signature ? loadImageAsBase64(business.signature) : null,
  ]);

  // ===== HEADER BAND (Dark blue rectangle) =====
  pdf.setFillColor(DARK_BLUE[0], DARK_BLUE[1], DARK_BLUE[2]);
  pdf.rect(0, 0, PAGE_WIDTH, 42, 'F');

  // Diagonal decorative shapes (blue triangles)
  pdf.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
  // Left diagonal
  pdf.triangle(0, 42, 0, 25, 30, 42, 'F');
  // Right diagonal accent
  pdf.triangle(PAGE_WIDTH, 0, PAGE_WIDTH - 40, 0, PAGE_WIDTH, 20, 'F');
  pdf.triangle(PAGE_WIDTH, 30, PAGE_WIDTH - 25, 42, PAGE_WIDTH, 42, 'F');

  // Logo on left
  if (logoData) {
    addImageSafe(pdf, logoData, MARGIN_X + 2, 6, 28, 18);
  }

  // Company name below logo area (or in header if no logo)
  pdf.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  const companyX = logoData ? MARGIN_X + 34 : MARGIN_X + 2;
  pdf.text(business.name, companyX, 16);
  
  // Company tagline / address
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  const tagline = [business.address, [business.city, business.country].filter(Boolean).join(', ')].filter(Boolean).join(' • ');
  if (tagline) pdf.text(tagline, companyX, 22);

  // INVOICE title on right
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', PAGE_WIDTH - MARGIN_X, 18, { align: 'right' });

  // Invoice meta on right side of header
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  const metaX = PAGE_WIDTH - MARGIN_X;
  pdf.text(`Invoice Number: ${invoice.invoiceNumber}`, metaX, 25, { align: 'right' });
  pdf.text(`Invoice Date: ${formatDate(invoice.createdAt)}`, metaX, 30, { align: 'right' });
  if (business.phone) pdf.text(`Phone: ${business.phone}`, metaX, 35, { align: 'right' });
  if (business.email) pdf.text(`Email: ${business.email}`, metaX, 40, { align: 'right' });

  let y = 54;

  // ===== INVOICE TO + PAYMENT METHOD =====
  const colWidth = CONTENT_WIDTH / 2;

  // Left: Invoice To
  pdf.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE TO:', MARGIN_X, y);
  y += 6;

  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(client.name, MARGIN_X, y);
  y += 5;

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  const clientLines = [
    client.address,
    [client.city, client.country].filter(Boolean).join(', '),
    client.phone ? `Phone: ${client.phone}` : '',
    `Email: ${client.email}`,
  ].filter(Boolean);
  clientLines.forEach((line, i) => {
    pdf.text(line, MARGIN_X, y + i * 4);
  });

  // Right: Payment Method
  const rightColX = MARGIN_X + colWidth + 10;
  let pmY = 54;
  pdf.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Payment Method', rightColX, pmY);
  pmY += 6;

  pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  const paymentInfo = [
    business.taxId ? `Tax ID: ${business.taxId}` : '',
    `Account Name: ${business.name}`,
  ].filter(Boolean);
  paymentInfo.forEach((line, i) => {
    pdf.text(line, rightColX, pmY + i * 4.5);
  });

  y = Math.max(y + clientLines.length * 4, pmY + paymentInfo.length * 4.5) + 8;

  // ===== GREETING =====
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'italic');
  pdf.text(`Dear ${client.name},`, MARGIN_X, y);
  y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  const greeting = invoice.notes || 'Thank you for your business. Please find the details of your invoice below.';
  const greetLines = pdf.splitTextToSize(greeting, CONTENT_WIDTH);
  pdf.text(greetLines, MARGIN_X, y);
  y += greetLines.length * 3.5 + 8;

  // ===== ITEMS TABLE =====
  // Table header
  const colNo = { x: MARGIN_X, w: 14 };
  const colDesc = { x: MARGIN_X + 14, w: 76 };
  const colPrice = { x: MARGIN_X + 90, w: 30 };
  const colQty = { x: MARGIN_X + 120, w: 25 };
  const colTotal = { x: MARGIN_X + 145, w: CONTENT_WIDTH - 145 };

  pdf.setFillColor(TABLE_HEADER_BG[0], TABLE_HEADER_BG[1], TABLE_HEADER_BG[2]);
  pdf.rect(MARGIN_X, y, CONTENT_WIDTH, 8, 'F');

  pdf.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'bold');
  pdf.text('No.', colNo.x + 2, y + 5.5);
  pdf.text('Product Description', colDesc.x + 2, y + 5.5);
  pdf.text('Price', colPrice.x + colPrice.w / 2, y + 5.5, { align: 'center' });
  pdf.text('Quantity', colQty.x + colQty.w / 2, y + 5.5, { align: 'center' });
  pdf.text('Total', colTotal.x + colTotal.w - 2, y + 5.5, { align: 'right' });
  y += 10;

  // Table rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);

  invoice.items.forEach((item, index) => {
    const lineTotal = item.quantity * item.price;
    const lineDiscount = lineTotal * (item.discount / 100);
    const amount = lineTotal - lineDiscount;

    // Zebra stripe
    if (index % 2 === 0) {
      pdf.setFillColor(245, 247, 250);
      pdf.rect(MARGIN_X, y - 1, CONTENT_WIDTH, 9, 'F');
    }

    // Row bottom border
    pdf.setDrawColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN_X, y + 8, MARGIN_X + CONTENT_WIDTH, y + 8);

    // No.
    pdf.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(index + 1).padStart(2, '0'), colNo.x + 2, y + 5);

    // Description
    pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
    pdf.setFont('helvetica', 'normal');
    const desc = item.description || 'Item';
    const truncated = pdf.splitTextToSize(desc, colDesc.w - 4)[0];
    pdf.text(truncated, colDesc.x + 2, y + 5);

    // Price
    pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    pdf.text(formatCurrency(item.price, cs), colPrice.x + colPrice.w / 2, y + 5, { align: 'center' });

    // Quantity
    pdf.text(String(item.quantity), colQty.x + colQty.w / 2, y + 5, { align: 'center' });

    // Total
    pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatCurrency(amount, cs), colTotal.x + colTotal.w - 2, y + 5, { align: 'right' });

    y += 10;
  });

  y += 6;

  // ===== SUMMARY (right-aligned) =====
  const summaryLabelX = PAGE_WIDTH - MARGIN_X - 60;
  const summaryValueX = PAGE_WIDTH - MARGIN_X;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);

  // Subtotal
  pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  pdf.text('Subtotal:', summaryLabelX, y, { align: 'right' });
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.text(formatCurrency(invoice.subtotal, cs), summaryValueX, y, { align: 'right' });
  y += 6;

  // Discount
  if (invoice.discountTotal > 0) {
    pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    pdf.text('Discount:', summaryLabelX, y, { align: 'right' });
    pdf.setTextColor(220, 38, 38);
    pdf.text(`-${formatCurrency(invoice.discountTotal, cs)}`, summaryValueX, y, { align: 'right' });
    y += 6;
  }

  // Tax
  pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  const avgTaxRate = invoice.items.length > 0
    ? invoice.items.reduce((sum, i) => sum + i.taxRate, 0) / invoice.items.length
    : 0;
  pdf.text(`Tax (${avgTaxRate.toFixed(0)}%):`, summaryLabelX, y, { align: 'right' });
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.text(formatCurrency(invoice.taxTotal, cs), summaryValueX, y, { align: 'right' });
  y += 4;

  // Total highlight block
  pdf.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
  pdf.rect(summaryLabelX - 15, y, summaryValueX - summaryLabelX + 17, 10, 'F');
  pdf.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total:', summaryLabelX - 2, y + 7, { align: 'right' });
  pdf.text(formatCurrency(invoice.total, cs), summaryValueX - 2, y + 7, { align: 'right' });

  y += 18;

  // ===== TERMS & CONDITIONS =====
  if (y < PAGE_HEIGHT - 70) {
    pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Terms & Conditions:', MARGIN_X, y);
    y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    const terms = business.footerText || 'Payment is due within the terms specified above. Late payments may incur additional charges.';
    const termsLines = pdf.splitTextToSize(terms, CONTENT_WIDTH * 0.6);
    pdf.text(termsLines, MARGIN_X, y);
  }

  // ===== SIGNATURE =====
  if (signatureData) {
    const sigY = PAGE_HEIGHT - 50;
    addImageSafe(pdf, signatureData, PAGE_WIDTH - MARGIN_X - 40, sigY, 32, 14);
    pdf.setFontSize(7);
    pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    pdf.text('Your Name & Signature', PAGE_WIDTH - MARGIN_X - 24, sigY + 18, { align: 'center' });
    pdf.setFontSize(6.5);
    pdf.text(business.name, PAGE_WIDTH - MARGIN_X - 24, sigY + 22, { align: 'center' });
  }

  // ===== FOOTER BAND =====
  const footerY = PAGE_HEIGHT - 20;
  pdf.setFillColor(DARK_BLUE[0], DARK_BLUE[1], DARK_BLUE[2]);
  pdf.rect(0, footerY, PAGE_WIDTH, 20, 'F');

  // Diagonal accents on footer
  pdf.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
  pdf.triangle(0, footerY, 25, footerY, 0, PAGE_HEIGHT, 'F');
  pdf.triangle(PAGE_WIDTH, footerY, PAGE_WIDTH - 20, footerY, PAGE_WIDTH, footerY + 10, 'F');

  pdf.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Thank You For Your Business', PAGE_WIDTH / 2, footerY + 12, { align: 'center' });

  return pdf.output('blob');
}
