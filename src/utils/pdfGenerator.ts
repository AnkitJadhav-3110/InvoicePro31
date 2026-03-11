import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Invoice, Client, Business, AppSettings } from '@/store/useStore';
import { generateCorporateBluePDF } from './pdfCorporateBlue';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 18;
const MARGIN_TOP = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

// Professional color palette
const COLORS = {
  black: [17, 24, 39] as [number, number, number],
  dark: [31, 41, 55] as [number, number, number],
  gray: [107, 114, 128] as [number, number, number],
  lightGray: [156, 163, 175] as [number, number, number],
  divider: [229, 231, 235] as [number, number, number],
  zebra: [249, 250, 251] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  accent: [59, 130, 246] as [number, number, number],
};

function formatCurrency(amount: number, symbol: string) {
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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
  if (dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')) return 'JPEG';
  return 'PNG';
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

// Table column definitions
const COL = {
  desc: { x: MARGIN_X + 2, w: 78 },
  qty: { x: MARGIN_X + 84, w: 18 },
  price: { x: MARGIN_X + 108, w: 26 },
  tax: { x: MARGIN_X + 138, w: 16 },
  amount: { x: PAGE_WIDTH - MARGIN_X - 2, w: 26 },
};

const TABLE_ROW_HEIGHT = 9;

function setColor(pdf: jsPDF, c: [number, number, number]) {
  pdf.setTextColor(c[0], c[1], c[2]);
}

function drawTableHeader(pdf: jsPDF, y: number): number {
  // Light gray background header
  pdf.setFillColor(COLORS.zebra[0], COLORS.zebra[1], COLORS.zebra[2]);
  pdf.rect(MARGIN_X, y, CONTENT_WIDTH, 8, 'F');
  
  // Bottom border
  pdf.setDrawColor(COLORS.divider[0], COLORS.divider[1], COLORS.divider[2]);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN_X, y + 8, PAGE_WIDTH - MARGIN_X, y + 8);

  setColor(pdf, COLORS.gray);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DESCRIPTION', COL.desc.x + 2, y + 5.5);
  pdf.text('QTY', COL.qty.x + COL.qty.w / 2, y + 5.5, { align: 'center' });
  pdf.text('UNIT PRICE', COL.price.x + COL.price.w, y + 5.5, { align: 'right' });
  pdf.text('TAX', COL.tax.x + COL.tax.w / 2, y + 5.5, { align: 'center' });
  pdf.text('AMOUNT', COL.amount.x, y + 5.5, { align: 'right' });
  return y + 10;
}

function checkPageBreak(pdf: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_HEIGHT - 35) {
    pdf.addPage();
    return drawTableHeader(pdf, MARGIN_TOP);
  }
  return y;
}

function getStatusStyle(status: string): { label: string; color: [number, number, number]; bg: [number, number, number] } {
  const s = status.toLowerCase();
  if (s === 'paid') return { label: 'PAID', color: [22, 101, 52], bg: [220, 252, 231] };
  if (s === 'sent') return { label: 'SENT', color: [30, 64, 175], bg: [219, 234, 254] };
  if (s === 'overdue') return { label: 'OVERDUE', color: [153, 27, 27], bg: [254, 226, 226] };
  if (s === 'draft') return { label: 'DRAFT', color: [75, 85, 99], bg: [243, 244, 246] };
  return { label: status.toUpperCase(), color: COLORS.gray, bg: COLORS.zebra };
}

export async function generateInvoicePDF(
  invoice: Invoice | Omit<Invoice, 'id'>,
  client: Client,
  business: Business,
  settings: AppSettings
): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const cs = settings.currencySymbol;
  let y = MARGIN_TOP;

  // Load images
  const [logoData, signatureData] = await Promise.all([
    business.logo ? loadImageAsBase64(business.logo) : null,
    business.signature ? loadImageAsBase64(business.signature) : null,
  ]);

  // ===== HEADER =====
  // Left side: Logo + Business details
  let businessTextY = y;
  if (logoData) {
    const { height } = addImageSafe(pdf, logoData, MARGIN_X, y, 32, 22);
    businessTextY = y + height + 3;
  }

  // Business name
  setColor(pdf, COLORS.black);
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.text(business.name, MARGIN_X, businessTextY + 4);
  businessTextY += 9;

  // Business details
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  setColor(pdf, COLORS.gray);
  const bizDetails = [
    business.address,
    [business.city, business.country].filter(Boolean).join(', '),
    business.email,
    business.phone,
    business.taxId ? `Tax ID: ${business.taxId}` : '',
  ].filter(Boolean);
  bizDetails.forEach((line, i) => {
    pdf.text(line, MARGIN_X, businessTextY + i * 4);
  });

  // Right side: INVOICE title + number + dates
  const rightX = PAGE_WIDTH - MARGIN_X;
  setColor(pdf, COLORS.black);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', rightX, y + 6, { align: 'right' });

  // Invoice number
  setColor(pdf, COLORS.gray);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoice.invoiceNumber, rightX, y + 13, { align: 'right' });

  // Status badge (if applicable)
  const status = (invoice as Invoice).status || 'draft';
  if (status) {
    const st = getStatusStyle(status);
    const badgeY = y + 17;
    const badgeText = st.label;
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    const badgeW = pdf.getTextWidth(badgeText) + 8;
    const badgeX = rightX - badgeW;
    
    pdf.setFillColor(st.bg[0], st.bg[1], st.bg[2]);
    pdf.setDrawColor(st.color[0], st.color[1], st.color[2]);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(badgeX, badgeY, badgeW, 5.5, 1, 1, 'FD');
    pdf.setTextColor(st.color[0], st.color[1], st.color[2]);
    pdf.text(badgeText, badgeX + badgeW / 2, badgeY + 4, { align: 'center' });
  }

  // Dates
  const dateStartY = y + 27;
  setColor(pdf, COLORS.lightGray);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE DATE', rightX, dateStartY, { align: 'right' });
  setColor(pdf, COLORS.dark);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatDate(invoice.createdAt), rightX, dateStartY + 5, { align: 'right' });

  setColor(pdf, COLORS.lightGray);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DUE DATE', rightX, dateStartY + 12, { align: 'right' });
  setColor(pdf, COLORS.dark);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatDate(invoice.dueDate), rightX, dateStartY + 17, { align: 'right' });

  // Calculate y after header
  y = Math.max(businessTextY + bizDetails.length * 4 + 4, dateStartY + 22);

  // ===== DIVIDER =====
  pdf.setDrawColor(COLORS.divider[0], COLORS.divider[1], COLORS.divider[2]);
  pdf.setLineWidth(0.4);
  pdf.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
  y += 8;

  // ===== BILL TO =====
  setColor(pdf, COLORS.lightGray);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BILL TO', MARGIN_X, y);
  y += 5;

  setColor(pdf, COLORS.black);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(client.name, MARGIN_X, y);
  y += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  setColor(pdf, COLORS.gray);
  const clientDetails = [
    client.address,
    [client.city, client.country].filter(Boolean).join(', '),
    client.email,
    client.phone,
    client.taxId ? `Tax ID: ${client.taxId}` : '',
  ].filter(Boolean);
  clientDetails.forEach((line, i) => {
    pdf.text(line, MARGIN_X, y + i * 4);
  });
  y += clientDetails.length * 4 + 10;

  // ===== ITEMS TABLE =====
  y = drawTableHeader(pdf, y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);

  invoice.items.forEach((item, index) => {
    y = checkPageBreak(pdf, y, TABLE_ROW_HEIGHT + 4);

    const lineTotal = item.quantity * item.price;
    const lineDiscount = lineTotal * (item.discount / 100);
    const amount = lineTotal - lineDiscount;

    // Zebra striping
    if (index % 2 === 0) {
      pdf.setFillColor(COLORS.zebra[0], COLORS.zebra[1], COLORS.zebra[2]);
      pdf.rect(MARGIN_X, y - 1, CONTENT_WIDTH, TABLE_ROW_HEIGHT, 'F');
    }

    // Description
    setColor(pdf, COLORS.dark);
    pdf.setFont('helvetica', 'normal');
    const desc = item.description || 'Item';
    const truncated = pdf.splitTextToSize(desc, COL.desc.w)[0];
    pdf.text(truncated, COL.desc.x + 2, y + 4.5);

    // Qty
    setColor(pdf, COLORS.gray);
    pdf.text(item.quantity.toString(), COL.qty.x + COL.qty.w / 2, y + 4.5, { align: 'center' });

    // Unit price (right-aligned)
    pdf.text(formatCurrency(item.price, cs), COL.price.x + COL.price.w, y + 4.5, { align: 'right' });

    // Tax
    pdf.text(`${item.taxRate}%`, COL.tax.x + COL.tax.w / 2, y + 4.5, { align: 'center' });

    // Amount (right-aligned, bold)
    setColor(pdf, COLORS.black);
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatCurrency(amount, cs), COL.amount.x, y + 4.5, { align: 'right' });
    pdf.setFont('helvetica', 'normal');

    // Discount note
    if (item.discount > 0) {
      pdf.setFontSize(6.5);
      setColor(pdf, COLORS.lightGray);
      pdf.text(`${item.discount}% discount applied`, COL.desc.x + 2, y + 8);
      pdf.setFontSize(8.5);
      y += 3;
    }

    // Row bottom border
    pdf.setDrawColor(COLORS.divider[0], COLORS.divider[1], COLORS.divider[2]);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN_X, y + TABLE_ROW_HEIGHT - 1, PAGE_WIDTH - MARGIN_X, y + TABLE_ROW_HEIGHT - 1);

    y += TABLE_ROW_HEIGHT;
  });

  y += 8;

  // ===== TOTALS (Right-aligned) =====
  y = checkPageBreak(pdf, y, 45);
  const totalsLabelX = PAGE_WIDTH - MARGIN_X - 55;
  const totalsValueX = PAGE_WIDTH - MARGIN_X;

  // Subtotal
  setColor(pdf, COLORS.gray);
  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Subtotal', totalsLabelX, y, { align: 'right' });
  setColor(pdf, COLORS.dark);
  pdf.text(formatCurrency(invoice.subtotal, cs), totalsValueX, y, { align: 'right' });

  // Tax
  y += 6;
  setColor(pdf, COLORS.gray);
  pdf.text('Tax', totalsLabelX, y, { align: 'right' });
  setColor(pdf, COLORS.dark);
  pdf.text(formatCurrency(invoice.taxTotal, cs), totalsValueX, y, { align: 'right' });

  // Discount
  if (invoice.discountTotal > 0) {
    y += 6;
    setColor(pdf, COLORS.gray);
    pdf.text('Discount', totalsLabelX, y, { align: 'right' });
    setColor(pdf, COLORS.red);
    pdf.text(`-${formatCurrency(invoice.discountTotal, cs)}`, totalsValueX, y, { align: 'right' });
  }

  // Strong divider before total
  y += 5;
  pdf.setDrawColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  pdf.setLineWidth(0.6);
  pdf.line(totalsLabelX - 10, y, totalsValueX, y);
  y += 7;

  // TOTAL
  setColor(pdf, COLORS.black);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total', totalsLabelX, y, { align: 'right' });
  pdf.text(formatCurrency(invoice.total, cs), totalsValueX, y, { align: 'right' });

  y += 14;

  // ===== NOTES =====
  if (invoice.notes) {
    y = checkPageBreak(pdf, y, 20);
    setColor(pdf, COLORS.dark);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Notes', MARGIN_X, y);
    y += 4;
    setColor(pdf, COLORS.gray);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    const notesLines = pdf.splitTextToSize(invoice.notes, CONTENT_WIDTH * 0.65);
    pdf.text(notesLines, MARGIN_X, y);
    y += notesLines.length * 3.5 + 6;
  }

  // ===== QR CODE =====
  if (invoice.paymentQR) {
    try {
      y = checkPageBreak(pdf, y, 32);
      const qrDataUrl = await QRCode.toDataURL(invoice.paymentQR, { width: 200, margin: 1 });
      pdf.addImage(qrDataUrl, 'PNG', PAGE_WIDTH - MARGIN_X - 22, y, 22, 22);
      pdf.setFontSize(6.5);
      setColor(pdf, COLORS.lightGray);
      pdf.text('Scan to Pay', PAGE_WIDTH - MARGIN_X - 11, y + 25, { align: 'center' });
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  }

  // ===== SIGNATURE =====
  if (signatureData) {
    const sigY = PAGE_HEIGHT - 48;
    addImageSafe(pdf, signatureData, PAGE_WIDTH - MARGIN_X - 38, sigY, 32, 14);
    pdf.setFontSize(6.5);
    setColor(pdf, COLORS.lightGray);
    pdf.text('Authorized Signature', PAGE_WIDTH - MARGIN_X - 22, sigY + 17, { align: 'center' });
  }

  // ===== FOOTER =====
  const footerY = PAGE_HEIGHT - 18;
  pdf.setDrawColor(COLORS.divider[0], COLORS.divider[1], COLORS.divider[2]);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN_X, footerY, PAGE_WIDTH - MARGIN_X, footerY);

  setColor(pdf, COLORS.lightGray);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');

  const footerParts: string[] = [];
  if (business.footerText) footerParts.push(business.footerText);
  else footerParts.push('Thank you for your business.');
  
  pdf.text(footerParts.join('  •  '), PAGE_WIDTH / 2, footerY + 5, { align: 'center' });

  // Website
  if (business.email) {
    const domain = business.email.split('@')[1];
    if (domain) {
      pdf.setFontSize(6.5);
      setColor(pdf, COLORS.gray);
      pdf.text(`www.${domain}`, PAGE_WIDTH / 2, footerY + 9, { align: 'center' });
    }
  }

  return pdf.output('blob');
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
