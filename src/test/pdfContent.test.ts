import { describe, it, expect } from 'vitest';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import {
  ALL_TEMPLATES,
  buildInvoice,
  sampleBusiness,
  sampleClient,
  sampleSettings,
} from './fixtures';

async function pdfText(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  return new TextDecoder('latin1').decode(buf);
}

// Per-template tokens that prove the items-table header was rendered.
const HEADER_TOKENS: Record<string, string[]> = {
  minimal: ['DESCRIPTION', 'QTY', 'AMOUNT'],
  corporate: ['Product Description', 'Quantity', 'Total'],
  bw: ['DESCRIPTION'],
  creative: ['DESCRIPTION'],
  luxury: ['DESCRIPTION'],
};

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let n = 0;
  let idx = 0;
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    n++;
    idx += needle.length;
  }
  return n;
}

describe('PDF content correctness', () => {
  for (const template of ALL_TEMPLATES) {
    it(`includes client and business fields for "${template}"`, async () => {
      const invoice = buildInvoice(template, 3);
      const blob = await generateInvoicePDF(
        invoice,
        sampleClient,
        sampleBusiness,
        sampleSettings,
      );
      const text = await pdfText(blob);

      // Required identity fields.
      expect(text).toContain(sampleBusiness.name);
      expect(text).toContain(sampleClient.name);
      expect(text).toContain(invoice.invoiceNumber);

      // Total computed from fixtures: 660.00.
      expect(text).toContain('660.00');
    });

    it(`does not render placeholder/empty values for "${template}"`, async () => {
      const invoice = buildInvoice(template, 3);
      const blob = await generateInvoicePDF(
        invoice,
        sampleClient,
        sampleBusiness,
        sampleSettings,
      );
      const text = await pdfText(blob);

      const forbidden = [
        'undefined',
        'null',
        'NaN',
        '{{',
        '}}',
        '$NaN',
        'Object Object',
      ];
      for (const token of forbidden) {
        expect(text.includes(token), `expected no "${token}" in PDF`).toBe(false);
      }
    });

    it(`repeats the items-table header across pages for "${template}" (40 items)`, async () => {
      const invoice = buildInvoice(template, 40);
      const blob = await generateInvoicePDF(
        invoice,
        sampleClient,
        sampleBusiness,
        sampleSettings,
      );
      const text = await pdfText(blob);

      // Confirm we got multiple pages.
      const pageMatches = text.match(/\/Type\s*\/Page[^s]/g) || [];
      expect(pageMatches.length).toBeGreaterThanOrEqual(2);

      // Confirm the header keyword(s) appear at least once per page.
      const tokens = HEADER_TOKENS[template];
      for (const token of tokens) {
        const occ = countOccurrences(text, token);
        expect(
          occ,
          `expected header token "${token}" at least ${pageMatches.length} times for ${template} (got ${occ})`,
        ).toBeGreaterThanOrEqual(pageMatches.length);
      }
    });
  }
});
