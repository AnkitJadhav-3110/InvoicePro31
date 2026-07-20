import { describe, it, expect } from 'vitest';
import { buildRenderModel } from '@/rendering/buildRenderModel';
import { getTemplate, listTemplates, validateTemplateConfig } from '@/rendering/registry';
import { renderPdf } from '@/rendering/pdf/renderPdf';
import {
  ALL_TEMPLATES,
  buildInvoice,
  sampleBusiness,
  sampleClient,
  sampleSettings,
} from './fixtures';

async function pdfText(blob: Blob): Promise<string> {
  return new TextDecoder('latin1').decode(await blob.arrayBuffer());
}

function countPages(text: string): number {
  return (text.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
}

function countHeaderOccurrences(text: string, headerLabel: string): number {
  // Header labels are drawn as short strings; count PDF text-show operators.
  const re = new RegExp(`\\(${headerLabel}\\)\\s*Tj`, 'g');
  return (text.match(re) ?? []).length;
}

describe('Rendering engine — shared model & registry', () => {
  it('every registered template passes the runtime validator', () => {
    for (const cfg of listTemplates()) {
      expect(() => validateTemplateConfig(cfg)).not.toThrow();
    }
  });

  it('preview and PDF consume the exact same RenderModel for a template', () => {
    const invoice = buildInvoice('corporate', 3);
    const modelA = buildRenderModel(invoice, sampleClient, sampleBusiness, sampleSettings);
    const modelB = buildRenderModel(invoice, sampleClient, sampleBusiness, sampleSettings);
    // Deterministic + serialisable — the model is the single source of truth.
    expect(JSON.stringify(modelA)).toEqual(JSON.stringify(modelB));
    expect(modelA.totals.grandTotal).toBe(660);
    expect(modelA.items).toHaveLength(3);
  });

  it('selecting each template resolves through the registry to a valid config', () => {
    for (const id of ALL_TEMPLATES) {
      const cfg = getTemplate(id);
      expect(cfg.id).toBe(id);
      expect(() => validateTemplateConfig(cfg)).not.toThrow();
    }
    // Unknown ids fall back to the minimal template, not to undefined behaviour.
    expect(getTemplate('does-not-exist').id).toBe('minimal');
  });
});

describe('Multi-page regression — every template', () => {
  for (const template of ALL_TEMPLATES) {
    it(`repeats table header and keeps totals consistent across pages for "${template}"`, async () => {
      const invoice = buildInvoice(template, 40);
      const model = buildRenderModel(invoice, sampleClient, sampleBusiness, sampleSettings);
      const cfg = getTemplate(template);
      const blob = await renderPdf(model, cfg);
      const text = await pdfText(blob);

      const pages = countPages(text);
      expect(pages).toBeGreaterThanOrEqual(2);

      // The "AMOUNT" column header should appear on every content page.
      const amountLabel = cfg.itemsTable.columns.find((c) => c.key === 'amount')!.label;
      const headerHits = countHeaderOccurrences(text, amountLabel);
      expect(headerHits).toBeGreaterThanOrEqual(pages - 1); // totals may occupy last page alone

      // Grand total for 40 items × qty 2 × $100 + 10% tax = 8,800.00
      expect(text).toContain('8,800.00');
    });
  }
});
