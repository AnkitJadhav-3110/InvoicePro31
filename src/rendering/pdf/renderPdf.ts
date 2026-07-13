import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import type { RenderModel, TemplateConfig, ItemsColumn } from '../types';
import { formatCurrency, formatDate } from '../buildRenderModel';
import { hexToRgb } from '../tokens';

const PAGE_W = 210;
const PAGE_H = 297;

interface Ctx {
  pdf: jsPDF;
  cfg: TemplateConfig;
  model: RenderModel;
  contentW: number;
  marginX: number;
  marginY: number;
  cs: string;
  y: number;
}

function setText(pdf: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  pdf.setTextColor(r, g, b);
}
function setFill(pdf: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  pdf.setFillColor(r, g, b);
}
function setDraw(pdf: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  pdf.setDrawColor(r, g, b);
}

function paintPageBackground(ctx: Ctx) {
  const bg = ctx.cfg.colors.pageBackground;
  if (bg && bg.toLowerCase() !== '#ffffff') {
    setFill(ctx.pdf, bg);
    ctx.pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');
  }
}

/* ────────────────────────────  HEADER  ──────────────────────────── */

function drawHeader(ctx: Ctx) {
  const { pdf, cfg, model, marginX } = ctx;
  paintPageBackground(ctx);

  // Optional accent bar (left or top).
  if (cfg.header.variant === 'accent-left' && cfg.header.accentBarWidthMm) {
    setFill(pdf, cfg.colors.primary);
    pdf.rect(0, 0, cfg.header.accentBarWidthMm, PAGE_H, 'F');
  } else if (cfg.header.variant === 'bar' && cfg.header.accentBarWidthMm) {
    setFill(pdf, cfg.colors.primary);
    pdf.rect(0, 0, cfg.header.accentBarWidthMm, 3, 'F');
  }

  let y = ctx.marginY;

  // Business block (left).
  let leftY = y;
  if (cfg.header.showLogo && model.business.logoDataUrl) {
    try {
      const fmt = model.business.logoDataUrl.includes('image/jpeg') ? 'JPEG' : 'PNG';
      pdf.addImage(model.business.logoDataUrl, fmt, marginX, y, 28, 18);
      leftY = y + 20;
    } catch {
      /* ignore */
    }
  }

  setText(pdf, cfg.colors.text);
  pdf.setFont(cfg.typography.family, 'bold');
  pdf.setFontSize(cfg.typography.h2);
  const bizName = cfg.header.uppercaseBusinessName
    ? model.business.name.toUpperCase()
    : model.business.name;
  pdf.text(bizName, marginX, leftY + 5);
  leftY += 9;

  setText(pdf, cfg.colors.muted);
  pdf.setFont(cfg.typography.family, 'normal');
  pdf.setFontSize(cfg.typography.small);
  const bizLines = [
    model.business.address,
    [model.business.city, model.business.country].filter(Boolean).join(', '),
    model.business.email,
    model.business.phone,
    model.business.taxId ? `Tax ID: ${model.business.taxId}` : '',
  ].filter(Boolean);
  bizLines.forEach((line, i) => pdf.text(line, marginX, leftY + i * 4));
  const leftBottom = leftY + bizLines.length * 4;

  // Title + meta (right).
  const rightX = PAGE_W - marginX;
  setText(pdf, cfg.colors.primary);
  pdf.setFont(cfg.typography.family, 'bold');
  pdf.setFontSize(cfg.typography.h1);
  pdf.text(cfg.header.titleLabel, rightX, y + 8, { align: 'right' });

  setText(pdf, cfg.colors.muted);
  pdf.setFont(cfg.typography.family, 'normal');
  pdf.setFontSize(cfg.typography.body + 1);
  pdf.text(model.invoice.number, rightX, y + 15, { align: 'right' });

  const dateY = y + 24;
  setText(pdf, cfg.colors.muted);
  pdf.setFontSize(cfg.typography.micro + 0.5);
  pdf.setFont(cfg.typography.family, 'bold');
  pdf.text('INVOICE DATE', rightX, dateY, { align: 'right' });
  setText(pdf, cfg.colors.text);
  pdf.setFont(cfg.typography.family, 'normal');
  pdf.setFontSize(cfg.typography.body);
  pdf.text(formatDate(model.invoice.issuedOn), rightX, dateY + 5, { align: 'right' });

  setText(pdf, cfg.colors.muted);
  pdf.setFontSize(cfg.typography.micro + 0.5);
  pdf.setFont(cfg.typography.family, 'bold');
  pdf.text('DUE DATE', rightX, dateY + 12, { align: 'right' });
  setText(pdf, cfg.colors.text);
  pdf.setFont(cfg.typography.family, 'normal');
  pdf.setFontSize(cfg.typography.body);
  pdf.text(formatDate(model.invoice.dueOn), rightX, dateY + 17, { align: 'right' });

  ctx.y = Math.max(leftBottom, dateY + 22) + 6;

  // Divider.
  setDraw(pdf, cfg.colors.border);
  pdf.setLineWidth(0.4);
  pdf.line(marginX, ctx.y, PAGE_W - marginX, ctx.y);
  ctx.y += 6;
}

/* ────────────────────────────  BILL TO  ──────────────────────────── */

function drawBillTo(ctx: Ctx) {
  const { pdf, cfg, model, marginX } = ctx;
  const isSplit = cfg.billTo.layout === 'to-from';
  const colW = isSplit ? (ctx.contentW - 8) / 2 : ctx.contentW;

  const drawParty = (
    x: number,
    label: string,
    name: string,
    lines: string[],
  ) => {
    setText(pdf, cfg.colors.muted);
    pdf.setFontSize(cfg.typography.micro + 0.5);
    pdf.setFont(cfg.typography.family, 'bold');
    pdf.text(label, x, ctx.y);
    setText(pdf, cfg.colors.text);
    pdf.setFontSize(cfg.typography.h2 - 2);
    pdf.text(name, x, ctx.y + 5);
    setText(pdf, cfg.colors.muted);
    pdf.setFont(cfg.typography.family, 'normal');
    pdf.setFontSize(cfg.typography.small);
    lines.forEach((l, i) => pdf.text(l, x, ctx.y + 10 + i * 4));
  };

  const clientLines = [
    model.client.address,
    [model.client.city, model.client.country].filter(Boolean).join(', '),
    model.client.email,
    model.client.phone,
    model.client.taxId ? `Tax ID: ${model.client.taxId}` : '',
  ].filter(Boolean);

  drawParty(marginX, 'BILL TO', model.client.name, clientLines);

  if (isSplit) {
    const bizLines = [
      model.business.address,
      [model.business.city, model.business.country].filter(Boolean).join(', '),
      model.business.email,
    ].filter(Boolean);
    drawParty(marginX + colW + 8, 'FROM', model.business.name, bizLines);
  }

  ctx.y += 10 + Math.max(clientLines.length, 4) * 4 + 4;
  void colW;
}

/* ────────────────────────────  ITEMS TABLE  ──────────────────────────── */

function columnRanges(cols: ItemsColumn[], startX: number, totalW: number) {
  const ranges: Array<{ col: ItemsColumn; x: number; w: number }> = [];
  let x = startX;
  for (const c of cols) {
    const w = totalW * c.widthFraction;
    ranges.push({ col: c, x, w });
    x += w;
  }
  return ranges;
}

function drawTableHeader(ctx: Ctx): number {
  const { pdf, cfg, marginX, contentW } = ctx;
  const rowH = 8;
  if (cfg.itemsTable.headerFill) {
    setFill(pdf, cfg.colors.surfaceAlt);
    pdf.rect(marginX, ctx.y, contentW, rowH, 'F');
  }
  setDraw(pdf, cfg.colors.border);
  pdf.setLineWidth(0.5);
  pdf.line(marginX, ctx.y + rowH, PAGE_W - marginX, ctx.y + rowH);

  setText(pdf, cfg.colors.muted);
  pdf.setFont(cfg.typography.family, 'bold');
  pdf.setFontSize(cfg.typography.micro + 0.5);

  for (const { col, x, w } of columnRanges(cfg.itemsTable.columns, marginX, contentW)) {
    const tx = col.align === 'right' ? x + w - 2 : col.align === 'center' ? x + w / 2 : x + 2;
    pdf.text(col.label, tx, ctx.y + 5.5, { align: col.align });
  }
  return ctx.y + rowH + 2;
}

function drawTableRow(ctx: Ctx, item: RenderModel['items'][number], index: number) {
  const { pdf, cfg, marginX, contentW, cs } = ctx;
  const rowH = 8;
  if (cfg.itemsTable.zebra && index % 2 === 0) {
    setFill(pdf, cfg.colors.surfaceAlt);
    pdf.rect(marginX, ctx.y - 1, contentW, rowH, 'F');
  }
  setText(pdf, cfg.colors.text);
  pdf.setFont(cfg.typography.family, 'normal');
  pdf.setFontSize(cfg.typography.body - 0.5);

  for (const { col, x, w } of columnRanges(cfg.itemsTable.columns, marginX, contentW)) {
    let value = '';
    switch (col.key) {
      case 'description':
        value = pdf.splitTextToSize(item.description, w - 4)[0] ?? '';
        break;
      case 'quantity':
        value = String(item.quantity);
        break;
      case 'price':
        value = formatCurrency(item.price, cs);
        break;
      case 'tax':
        value = `${item.taxRate}%`;
        break;
      case 'amount':
        value = formatCurrency(item.amount, cs);
        break;
    }
    if (!value) continue;
    const tx = col.align === 'right' ? x + w - 2 : col.align === 'center' ? x + w / 2 : x + 2;
    if (col.key === 'amount') pdf.setFont(cfg.typography.family, 'bold');
    pdf.text(value, tx, ctx.y + 5, { align: col.align });
    if (col.key === 'amount') pdf.setFont(cfg.typography.family, 'normal');
  }

  if (cfg.itemsTable.showRowDivider) {
    setDraw(pdf, cfg.colors.border);
    pdf.setLineWidth(0.2);
    pdf.line(marginX, ctx.y + rowH - 1, PAGE_W - marginX, ctx.y + rowH - 1);
  }
  ctx.y += rowH;
}

function drawItems(ctx: Ctx) {
  ctx.y = drawTableHeader(ctx);
  ctx.model.items.forEach((item, i) => {
    if (ctx.y + 12 > PAGE_H - 30) {
      ctx.pdf.addPage();
      paintPageBackground(ctx);
      ctx.y = ctx.marginY;
      ctx.y = drawTableHeader(ctx);
    }
    drawTableRow(ctx, item, i);
  });
  ctx.y += 4;
}

/* ────────────────────────────  TOTALS  ──────────────────────────── */

function drawTotals(ctx: Ctx) {
  const { pdf, cfg, model, cs, marginX, contentW } = ctx;
  if (ctx.y + 40 > PAGE_H - 30) {
    pdf.addPage();
    paintPageBackground(ctx);
    ctx.y = ctx.marginY;
  }
  const labelX = marginX + contentW - 55;
  const valueX = marginX + contentW;

  const line = (label: string, value: string, opts: { bold?: boolean; color?: string } = {}) => {
    setText(pdf, cfg.colors.muted);
    pdf.setFont(cfg.typography.family, 'normal');
    pdf.setFontSize(cfg.typography.body);
    pdf.text(label, labelX, ctx.y, { align: 'right' });
    setText(pdf, opts.color ?? cfg.colors.text);
    pdf.setFont(cfg.typography.family, opts.bold ? 'bold' : 'normal');
    pdf.text(value, valueX, ctx.y, { align: 'right' });
    ctx.y += 6;
  };

  line('Subtotal', formatCurrency(model.totals.subtotal, cs));
  line('Tax', formatCurrency(model.totals.taxTotal, cs));
  if (model.totals.discountTotal > 0) {
    line('Discount', `-${formatCurrency(model.totals.discountTotal, cs)}`, { color: cfg.colors.danger });
  }

  setDraw(pdf, cfg.colors.text);
  pdf.setLineWidth(0.6);
  pdf.line(labelX - 10, ctx.y, valueX, ctx.y);
  ctx.y += 6;

  setText(pdf, cfg.colors.primary);
  pdf.setFont(cfg.typography.family, 'bold');
  pdf.setFontSize(cfg.typography.h2 - 1);
  pdf.text('Total', labelX, ctx.y, { align: 'right' });
  pdf.text(formatCurrency(model.totals.grandTotal, cs), valueX, ctx.y, { align: 'right' });
  ctx.y += 10;
}

/* ────────────────────────────  NOTES / QR / SIG  ──────────────────────────── */

function drawNotes(ctx: Ctx) {
  const { pdf, cfg, model, marginX, contentW } = ctx;
  if (!cfg.notes.show || !model.invoice.notes) return;
  if (ctx.y + 20 > PAGE_H - 30) {
    pdf.addPage();
    paintPageBackground(ctx);
    ctx.y = ctx.marginY;
  }
  if (cfg.notes.boxed) {
    setFill(pdf, cfg.colors.surfaceAlt);
    pdf.rect(marginX, ctx.y, contentW * 0.65, 18, 'F');
    ctx.y += 3;
  }
  setText(pdf, cfg.colors.text);
  pdf.setFont(cfg.typography.family, 'bold');
  pdf.setFontSize(cfg.typography.small);
  pdf.text('Notes', marginX + (cfg.notes.boxed ? 3 : 0), ctx.y + 3);
  ctx.y += 5;

  setText(pdf, cfg.colors.muted);
  pdf.setFont(cfg.typography.family, 'normal');
  pdf.setFontSize(cfg.typography.small);
  const lines = pdf.splitTextToSize(model.invoice.notes, contentW * 0.6);
  pdf.text(lines, marginX + (cfg.notes.boxed ? 3 : 0), ctx.y);
  ctx.y += lines.length * 4 + 6;
}

async function drawQr(ctx: Ctx) {
  const { pdf, cfg, model, marginX, contentW } = ctx;
  if (!cfg.payment.showQr || !model.invoice.paymentQR) return;
  try {
    const url = await QRCode.toDataURL(model.invoice.paymentQR, { width: 200, margin: 1 });
    const size = 22;
    const x = marginX + contentW - size;
    pdf.addImage(url, 'PNG', x, ctx.y, size, size);
    setText(pdf, cfg.colors.muted);
    pdf.setFontSize(cfg.typography.micro);
    pdf.text('Scan to Pay', x + size / 2, ctx.y + size + 3, { align: 'center' });
    ctx.y += size + 8;
  } catch {
    /* ignore */
  }
}

function drawSignature(ctx: Ctx) {
  const { pdf, cfg, model, marginX, contentW } = ctx;
  if (!cfg.signature.show || !model.business.signatureDataUrl) return;
  const sigY = PAGE_H - 48;
  try {
    const fmt = model.business.signatureDataUrl.includes('image/jpeg') ? 'JPEG' : 'PNG';
    pdf.addImage(model.business.signatureDataUrl, fmt, marginX + contentW - 34, sigY, 32, 14);
    setText(pdf, cfg.colors.muted);
    pdf.setFontSize(cfg.typography.micro);
    pdf.text(cfg.signature.label, marginX + contentW - 18, sigY + 17, { align: 'center' });
  } catch {
    /* ignore */
  }
}

/* ────────────────────────────  FOOTER / RUNNING HEADER  ──────────────────────────── */

function paintFootersAndRunningHeaders(ctx: Ctx) {
  const { pdf, cfg, model, marginX } = ctx;
  if (cfg.footer.variant === 'none') return;

  const total = pdf.getNumberOfPages();
  const footerY = PAGE_H - 18;
  const domain = model.business.email ? model.business.email.split('@')[1] : '';
  const tagline = model.business.footerText || 'Thank you for your business.';

  for (let p = 1; p <= total; p++) {
    pdf.setPage(p);

    if (p > 1) {
      setText(pdf, cfg.colors.muted);
      pdf.setFont(cfg.typography.family, 'normal');
      pdf.setFontSize(cfg.typography.micro);
      pdf.text(model.business.name, marginX, 10);
      pdf.text(
        `Invoice ${model.invoice.number} — continued`,
        PAGE_W - marginX,
        10,
        { align: 'right' },
      );
    }

    setDraw(pdf, cfg.colors.border);
    pdf.setLineWidth(0.3);
    pdf.line(marginX, footerY, PAGE_W - marginX, footerY);

    setText(pdf, cfg.colors.muted);
    pdf.setFont(cfg.typography.family, 'normal');
    pdf.setFontSize(cfg.typography.micro);
    pdf.text(tagline, PAGE_W / 2, footerY + 5, { align: 'center' });
    if (domain) {
      pdf.setFontSize(cfg.typography.micro - 0.5);
      pdf.text(`www.${domain}`, PAGE_W / 2, footerY + 9, { align: 'center' });
    }

    if (cfg.footer.showBrandWordmark) {
      pdf.setFont(cfg.typography.family, 'bold');
      pdf.setFontSize(cfg.typography.micro);
      setText(pdf, cfg.colors.text);
      pdf.text('Invoice', marginX, footerY + 5);
      const invW = pdf.getTextWidth('Invoice');
      setText(pdf, cfg.colors.primary);
      pdf.text('Pro', marginX + invW, footerY + 5);
      setText(pdf, cfg.colors.muted);
      pdf.setFont(cfg.typography.family, 'normal');
      pdf.setFontSize(cfg.typography.micro - 1);
      pdf.text(model.branding.tagline, marginX, footerY + 9);
    }

    if (cfg.footer.showPageNumbers) {
      pdf.setFont(cfg.typography.family, 'normal');
      pdf.setFontSize(cfg.typography.micro);
      setText(pdf, cfg.colors.muted);
      pdf.text(`Page ${p} of ${total}`, PAGE_W - marginX, footerY + 5, {
        align: 'right',
      });
    }
  }
}

/* ────────────────────────────  ENTRYPOINT  ──────────────────────────── */

export async function renderPdf(
  model: RenderModel,
  cfg: TemplateConfig,
): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const marginX = cfg.spacing.pageMarginX;
  const marginY = cfg.spacing.pageMarginY;
  const ctx: Ctx & { items?: number } = {
    pdf,
    cfg,
    model,
    marginX,
    marginY,
    contentW: PAGE_W - marginX * 2,
    cs: model.client.currencySymbol,
    y: marginY,
  };

  drawHeader(ctx);
  drawBillTo(ctx);
  drawItems(ctx);
  drawTotals(ctx);
  drawNotes(ctx);
  await drawQr(ctx);
  drawSignature(ctx);
  paintFootersAndRunningHeaders(ctx);

  return pdf.output('blob');
}
