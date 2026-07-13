import { defineTemplate, DEFAULT_COLUMNS, DEFAULT_SPACING, palette, typography } from '../tokens';

export const bwTemplate = defineTemplate({
  id: 'bw',
  name: 'Minimal B/W',
  colors: palette({
    primary: '#000000',
    accent: '#000000',
    text: '#000000',
    border: '#000000',
    surfaceAlt: '#f3f4f6',
  }),
  typography: typography('helvetica'),
  spacing: DEFAULT_SPACING,
  header: {
    variant: 'block',
    showLogo: true,
    align: 'split',
    uppercaseBusinessName: true,
    titleLabel: 'INVOICE',
  },
  meta: { layout: 'stacked-right' },
  billTo: { layout: 'single' },
  itemsTable: { columns: DEFAULT_COLUMNS, zebra: false, headerFill: true, showRowDivider: true },
  totals: { align: 'right', emphasizeTotal: true },
  notes: { show: true, boxed: false },
  payment: { showQr: true },
  signature: { show: true, label: 'Authorized Signature' },
  footer: { variant: 'minimal', showPageNumbers: true, showBrandWordmark: true },
});
