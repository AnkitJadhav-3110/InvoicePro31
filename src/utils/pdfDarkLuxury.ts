import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Invoice, Client, Business, AppSettings } from '@/store/useStore';

const PW = 210;
const PH = 297;
const MX = 18;
const MY = 18;
const CW = PW - MX * 2;

// Dark luxury color palette
const C = {
  navy: [15, 23, 42] as [number, number, number],
  darkNavy: [2, 6, 23] as [number, number, number],
  gold: [212, 175, 55] as [number, number, number],
  lightGold: [234, 210, 130] as [number, number, number],
  dimGold: [170, 140, 50] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  silver: [203, 213, 225] as [number, number, number],
  muted: [148, 163, 184] as [number, number, number],
  stripe: [20, 30, 52] as [number, number, number],
  divider: [30, 41, 59] as [number, number, number],
  green: [74, 222, 128] as [number, number, number],
  red: [248, 113, 113] as [number, number, number],
  amber: [251, 191, 36] as [number, number, number],
};

function fmt(amount: number, sym: string) {
  return `${sym}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function statusLabel(s: string): { label: string; color: [number, number, number] } {
  switch (s) {
    case 'paid': return { label: 'PAID', color: C.green };
    case 'sent': return { label: 'SENT', color: C.amber };
    case 'overdue': return { label: 'OVERDUE', color: C.red };
    default: return { label: 'DRAFT', color: C.muted };
  }
}

async function loadImg(src: string): Promise<string | null> {
  try {
    if (src.startsWith('data:')) return src;
    const r = await fetch(src);
    const b = await r.blob();
    return new Promise((res) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.onerror = () => res(null);
      reader.readAsDataURL(b);
    });
  } catch { return null; }
}

function imgFmt(d: string) { return d.includes('image/png') ? 'PNG' : 'JPEG'; }

function addImg(pdf: jsPDF, d: string, x: number, y: number, mw: number, mh: number) {
  try {
    const props = pdf.getImageProperties(d);
    const r = props.width / props.height;
    let w = mw, h = mw / r;
    if (h > mh) { h = mh; w = mh * r; }
    pdf.addImage(d, imgFmt(d), x, y, w, h);
    return { width: w, height: h };
  } catch { return { width: 0, height: 0 }; }
}

function setC(pdf: jsPDF, c: [number, number, number]) { pdf.setTextColor(c[0], c[1], c[2]); }

export async function generateDarkLuxuryPDF(
  invoice: Invoice | Omit<Invoice, 'id'>,
  client: Client,
  business: Business,
  settings: AppSettings
): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const cs = settings.currencySymbol;
  let y = 0;

  const [logoData, sigData] = await Promise.all([
    business.logo ? loadImg(business.logo) : null,
    business.signature ? loadImg(business.signature) : null,
  ]);

  // Helper: draw navy background for full page
  const drawBg = () => {
    pdf.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
    pdf.rect(0, 0, PW, PH, 'F');
  };

  // Helper: draw gold accent line
  const drawGoldLine = (ly: number, w?: number) => {
    pdf.setDrawColor(C.gold[0], C.gold[1], C.gold[2]);
    pdf.setLineWidth(0.5);
    pdf.line(MX, ly, MX + (w || CW), ly);
  };

  // Helper: draw decorative gold corner elements
  const drawCorners = () => {
    pdf.setDrawColor(C.gold[0], C.gold[1], C.gold[2]);
    pdf.setLineWidth(0.3);
    const s = 12;
    // Top-left
    pdf.line(MX - 4, MY - 4, MX - 4 + s, MY - 4);
    pdf.line(MX - 4, MY - 4, MX - 4, MY - 4 + s);
    // Top-right
    pdf.line(PW - MX + 4 - s, MY - 4, PW - MX + 4, MY - 4);
    pdf.line(PW - MX + 4, MY - 4, PW - MX + 4, MY - 4 + s);
    // Bottom-left
    pdf.line(MX - 4, PH - MY + 4, MX - 4 + s, PH - MY + 4);
    pdf.line(MX - 4, PH - MY + 4 - s, MX - 4, PH - MY + 4);
    // Bottom-right
    pdf.line(PW - MX + 4 - s, PH - MY + 4, PW - MX + 4, PH - MY + 4);
    pdf.line(PW - MX + 4, PH - MY + 4 - s, PW - MX + 4, PH - MY + 4);
  };

  const checkPageBreak = (needed: number): number => {
    if (y + needed > PH - MY - 20) {
      pdf.addPage();
      drawBg();
      drawCorners();
      y = MY;
    }
    return y;
  };

  // ===== PAGE BACKGROUND =====
  drawBg();
  drawCorners();
  y = MY;

  // ===== HEADER =====
  // Gold "INVOICE" title
  setC(pdf, C.gold);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', PW - MX, y + 8, { align: 'right' });

  // Status badge
  const st = statusLabel(invoice.status);
  setC(pdf, st.color);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text(st.label, PW - MX, y + 14, { align: 'right' });

  // Logo / Business name
  let bizY = y;
  if (logoData) {
    const { height } = addImg(pdf, logoData, MX, y, 30, 20);
    bizY = y + height + 3;
  }

  setC(pdf, C.white);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(business.name, MX, bizY + 5);

  setC(pdf, C.silver);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  let detY = bizY + 10;
  if (business.email) { pdf.text(business.email, MX, detY); detY += 4; }
  if (business.phone) { pdf.text(business.phone, MX, detY); detY += 4; }
  if (business.address) { pdf.text(business.address, MX, detY); detY += 4; }
  if (business.city) { pdf.text(`${business.city}${business.country ? ', ' + business.country : ''}`, MX, detY); detY += 4; }

  y = Math.max(detY, y + 24) + 6;
  drawGoldLine(y);
  y += 8;

  // ===== INVOICE DETAILS ROW =====
  const col1 = MX;
  const col2 = MX + CW * 0.5;

  // Invoice number + dates
  setC(pdf, C.dimGold);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE NUMBER', col1, y);
  pdf.text('DATE', col2, y);

  setC(pdf, C.white);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoice.invoiceNumber, col1, y + 5);
  pdf.text(fmtDate(invoice.createdAt), col2, y + 5);

  y += 12;
  setC(pdf, C.dimGold);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BILL TO', col1, y);
  pdf.text('DUE DATE', col2, y);

  setC(pdf, C.white);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(client.name, col1, y + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.text(fmtDate(invoice.dueDate), col2, y + 5);

  setC(pdf, C.silver);
  pdf.setFontSize(8);
  let cY = y + 10;
  if (client.email) { pdf.text(client.email, col1, cY); cY += 4; }
  if (client.phone) { pdf.text(client.phone, col1, cY); cY += 4; }
  if (client.address) { pdf.text(client.address, col1, cY); cY += 4; }
  if (client.city) { pdf.text(`${client.city}${client.country ? ', ' + client.country : ''}`, col1, cY); cY += 4; }

  y = Math.max(cY, y + 14) + 6;
  drawGoldLine(y);
  y += 8;

  // ===== ITEMS TABLE =====
  const cols = {
    desc: MX,
    qty: MX + CW * 0.52,
    price: MX + CW * 0.65,
    tax: MX + CW * 0.78,
    total: MX + CW,
  };

  // Table header
  const drawTableHeader = (headerY: number) => {
    pdf.setFillColor(C.stripe[0], C.stripe[1], C.stripe[2]);
    pdf.rect(MX, headerY - 4, CW, 8, 'F');
    setC(pdf, C.gold);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DESCRIPTION', cols.desc + 2, headerY);
    pdf.text('QTY', cols.qty, headerY, { align: 'center' });
    pdf.text('PRICE', cols.price, headerY, { align: 'center' });
    pdf.text('TAX', cols.tax, headerY, { align: 'center' });
    pdf.text('TOTAL', cols.total - 2, headerY, { align: 'right' });
    return headerY + 8;
  };

  y = drawTableHeader(y);

  // Table rows
  const items = invoice.items as unknown as Array<{ description: string; quantity: number; price: number; taxRate: number; discount: number }>;
  items.forEach((item, i) => {
    const itemTotal = item.quantity * item.price * (1 + (item.taxRate || 0) / 100) * (1 - (item.discount || 0) / 100);
    if (i % 2 === 0) {
      pdf.setFillColor(C.darkNavy[0], C.darkNavy[1], C.darkNavy[2]);
      pdf.rect(MX, y - 4, CW, 8, 'F');
    }

    setC(pdf, C.white);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const descText = pdf.splitTextToSize(item.description || '', CW * 0.48);
    pdf.text(descText[0] || '', cols.desc + 2, y);
    pdf.text(String(item.quantity), cols.qty, y, { align: 'center' });
    pdf.text(fmt(item.price, cs), cols.price, y, { align: 'center' });
    pdf.text(`${item.tax}%`, cols.tax, y, { align: 'center' });

    setC(pdf, C.lightGold);
    pdf.setFont('helvetica', 'bold');
    pdf.text(fmt(item.total, cs), cols.total - 2, y, { align: 'right' });

    y += 8;
  });

  y += 4;
  drawGoldLine(y);
  y += 8;

  // ===== TOTALS =====
  y = checkPageBreak(40);
  const totX = MX + CW * 0.6;
  const totValX = MX + CW;

  const drawTotalRow = (label: string, value: string, isGrand = false) => {
    if (isGrand) {
      pdf.setFillColor(C.gold[0], C.gold[1], C.gold[2]);
      pdf.rect(totX - 4, y - 4, CW * 0.4 + 8, 10, 'F');
      setC(pdf, C.navy);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, totX, y + 1);
      pdf.text(value, totValX, y + 1, { align: 'right' });
      y += 14;
    } else {
      setC(pdf, C.muted);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(label, totX, y);
      setC(pdf, C.white);
      pdf.text(value, totValX, y, { align: 'right' });
      y += 6;
    }
  };

  drawTotalRow('Subtotal', fmt(invoice.subtotal, cs));
  if (invoice.discountTotal > 0) drawTotalRow('Discount', `-${fmt(invoice.discountTotal, cs)}`);
  if (invoice.taxTotal > 0) drawTotalRow('Tax', fmt(invoice.taxTotal, cs));
  y += 2;
  drawTotalRow('TOTAL', fmt(invoice.total, cs), true);

  // ===== NOTES =====
  if (invoice.notes) {
    y = checkPageBreak(20);
    setC(pdf, C.dimGold);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NOTES', MX, y);
    y += 5;
    setC(pdf, C.silver);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const noteLines = pdf.splitTextToSize(invoice.notes, CW * 0.7);
    noteLines.forEach((line: string) => {
      y = checkPageBreak(5);
      pdf.text(line, MX, y);
      y += 4;
    });
    y += 4;
  }

  // ===== QR CODE =====
  if (invoice.paymentQR) {
    try {
      const qrUrl = await QRCode.toDataURL(invoice.paymentQR, { width: 200, margin: 1, color: { dark: '#D4AF37', light: '#0F172A' } });
      y = checkPageBreak(35);
      setC(pdf, C.dimGold);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PAYMENT QR', MX, y);
      y += 3;
      addImg(pdf, qrUrl, MX, y, 28, 28);
      y += 32;
    } catch { /* skip */ }
  }

  // ===== SIGNATURE =====
  if (sigData) {
    y = checkPageBreak(25);
    addImg(pdf, sigData, MX, y, 35, 18);
    y += 20;
    drawGoldLine(y, 40);
    y += 4;
    setC(pdf, C.muted);
    pdf.setFontSize(7);
    pdf.text('Authorized Signature', MX, y);
  }

  // ===== FOOTER =====
  setC(pdf, C.dimGold);
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  const footText = business.footerText || 'Thank you for your business';
  pdf.text(footText, PW / 2, PH - MY + 6, { align: 'center' });

  // Gold bottom accent line
  pdf.setDrawColor(C.gold[0], C.gold[1], C.gold[2]);
  pdf.setLineWidth(1);
  pdf.line(MX, PH - MY + 1, PW - MX, PH - MY + 1);

  return pdf.output('blob');
}
