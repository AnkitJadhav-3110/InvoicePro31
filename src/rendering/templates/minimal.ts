import { defineTemplate, DEFAULT_COLUMNS, DEFAULT_SPACING, palette, typography } from '../tokens';

export const minimalTemplate = defineTemplate({
  id: 'minimal',
  name: 'Minimal',
  colors: palette({ primary: '#111827', accent: '#111827' }),
  typography: typography('helvetica'),
  spacing: DEFAULT_SPACING,
  header: { variant: 'minimal', showLogo: true, align: 'split', titleLabel: 'INVOICE' },
  meta: { layout: 'stacked-right' },
  billTo: { layout: 'single' },
  itemsTable: { columns: DEFAULT_COLUMNS, zebra: true, headerFill: true, showRowDivider: true },
  totals: { align: 'right', emphasizeTotal: true },
  notes: { show: true, boxed: false },
  payment: { showQr: true },
  signature: { show: true, label: 'Authorized Signature' },
  footer: { variant: 'branded', showPageNumbers: true, showBrandWordmark: true },
});
