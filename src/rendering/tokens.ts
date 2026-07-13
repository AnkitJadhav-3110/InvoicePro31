import type { ItemsColumn, TemplateColors, TemplateConfig, TemplateSpacing, TemplateTypography } from './types';

export const DEFAULT_COLUMNS: ItemsColumn[] = [
  { key: 'description', label: 'DESCRIPTION', align: 'left', widthFraction: 0.5 },
  { key: 'quantity', label: 'QTY', align: 'center', widthFraction: 0.1 },
  { key: 'price', label: 'PRICE', align: 'right', widthFraction: 0.15 },
  { key: 'tax', label: 'TAX', align: 'center', widthFraction: 0.1 },
  { key: 'amount', label: 'AMOUNT', align: 'right', widthFraction: 0.15 },
];

export const SIMPLE_COLUMNS: ItemsColumn[] = [
  { key: 'description', label: 'DESCRIPTION', align: 'left', widthFraction: 0.55 },
  { key: 'quantity', label: 'QTY', align: 'center', widthFraction: 0.12 },
  { key: 'price', label: 'RATE', align: 'right', widthFraction: 0.16 },
  { key: 'amount', label: 'AMOUNT', align: 'right', widthFraction: 0.17 },
];

export const DEFAULT_SPACING: TemplateSpacing = {
  pageMarginX: 18,
  pageMarginY: 18,
  section: 8,
  row: 9,
  gutter: 6,
};

export function typography(family: TemplateTypography['family']): TemplateTypography {
  const familyCss =
    family === 'helvetica'
      ? "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif"
      : family === 'times'
        ? "'Georgia', 'Times New Roman', Times, serif"
        : "'JetBrains Mono', 'Menlo', monospace";
  return { family, familyCss, h1: 24, h2: 13, body: 9, small: 7.5, micro: 6.5 };
}

export function palette(overrides: Partial<TemplateColors>): TemplateColors {
  return {
    primary: '#2563eb',
    onPrimary: '#ffffff',
    text: '#111827',
    muted: '#6b7280',
    border: '#e5e7eb',
    surface: '#ffffff',
    surfaceAlt: '#f9fafb',
    accent: '#3b82f6',
    danger: '#dc2626',
    success: '#16a34a',
    pageBackground: '#ffffff',
    ...overrides,
  };
}

/** Hex → [r,g,b] tuple for jsPDF. */
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function defineTemplate(cfg: TemplateConfig): TemplateConfig {
  return cfg;
}
