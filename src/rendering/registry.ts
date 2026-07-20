import type { TemplateConfig } from './types';
import { minimalTemplate } from './templates/minimal';
import { corporateTemplate } from './templates/corporate';
import { bwTemplate } from './templates/bw';
import { creativeTemplate } from './templates/creative';
import { luxuryTemplate } from './templates/luxury';
import {
  modernTemplate,
  darkTemplate,
  cleanTemplate,
  tealTemplate,
  classicTemplate,
} from './templates/variants';

/**
 * Template registry. To add a new template:
 *   1. Create `src/rendering/templates/<name>.ts` exporting a TemplateConfig.
 *   2. Add one line here.
 * The preview and PDF pick it up automatically — no other code changes.
 */
const REQUIRED_COLOR_KEYS = [
  'primary', 'onPrimary', 'text', 'muted', 'border',
  'surface', 'surfaceAlt', 'accent', 'danger', 'success', 'pageBackground',
] as const;

const REQUIRED_TYPOGRAPHY_KEYS = ['family', 'familyCss', 'h1', 'h2', 'body', 'small', 'micro'] as const;
const REQUIRED_SPACING_KEYS = ['pageMarginX', 'pageMarginY', 'section', 'row', 'gutter'] as const;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Runtime validator ensuring every registered TemplateConfig has the shape
 * both renderers (React preview + jsPDF) rely on. Throws at module load if a
 * template is malformed — failing fast beats a silently broken invoice.
 */
export function validateTemplateConfig(t: TemplateConfig): void {
  const err = (msg: string) => {
    throw new Error(`Invalid TemplateConfig "${t?.id ?? '<unknown>'}": ${msg}`);
  };
  if (!t || typeof t !== 'object') err('config is not an object');
  if (!t.id || typeof t.id !== 'string') err('missing string id');
  if (!t.name || typeof t.name !== 'string') err('missing string name');

  if (!t.colors) err('missing colors');
  const colors = t.colors as unknown as Record<string, unknown>;
  for (const k of REQUIRED_COLOR_KEYS) {
    const v = colors[k];
    if (typeof v !== 'string' || !HEX_RE.test(v)) err(`colors.${k} must be a #rrggbb hex`);
  }

  if (!t.typography) err('missing typography');
  const typo = t.typography as unknown as Record<string, unknown>;
  for (const k of REQUIRED_TYPOGRAPHY_KEYS) {
    if (typo[k] === undefined) err(`typography.${k} missing`);
  }
  if (!['helvetica', 'times', 'courier'].includes(t.typography.family)) {
    err(`typography.family must be helvetica|times|courier`);
  }

  if (!t.spacing) err('missing spacing');
  const spacing = t.spacing as unknown as Record<string, unknown>;
  for (const k of REQUIRED_SPACING_KEYS) {
    if (typeof spacing[k] !== 'number') err(`spacing.${k} must be a number`);
  }

  if (!t.header?.titleLabel) err('header.titleLabel required');
  if (!t.billTo?.layout) err('billTo.layout required');

  const cols = t.itemsTable?.columns;
  if (!Array.isArray(cols) || cols.length === 0) err('itemsTable.columns required');
  const sum = cols.reduce((s, c) => s + (c.widthFraction || 0), 0);
  if (Math.abs(sum - 1) > 0.02) err(`itemsTable.columns widthFraction must sum to ~1 (got ${sum.toFixed(2)})`);
  for (const c of cols) {
    if (!['description', 'quantity', 'price', 'tax', 'amount'].includes(c.key)) {
      err(`itemsTable column has unknown key "${c.key}"`);
    }
    if (!['left', 'center', 'right'].includes(c.align)) err(`itemsTable column "${c.key}" bad align`);
  }

  if (!t.totals) err('missing totals');
  if (!t.notes) err('missing notes');
  if (!t.payment) err('missing payment');
  if (!t.signature) err('missing signature');
  if (!t.footer) err('missing footer');
}

const TEMPLATES: readonly TemplateConfig[] = [
  minimalTemplate,
  corporateTemplate,
  bwTemplate,
  creativeTemplate,
  luxuryTemplate,
  modernTemplate,
  darkTemplate,
  cleanTemplate,
  tealTemplate,
  classicTemplate,
];

// Fail fast at import time — a malformed template must never reach a user.
TEMPLATES.forEach(validateTemplateConfig);
const ids = new Set<string>();
for (const t of TEMPLATES) {
  if (ids.has(t.id)) throw new Error(`Duplicate template id "${t.id}"`);
  ids.add(t.id);
}

const byId: ReadonlyMap<string, TemplateConfig> = new Map(
  TEMPLATES.map((t) => [t.id, t]),
);

export function listTemplates(): readonly TemplateConfig[] {
  return TEMPLATES;
}

export function getTemplate(id: string | undefined | null): TemplateConfig {
  if (id && byId.has(id)) return byId.get(id)!;
  return minimalTemplate;
}

export function hasTemplate(id: string | undefined | null): boolean {
  return !!id && byId.has(id);
}
