import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Invoice, Client, Business, AppSettings } from '@/store/useStore';

const PW = 210;
const PH = 297;
const MX = 20;
const MY = 20;
const CW = PW - MX * 2;

const C = {
  black: [0, 0, 0] as [number, number, number],
  dark: [30, 30, 30] as [number, number, number],
  mid: [100, 100, 100] as [number, number, number],
  light: [170, 170, 170] as [number, number, number],
  rule: [210, 210, 210] as [number, number, number],
  bg: [245, 245, 245] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function fmt(amount: number, sym: string) {
  return `${sym}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function loadImg(src: string): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith('data:image/')) return src;
  try {
    const r = await fetch(src);
    const b = await r.blob();
    return new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = () => res(null);
      fr.readAsDataURL(b);
    });
  } catch { return null; }
}

function imgFmt(d: string) { return d.includes('image/png') ? 'PNG' : 'JPEG'; }

function addImg(pdf: jsPDF, d: string, x: number, y: number, mw: number, mh: number) {
  try {
    const f = imgFmt(d);
    const img = new Image();
    img.src = d;
    let w = mw, h = mh;
    if (img.naturalWidth && img.naturalHeight) {
      const r = img.naturalWidth / img.naturalHeight;
      if (r > mw / mh) { w = mw; h = mw / r; } else { h = mh; w = mh * r; }
    }
    pdf.addImage(d, f, x, y, w, h);
    return { width: w, height: h };
  } catch { return { width: 0, height: 0 }; }
}

function setC(pdf: jsPDF, c: [number, number, number]) { pdf.setTextColor(c[0], c[1], c[2]); }

function statusLabel(s: string) {
  const m: Record<string, string> = { paid: 'PAID', sent: 'SENT', overdue: 'OVERDUE', draft: 'DRAFT' };
  return m[s.toLowerCase()] || s.toUpperCase();
}

export async function generateMinimalBWPDF(
  invoice: Invoice | Omit<Invoice, 'id'>,
  client: Client,
  business: Business,
  settings: AppSettings
): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const cs = settings.currencySymbol;
  let y = MY;

  const [logo, sig] = await Promise.all([
    business.logo ? loadImg(business.logo) : null,
    business.signature ? loadImg(business.signature) : null,
  ]);

  // === HEADER: thin top rule ===
  pdf.setDrawColor(C.black[0], C.black[1], C.black[2]);
  pdf.setLineWidth(1.2);
  pdf.line(MX, y, PW - MX, y);
  y += 8;

  // Logo + business name
  let leftY = y;
  if (logo) {
    const { height } = addImg(pdf, logo, MX, y, 28, 18);
    leftY = y + height + 3;
  }

  setC(pdf, C.black);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(business.name.toUpperCase(), MX, leftY + 5);
  leftY += 10;

  // Business details - small, light
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  setC(pdf, C.mid);
  const biz = [business.address, [business.city, business.country].filter(Boolean).join(', '), business.email, business.phone, business.taxId ? `Tax ID: ${business.taxId}` : ''].filter(Boolean);
  biz.forEach((l, i) => { pdf.text(l, MX, leftY + i * 3.5); });

  // Right: INVOICE
  const rx = PW - MX;
  setC(pdf, C.black);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', rx, y + 5, { align: 'right' });

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  setC(pdf, C.mid);
  pdf.text(invoice.invoiceNumber, rx, y + 12, { align: 'right' });

  // Status
  const status = (invoice as Invoice).status || 'draft';
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  setC(pdf, C.black);
  const badge = statusLabel(status);
  const bw = pdf.getTextWidth(badge) + 6;
  pdf.setDrawColor(C.black[0], C.black[1], C.black[2]);
  pdf.setLineWidth(0.4);
  pdf.rect(rx - bw, y + 15, bw, 5);
  pdf.text(badge, rx - bw / 2, y + 18.5, { align: 'center' });

  // Dates
  const dy = y + 26;
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  setC(pdf, C.light);
  pdf.text('DATE', rx, dy, { align: 'right' });
  setC(pdf, C.dark);
  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text(fmtDate(invoice.createdAt), rx, dy + 4.5, { align: 'right' });

  setC(pdf, C.light);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DUE', rx, dy + 11, { align: 'right' });
  setC(pdf, C.dark);
  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text(fmtDate(invoice.dueDate), rx, dy + 15.5, { align: 'right' });

  y = Math.max(leftY + biz.length * 3.5 + 6, dy + 20);

  // Thin rule
  pdf.setDrawColor(C.rule[0], C.rule[1], C.rule[2]);
  pdf.setLineWidth(0.3);
  pdf.line(MX, y, PW - MX, y);
  y += 8;

  // === BILL TO ===
  setC(pdf, C.light);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BILL TO', MX, y);
  y += 5;
  setC(pdf, C.black);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(client.name, MX, y);
  y += 4.5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  setC(pdf, C.mid);
  const cl = [client.address, [client.city, client.country].filter(Boolean).join(', '), client.email, client.phone, client.taxId ? `Tax ID: ${client.taxId}` : ''].filter(Boolean);
  cl.forEach((l, i) => { pdf.text(l, MX, y + i * 3.5); });
  y += cl.length * 3.5 + 10;

  // === TABLE ===
  const cols = {
    desc: { x: MX, w: 80 },
    qty: { x: MX + 85, w: 20 },
    price: { x: MX + 110, w: 28 },
    tax: { x: MX + 140, w: 16 },
    amt: { x: PW - MX, w: 0 },
  };

  // Header
  const drawHeader = (yy: number) => {
    pdf.setDrawColor(C.black[0], C.black[1], C.black[2]);
    pdf.setLineWidth(0.6);
    pdf.line(MX, yy, PW - MX, yy);
    pdf.setLineWidth(0.3);
    pdf.line(MX, yy + 7, PW - MX, yy + 7);
    setC(pdf, C.black);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DESCRIPTION', cols.desc.x + 1, yy + 5);
    pdf.text('QTY', cols.qty.x + cols.qty.w / 2, yy + 5, { align: 'center' });
    pdf.text('PRICE', cols.price.x + cols.price.w, yy + 5, { align: 'right' });
    pdf.text('TAX', cols.tax.x + cols.tax.w / 2, yy + 5, { align: 'center' });
    pdf.text('AMOUNT', cols.amt.x, yy + 5, { align: 'right' });
    return yy + 9;
  };

  y = drawHeader(y);

  const rowH = 8;
  invoice.items.forEach((item) => {
    if (y + rowH > PH - 35) { pdf.addPage(); y = drawHeader(MY); }

    const total = item.quantity * item.price;
    const disc = total * (item.discount / 100);
    const amt = total - disc;

    setC(pdf, C.dark);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const desc = pdf.splitTextToSize(item.description || 'Item', cols.desc.w)[0];
    pdf.text(desc, cols.desc.x + 1, y + 5);

    setC(pdf, C.mid);
    pdf.text(item.quantity.toString(), cols.qty.x + cols.qty.w / 2, y + 5, { align: 'center' });
    pdf.text(fmt(item.price, cs), cols.price.x + cols.price.w, y + 5, { align: 'right' });
    pdf.text(`${item.taxRate}%`, cols.tax.x + cols.tax.w / 2, y + 5, { align: 'center' });

    setC(pdf, C.black);
    pdf.setFont('helvetica', 'bold');
    pdf.text(fmt(amt, cs), cols.amt.x, y + 5, { align: 'right' });
    pdf.setFont('helvetica', 'normal');

    if (item.discount > 0) {
      pdf.setFontSize(6);
      setC(pdf, C.light);
      pdf.text(`−${item.discount}% disc.`, cols.desc.x + 1, y + 8.5);
      y += 3;
    }

    // Light dotted row line
    pdf.setDrawColor(C.rule[0], C.rule[1], C.rule[2]);
    pdf.setLineWidth(0.15);
    pdf.line(MX, y + rowH, PW - MX, y + rowH);
    y += rowH;
  });

  // Bottom rule
  pdf.setDrawColor(C.black[0], C.black[1], C.black[2]);
  pdf.setLineWidth(0.6);
  pdf.line(MX, y, PW - MX, y);
  y += 8;

  // === TOTALS ===
  if (y + 40 > PH - 30) { pdf.addPage(); y = MY; }
  const lx = PW - MX - 55;
  const vx = PW - MX;

  setC(pdf, C.mid);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Subtotal', lx, y, { align: 'right' });
  setC(pdf, C.dark);
  pdf.text(fmt(invoice.subtotal, cs), vx, y, { align: 'right' });

  y += 5.5;
  setC(pdf, C.mid);
  pdf.text('Tax', lx, y, { align: 'right' });
  setC(pdf, C.dark);
  pdf.text(fmt(invoice.taxTotal, cs), vx, y, { align: 'right' });

  if (invoice.discountTotal > 0) {
    y += 5.5;
    setC(pdf, C.mid);
    pdf.text('Discount', lx, y, { align: 'right' });
    setC(pdf, C.dark);
    pdf.text(`−${fmt(invoice.discountTotal, cs)}`, vx, y, { align: 'right' });
  }

  y += 4;
  pdf.setDrawColor(C.black[0], C.black[1], C.black[2]);
  pdf.setLineWidth(0.8);
  pdf.line(lx - 10, y, vx, y);
  y += 7;

  setC(pdf, C.black);
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL', lx, y, { align: 'right' });
  pdf.text(fmt(invoice.total, cs), vx, y, { align: 'right' });
  y += 14;

  // === NOTES ===
  if (invoice.notes) {
    if (y + 15 > PH - 30) { pdf.addPage(); y = MY; }
    setC(pdf, C.dark);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Notes', MX, y);
    y += 4;
    setC(pdf, C.mid);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    const nl = pdf.splitTextToSize(invoice.notes, CW * 0.6);
    pdf.text(nl, MX, y);
    y += nl.length * 3.5 + 6;
  }

  // === QR ===
  if (invoice.paymentQR) {
    try {
      if (y + 30 > PH - 30) { pdf.addPage(); y = MY; }
      const qr = await QRCode.toDataURL(invoice.paymentQR, { width: 200, margin: 1 });
      pdf.addImage(qr, 'PNG', PW - MX - 20, y, 20, 20);
      setC(pdf, C.light);
      pdf.setFontSize(6);
      pdf.text('Scan to Pay', PW - MX - 10, y + 23, { align: 'center' });
    } catch {}
  }

  // === SIGNATURE ===
  if (sig) {
    const sy = PH - 46;
    addImg(pdf, sig, PW - MX - 36, sy, 30, 12);
    setC(pdf, C.light);
    pdf.setFontSize(6);
    pdf.text('Authorized Signature', PW - MX - 21, sy + 15, { align: 'center' });
  }

  // === FOOTER ===
  const fy = PH - 18;
  pdf.setDrawColor(C.black[0], C.black[1], C.black[2]);
  pdf.setLineWidth(1.2);
  pdf.line(MX, fy, PW - MX, fy);
  setC(pdf, C.mid);
  pdf.setFontSize(6.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text(business.footerText || 'Thank you for your business.', PW / 2, fy + 5, { align: 'center' });

  return pdf.output('blob');
}
