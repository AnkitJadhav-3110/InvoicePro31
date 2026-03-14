import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Invoice, Client, Business, AppSettings } from '@/store/useStore';

const PW = 210;
const PH = 297;
const MX = 18;
const MY = 18;
const CW = PW - MX * 2;

// Vibrant color palette
const C = {
  coral: [255, 107, 107] as [number, number, number],
  orange: [255, 159, 67] as [number, number, number],
  purple: [116, 75, 162] as [number, number, number],
  deepPurple: [78, 42, 132] as [number, number, number],
  teal: [0, 184, 148] as [number, number, number],
  navy: [45, 52, 93] as [number, number, number],
  dark: [44, 44, 84] as [number, number, number],
  mid: [119, 119, 170] as [number, number, number],
  light: [170, 170, 204] as [number, number, number],
  bg: [250, 248, 255] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  tableBg: [243, 240, 255] as [number, number, number],
};

function fmt(a: number, s: string) {
  return `${s}${a.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export async function generateCreativePDF(
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

  // === COLORFUL HEADER BAND ===
  // Gradient-like band (coral → orange)
  pdf.setFillColor(C.coral[0], C.coral[1], C.coral[2]);
  pdf.rect(0, 0, PW * 0.6, 42, 'F');
  pdf.setFillColor(C.orange[0], C.orange[1], C.orange[2]);
  pdf.rect(PW * 0.6, 0, PW * 0.4, 42, 'F');

  // Decorative circles
  pdf.setFillColor(255, 255, 255, 0.1);
  pdf.setGState(new (pdf as any).GState({ opacity: 0.15 }));
  pdf.circle(PW * 0.55, 10, 25, 'F');
  pdf.circle(PW * 0.75, 35, 18, 'F');
  pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

  // Logo in header
  if (logo) {
    addImg(pdf, logo, MX + 2, 8, 24, 16);
  }

  // Business name in header
  setC(pdf, C.white);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  const nameX = logo ? MX + 30 : MX + 2;
  pdf.text(business.name, nameX, 20);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text([business.email, business.phone].filter(Boolean).join('  •  '), nameX, 26);

  // INVOICE title
  const rx = PW - MX;
  pdf.setFontSize(26);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', rx, 22, { align: 'right' });
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoice.invoiceNumber, rx, 29, { align: 'right' });

  // Status badge
  const status = (invoice as Invoice).status || 'draft';
  const badgeColors: Record<string, [number, number, number]> = {
    paid: C.teal, sent: C.purple, overdue: C.coral, draft: C.mid,
  };
  const bc = badgeColors[status.toLowerCase()] || C.mid;
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  setC(pdf, C.white);
  const bl = status.toUpperCase();
  const bwidth = pdf.getTextWidth(bl) + 8;
  pdf.setFillColor(bc[0], bc[1], bc[2]);
  pdf.roundedRect(rx - bwidth, 32, bwidth, 5.5, 1.5, 1.5, 'F');
  pdf.text(bl, rx - bwidth / 2, 35.5, { align: 'center' });

  y = 50;

  // === INFO ROW: Dates + Bill To ===
  // Left: Bill To
  setC(pdf, C.coral);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BILL TO', MX, y);
  y += 5;
  setC(pdf, C.navy);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(client.name, MX, y);
  y += 4.5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  setC(pdf, C.mid);
  const cl = [client.address, [client.city, client.country].filter(Boolean).join(', '), client.email, client.phone, client.taxId ? `Tax ID: ${client.taxId}` : ''].filter(Boolean);
  cl.forEach((l, i) => { pdf.text(l, MX, y + i * 3.8); });

  // Right: Dates
  const dateX = PW - MX;
  let dateY = 50;
  setC(pdf, C.coral);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE DATE', dateX, dateY, { align: 'right' });
  setC(pdf, C.navy);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(fmtDate(invoice.createdAt), dateX, dateY + 5, { align: 'right' });

  dateY += 12;
  setC(pdf, C.coral);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DUE DATE', dateX, dateY, { align: 'right' });
  setC(pdf, C.navy);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(fmtDate(invoice.dueDate), dateX, dateY + 5, { align: 'right' });

  // Business details right
  dateY += 14;
  setC(pdf, C.coral);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FROM', dateX, dateY, { align: 'right' });
  setC(pdf, C.mid);
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  const biz = [business.address, [business.city, business.country].filter(Boolean).join(', '), business.taxId ? `Tax: ${business.taxId}` : ''].filter(Boolean);
  biz.forEach((l, i) => { pdf.text(l, dateX, dateY + 4.5 + i * 3.5, { align: 'right' }); });

  y = Math.max(y + cl.length * 3.8, dateY + 4.5 + biz.length * 3.5) + 8;

  // === TABLE ===
  const cols = {
    desc: { x: MX + 2, w: 78 },
    qty: { x: MX + 84, w: 18 },
    price: { x: MX + 108, w: 26 },
    tax: { x: MX + 138, w: 16 },
    amt: { x: PW - MX - 2 },
  };

  const drawHeader = (yy: number) => {
    // Coral header row
    pdf.setFillColor(C.coral[0], C.coral[1], C.coral[2]);
    pdf.roundedRect(MX, yy, CW, 8, 1.5, 1.5, 'F');
    setC(pdf, C.white);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DESCRIPTION', cols.desc.x, yy + 5.5);
    pdf.text('QTY', cols.qty.x + cols.qty.w / 2, yy + 5.5, { align: 'center' });
    pdf.text('PRICE', cols.price.x + cols.price.w, yy + 5.5, { align: 'right' });
    pdf.text('TAX', cols.tax.x + cols.tax.w / 2, yy + 5.5, { align: 'center' });
    pdf.text('AMOUNT', cols.amt.x, yy + 5.5, { align: 'right' });
    return yy + 11;
  };

  y = drawHeader(y);

  const rowH = 9;
  invoice.items.forEach((item, idx) => {
    if (y + rowH > PH - 35) { pdf.addPage(); y = drawHeader(MY); }

    const total = item.quantity * item.price;
    const disc = total * (item.discount / 100);
    const amt = total - disc;

    // Alternating rows
    if (idx % 2 === 0) {
      pdf.setFillColor(C.tableBg[0], C.tableBg[1], C.tableBg[2]);
      pdf.rect(MX, y - 1, CW, rowH, 'F');
    }

    setC(pdf, C.navy);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const desc = pdf.splitTextToSize(item.description || 'Item', cols.desc.w)[0];
    pdf.text(desc, cols.desc.x, y + 5);

    setC(pdf, C.mid);
    pdf.text(item.quantity.toString(), cols.qty.x + cols.qty.w / 2, y + 5, { align: 'center' });
    pdf.text(fmt(item.price, cs), cols.price.x + cols.price.w, y + 5, { align: 'right' });
    pdf.text(`${item.taxRate}%`, cols.tax.x + cols.tax.w / 2, y + 5, { align: 'center' });

    setC(pdf, C.navy);
    pdf.setFont('helvetica', 'bold');
    pdf.text(fmt(amt, cs), cols.amt.x, y + 5, { align: 'right' });
    pdf.setFont('helvetica', 'normal');

    if (item.discount > 0) {
      pdf.setFontSize(6);
      setC(pdf, C.orange);
      pdf.text(`−${item.discount}% discount`, cols.desc.x, y + 8.5);
      y += 3;
    }

    y += rowH;
  });

  y += 8;

  // === TOTALS ===
  if (y + 45 > PH - 30) { pdf.addPage(); y = MY; }
  const lx = PW - MX - 55;
  const vx = PW - MX;

  setC(pdf, C.mid);
  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Subtotal', lx, y, { align: 'right' });
  setC(pdf, C.navy);
  pdf.text(fmt(invoice.subtotal, cs), vx, y, { align: 'right' });

  y += 6;
  setC(pdf, C.mid);
  pdf.text('Tax', lx, y, { align: 'right' });
  setC(pdf, C.navy);
  pdf.text(fmt(invoice.taxTotal, cs), vx, y, { align: 'right' });

  if (invoice.discountTotal > 0) {
    y += 6;
    setC(pdf, C.mid);
    pdf.text('Discount', lx, y, { align: 'right' });
    setC(pdf, C.coral);
    pdf.text(`−${fmt(invoice.discountTotal, cs)}`, vx, y, { align: 'right' });
  }

  y += 5;
  // Grand total highlight box
  const totalBoxW = 65;
  const totalBoxH = 12;
  const totalBoxX = vx - totalBoxW;
  pdf.setFillColor(C.coral[0], C.coral[1], C.coral[2]);
  pdf.roundedRect(totalBoxX, y, totalBoxW, totalBoxH, 2, 2, 'F');
  setC(pdf, C.white);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL', totalBoxX + 8, y + 7.5);
  pdf.setFontSize(12);
  pdf.text(fmt(invoice.total, cs), vx - 4, y + 8, { align: 'right' });
  y += totalBoxH + 12;

  // === NOTES ===
  if (invoice.notes) {
    if (y + 15 > PH - 30) { pdf.addPage(); y = MY; }
    setC(pdf, C.coral);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Notes', MX, y);
    y += 4;
    setC(pdf, C.mid);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    const nl = pdf.splitTextToSize(invoice.notes, CW * 0.6);
    pdf.text(nl, MX, y);
    y += nl.length * 3.5 + 6;
  }

  // === QR ===
  if (invoice.paymentQR) {
    try {
      if (y + 28 > PH - 30) { pdf.addPage(); y = MY; }
      const qr = await QRCode.toDataURL(invoice.paymentQR, { width: 200, margin: 1 });
      pdf.addImage(qr, 'PNG', PW - MX - 22, y, 22, 22);
      setC(pdf, C.coral);
      pdf.setFontSize(6.5);
      pdf.text('Scan to Pay', PW - MX - 11, y + 25, { align: 'center' });
    } catch {}
  }

  // === SIGNATURE ===
  if (sig) {
    const sy = PH - 48;
    addImg(pdf, sig, PW - MX - 38, sy, 32, 14);
    setC(pdf, C.light);
    pdf.setFontSize(6.5);
    pdf.text('Authorized Signature', PW - MX - 22, sy + 17, { align: 'center' });
  }

  // === FOOTER BAND ===
  pdf.setFillColor(C.coral[0], C.coral[1], C.coral[2]);
  pdf.rect(0, PH - 18, PW * 0.6, 18, 'F');
  pdf.setFillColor(C.orange[0], C.orange[1], C.orange[2]);
  pdf.rect(PW * 0.6, PH - 18, PW * 0.4, 18, 'F');

  setC(pdf, C.white);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('THANK YOU FOR YOUR BUSINESS', MX + 2, PH - 9);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text(business.footerText || business.email || '', PW - MX - 2, PH - 9, { align: 'right' });

  return pdf.output('blob');
}
