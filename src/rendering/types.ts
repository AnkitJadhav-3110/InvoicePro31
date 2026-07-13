/**
 * Shared rendering model + template configuration types.
 *
 * Both the on-screen <TemplateRenderer/> and the jsPDF renderer consume the
 * SAME `RenderModel` + `TemplateConfig`, guaranteeing the live preview and
 * the downloaded PDF cannot drift.
 */

export type RgbTuple = readonly [number, number, number];

/**
 * Color palette. All values are hex ("#rrggbb"). The PDF renderer converts
 * to RGB at draw time; the preview renderer uses hex directly.
 */
export interface TemplateColors {
  primary: string;
  onPrimary: string;
  text: string;
  muted: string;
  border: string;
  surface: string;
  surfaceAlt: string;
  accent: string;
  danger: string;
  success: string;
  pageBackground: string;
}

export type FontFamily = 'helvetica' | 'times' | 'courier';

export interface TemplateTypography {
  family: FontFamily;
  /** Preview equivalent (CSS font-family stack) */
  familyCss: string;
  h1: number; // pt
  h2: number;
  body: number;
  small: number;
  micro: number;
}

export interface TemplateSpacing {
  pageMarginX: number; // mm (PDF) — preview scales via ratio
  pageMarginY: number;
  section: number;
  row: number;
  gutter: number;
}

export type HeaderVariant = 'bar' | 'block' | 'split' | 'minimal' | 'accent-left';
export type FooterVariant = 'branded' | 'minimal' | 'none';
export type TotalsAlign = 'right' | 'full-width';

export interface ItemsColumn {
  key: 'description' | 'quantity' | 'price' | 'tax' | 'amount';
  label: string; // header text
  align: 'left' | 'center' | 'right';
  /** Fractional width of the table (sum should be ~1.0) */
  widthFraction: number;
}

export interface TemplateConfig {
  id: string;
  name: string;
  colors: TemplateColors;
  typography: TemplateTypography;
  spacing: TemplateSpacing;

  header: {
    variant: HeaderVariant;
    showLogo: boolean;
    align: 'left' | 'right' | 'split';
    uppercaseBusinessName?: boolean;
    accentBarWidthMm?: number; // for accent-left / bar variants
    titleLabel: string; // "INVOICE"
  };

  meta: {
    layout: 'stacked-right' | 'below-header' | 'grid';
  };

  billTo: {
    layout: 'single' | 'to-from';
  };

  itemsTable: {
    columns: ItemsColumn[];
    zebra: boolean;
    headerFill: boolean;
    showRowDivider: boolean;
  };

  totals: {
    align: TotalsAlign;
    emphasizeTotal: boolean;
    showBalance?: boolean;
  };

  notes: { show: boolean; boxed: boolean };
  payment: { showQr: boolean };
  signature: { show: boolean; label: string };
  footer: {
    variant: FooterVariant;
    showPageNumbers: boolean;
    showBrandWordmark: boolean;
  };
}

/* ────────────────────────────  Render Model  ──────────────────────────── */

export interface RenderModelBusiness {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId?: string;
  logoDataUrl?: string;
  signatureDataUrl?: string;
  footerText?: string;
}

export interface RenderModelClient {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId?: string;
  currencySymbol: string;
}

export interface RenderModelInvoice {
  number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  isPaid: boolean;
  issuedOn: string; // ISO
  dueOn: string; // ISO
  notes?: string;
  paymentQR?: string;
}

export interface RenderModelItem {
  description: string;
  quantity: number;
  price: number;
  taxRate: number;
  discount: number;
  amount: number; // qty * price * (1 - discount/100)
}

export interface RenderModelTotals {
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
}

export interface RenderModel {
  business: RenderModelBusiness;
  client: RenderModelClient;
  invoice: RenderModelInvoice;
  items: RenderModelItem[];
  totals: RenderModelTotals;
  branding: { wordmark: 'InvoicePro'; tagline: string };
}
