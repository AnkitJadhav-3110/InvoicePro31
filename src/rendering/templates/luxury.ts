import { defineTemplate, DEFAULT_COLUMNS, DEFAULT_SPACING, palette, typography } from '../tokens';

export const luxuryTemplate = defineTemplate({
  id: 'luxury',
  name: 'Dark Luxury',
  colors: palette({
    pageBackground: '#0f172a',
    surface: '#0f172a',
    surfaceAlt: '#1e293b',
    text: '#f8fafc',
    muted: '#cbd5e1',
    border: '#334155',
    primary: '#facc15',
    accent: '#eab308',
    onPrimary: '#0f172a',
  }),
  typography: typography('times'),
  spacing: DEFAULT_SPACING,
  header: { variant: 'block', showLogo: true, align: 'split', titleLabel: 'INVOICE' },
  meta: { layout: 'stacked-right' },
  billTo: { layout: 'to-from' },
  itemsTable: { columns: DEFAULT_COLUMNS, zebra: true, headerFill: true, showRowDivider: true },
  totals: { align: 'right', emphasizeTotal: true },
  notes: { show: true, boxed: true },
  payment: { showQr: true },
  signature: { show: true, label: 'Authorized Signature' },
  footer: { variant: 'branded', showPageNumbers: true, showBrandWordmark: true },
});
