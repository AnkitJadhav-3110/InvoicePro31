import { defineTemplate, DEFAULT_COLUMNS, DEFAULT_SPACING, palette, typography } from '../tokens';
import { minimalTemplate } from './minimal';
import type { TemplateConfig } from '../types';

/** Modern gradient — same structure as minimal but bolder accent. */
export const modernTemplate = defineTemplate({
  ...minimalTemplate,
  id: 'modern',
  name: 'Modern Gradient',
  colors: palette({ primary: '#6d28d9', accent: '#7c3aed', surfaceAlt: '#f5f3ff' }),
  header: { ...minimalTemplate.header, variant: 'bar', accentBarWidthMm: 210 },
});

export const darkTemplate: TemplateConfig = defineTemplate({
  ...minimalTemplate,
  id: 'dark',
  name: 'Midnight',
  colors: palette({
    pageBackground: '#111827',
    surface: '#111827',
    surfaceAlt: '#1f2937',
    text: '#f9fafb',
    muted: '#9ca3af',
    border: '#374151',
    primary: '#10b981',
    accent: '#34d399',
    onPrimary: '#111827',
  }),
});

export const cleanTemplate: TemplateConfig = defineTemplate({
  ...minimalTemplate,
  id: 'clean',
  name: 'Clean Teal',
  colors: palette({ primary: '#0d9488', accent: '#14b8a6', surfaceAlt: '#f0fdfa' }),
});

export const tealTemplate: TemplateConfig = defineTemplate({
  ...minimalTemplate,
  id: 'teal',
  name: 'Corporate Teal',
  colors: palette({ primary: '#5ba4a4', accent: '#5ba4a4', surfaceAlt: '#f0fdfa' }),
  header: { ...minimalTemplate.header, variant: 'accent-left', accentBarWidthMm: 3 },
  billTo: { layout: 'to-from' },
  itemsTable: {
    columns: [
      { key: 'description', label: 'DESCRIPTION', align: 'left', widthFraction: 0.55 },
      { key: 'quantity', label: 'QUANTITY', align: 'center', widthFraction: 0.12 },
      { key: 'price', label: 'RATE', align: 'right', widthFraction: 0.16 },
      { key: 'amount', label: 'AMOUNT', align: 'right', widthFraction: 0.17 },
    ],
    zebra: false,
    headerFill: false,
    showRowDivider: true,
  },
});

export const classicTemplate: TemplateConfig = defineTemplate({
  ...minimalTemplate,
  id: 'classic',
  name: 'Classic',
  colors: palette({ primary: '#111827', accent: '#374151' }),
  itemsTable: { ...minimalTemplate.itemsTable, columns: DEFAULT_COLUMNS },
  spacing: DEFAULT_SPACING,
  typography: typography('helvetica'),
});
