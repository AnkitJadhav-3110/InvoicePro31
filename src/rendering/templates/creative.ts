import { defineTemplate, DEFAULT_COLUMNS, DEFAULT_SPACING, palette, typography } from '../tokens';

export const creativeTemplate = defineTemplate({
  id: 'creative',
  name: 'Creative Orange',
  colors: palette({
    primary: '#ea580c',
    accent: '#f97316',
    surfaceAlt: '#fff7ed',
  }),
  typography: typography('helvetica'),
  spacing: DEFAULT_SPACING,
  header: {
    variant: 'bar',
    showLogo: true,
    align: 'split',
    accentBarWidthMm: 60,
    titleLabel: 'INVOICE',
  },
  meta: { layout: 'stacked-right' },
  billTo: { layout: 'to-from' },
  itemsTable: { columns: DEFAULT_COLUMNS, zebra: true, headerFill: true, showRowDivider: false },
  totals: { align: 'right', emphasizeTotal: true },
  notes: { show: true, boxed: true },
  payment: { showQr: true },
  signature: { show: true, label: 'Authorized Signature' },
  footer: { variant: 'branded', showPageNumbers: true, showBrandWordmark: true },
});
