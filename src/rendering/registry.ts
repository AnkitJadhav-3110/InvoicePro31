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
