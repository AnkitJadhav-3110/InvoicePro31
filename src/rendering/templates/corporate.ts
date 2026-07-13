import { defineTemplate, DEFAULT_SPACING, palette, typography } from '../tokens';
import type { ItemsColumn } from '../types';

const corporateColumns: ItemsColumn[] = [
  { key: 'description', label: 'Product Description', align: 'left', widthFraction: 0.5 },
  { key: 'quantity', label: 'Qty', align: 'center', widthFraction: 0.1 },
  { key: 'price', label: 'Unit Price', align: 'right', widthFraction: 0.15 },
  { key: 'tax', label: 'Tax', align: 'center', widthFraction: 0.1 },
  { key: 'amount', label: 'Amount', align: 'right', widthFraction: 0.15 },
];

export const corporateTemplate = defineTemplate({
  id: 'corporate',
  name: 'Corporate Blue',
  colors: palette({ primary: '#1e40af', accent: '#2563eb', surfaceAlt: '#eff6ff' }),
  typography: typography('helvetica'),
  spacing: DEFAULT_SPACING,
  header: {
    variant: 'accent-left',
    showLogo: true,
    align: 'split',
    accentBarWidthMm: 4,
    titleLabel: 'INVOICE',
  },
  meta: { layout: 'stacked-right' },
  billTo: { layout: 'single' },
  itemsTable: {
    columns: corporateColumns,
    zebra: true,
    headerFill: true,
    showRowDivider: true,
  },
  totals: { align: 'right', emphasizeTotal: true },
  notes: { show: true, boxed: true },
  payment: { showQr: true },
  signature: { show: true, label: 'Authorized Signature' },
  footer: { variant: 'branded', showPageNumbers: true, showBrandWordmark: true },
});
