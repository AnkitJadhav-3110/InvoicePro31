import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Invoice, Client, Business, AppSettings } from '@/store/useStore';

export async function generateInvoicePDF(
  invoice: Invoice | Omit<Invoice, 'id'>,
  client: Client,
  business: Business,
  settings: AppSettings
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getColors = () => {
    switch (invoice.template) {
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
  };

  const colors = getColors();

  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(0, 0, pageWidth, 45, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(business.name, margin, 25);

  pdf.setFontSize(28);
  pdf.text('INVOICE', pageWidth - margin, 20, { align: 'right' });
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoice.invoiceNumber, pageWidth - margin, 30, { align: 'right' });

  y = 60;

  if (invoice.isPaid) {
    pdf.setTextColor(34, 197, 94);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PAID', pageWidth - margin - 30, 70, { align: 'center' });
    pdf.setDrawColor(34, 197, 94);
    pdf.setLineWidth(2);
    pdf.rect(pageWidth - margin - 50, 58, 40, 18);
  }

  pdf.setTextColor(75, 85, 99);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FROM', margin, y);
  pdf.text('BILL TO', pageWidth / 2 + 10, y);

  y += 6;
  pdf.setTextColor(17, 24, 39);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(business.name, margin, y);
  pdf.text(client.name, pageWidth / 2 + 10, y);

  y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
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

  businessLines.forEach((line, i) => {
    pdf.text(line, margin, y + i * 4);
  });

  clientLines.forEach((line, i) => {
    pdf.text(line, pageWidth / 2 + 10, y + i * 4);
  });

  y += Math.max(businessLines.length, clientLines.length) * 4 + 10;

  pdf.setFillColor(249, 250, 251);
  pdf.rect(margin, y, pageWidth - margin * 2, 12, 'F');
  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(8);
  pdf.text('Invoice Date', margin + 5, y + 5);
  pdf.text('Due Date', margin + 60, y + 5);
  pdf.setTextColor(17, 24, 39);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(formatDate(invoice.createdAt), margin + 5, y + 10);
  pdf.text(formatDate(invoice.dueDate), margin + 60, y + 10);

  y += 20;

  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(margin, y, pageWidth - margin * 2, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DESCRIPTION', margin + 3, y + 5.5);
  pdf.text('QTY', margin + 95, y + 5.5, { align: 'center' });
  pdf.text('PRICE', margin + 115, y + 5.5, { align: 'center' });
  pdf.text('TAX', margin + 135, y + 5.5, { align: 'center' });
  pdf.text('AMOUNT', pageWidth - margin - 3, y + 5.5, { align: 'right' });

  y += 12;

  pdf.setTextColor(17, 24, 39);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  invoice.items.forEach((item, index) => {
    const lineTotal = item.quantity * item.price;
    const lineDiscount = lineTotal * (item.discount / 100);
    const amount = lineTotal - lineDiscount;

    if (index % 2 === 0) {
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, y - 3, pageWidth - margin * 2, 10, 'F');
    }

    pdf.setTextColor(17, 24, 39);
    pdf.text(item.description || 'Item', margin + 3, y + 3);
    pdf.setTextColor(107, 114, 128);
    pdf.text(item.quantity.toString(), margin + 95, y + 3, { align: 'center' });
    pdf.text(formatCurrency(item.price), margin + 115, y + 3, { align: 'center' });
    pdf.text(`${item.taxRate}%`, margin + 135, y + 3, { align: 'center' });
    pdf.setTextColor(17, 24, 39);
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatCurrency(amount), pageWidth - margin - 3, y + 3, { align: 'right' });
    pdf.setFont('helvetica', 'normal');

    y += 10;
  });

  y += 5;

  const totalsX = pageWidth - margin - 60;
  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(9);
  pdf.text('Subtotal', totalsX, y);
  pdf.setTextColor(17, 24, 39);
  pdf.text(formatCurrency(invoice.subtotal), pageWidth - margin, y, { align: 'right' });

  if (invoice.discountTotal > 0) {
    y += 6;
    pdf.setTextColor(107, 114, 128);
    pdf.text('Discount', totalsX, y);
    pdf.setTextColor(220, 38, 38);
    pdf.text(`-${formatCurrency(invoice.discountTotal)}`, pageWidth - margin, y, { align: 'right' });
  }

  y += 6;
  pdf.setTextColor(107, 114, 128);
  pdf.text('Tax', totalsX, y);
  pdf.setTextColor(17, 24, 39);
  pdf.text(formatCurrency(invoice.taxTotal), pageWidth - margin, y, { align: 'right' });

  y += 8;
  pdf.setDrawColor(229, 231, 235);
  pdf.line(totalsX - 10, y - 3, pageWidth - margin, y - 3);

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('TOTAL', totalsX, y + 2);
  pdf.text(formatCurrency(invoice.total), pageWidth - margin, y + 2, { align: 'right' });

  if (invoice.notes) {
    y += 20;
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Notes', margin, y);
    y += 5;
    pdf.setTextColor(107, 114, 128);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const notesLines = pdf.splitTextToSize(invoice.notes, pageWidth - margin * 2);
    pdf.text(notesLines, margin, y);
  }

  if (invoice.paymentQR) {
    try {
      const qrDataUrl = await QRCode.toDataURL(invoice.paymentQR, { width: 200, margin: 1 });
      pdf.addImage(qrDataUrl, 'PNG', pageWidth - margin - 25, y + 10, 25, 25);
      pdf.setFontSize(7);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Scan to Pay', pageWidth - margin - 12.5, y + 38, { align: 'center' });
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  }

  if (business.footerText) {
    pdf.setTextColor(156, 163, 175);
    pdf.setFontSize(8);
    pdf.text(business.footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });
  }

  pdf.save(`${invoice.invoiceNumber}.pdf`);
}
