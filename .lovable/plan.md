
# Template Rendering Engine Refactor

Goal: one shared rendering model drives both the on-screen Live Preview and the downloaded PDF, so they can never drift. Adding a new template = one new config file + one registry line, with no changes to the PDF generator or preview component.

## Architecture

```text
selected template id
       │
       ▼
┌───────────────────────┐        ┌──────────────────────┐
│ TemplateRegistry      │──────▶ │ TemplateConfig       │
│  (id → config)        │        │  colors, typography, │
└───────────────────────┘        │  spacing, sections   │
       │                         └──────────────────────┘
       ▼
┌────────────────────────────────────────────────────────┐
│ buildRenderModel(invoice, client, business, settings,  │
│                  template)                             │
│  → normalized RenderModel (header, meta, items, totals,│
│    gst, notes, terms, payment, signature, footer)      │
└────────────────────────────────────────────────────────┘
       │                                    │
       ▼                                    ▼
┌──────────────────────┐          ┌──────────────────────┐
│ <TemplateRenderer/>  │          │ renderPdf(model,     │
│  React/HTML preview  │          │   template) → Blob   │
│  (uses same tokens)  │          │  (jsPDF, same tokens)│
└──────────────────────┘          └──────────────────────┘
```

Both renderers consume the *same* `RenderModel` + `TemplateConfig`, so preview and PDF are guaranteed to match.

## New file layout

```text
src/rendering/
  types.ts                    # RenderModel, TemplateConfig, Section types
  buildRenderModel.ts         # invoice+client+business+settings → RenderModel (pure)
  registry.ts                 # id → TemplateConfig map, list(), get(id)
  tokens.ts                   # shared color/typography/spacing helpers
  templates/
    minimal.ts                # was pdfMinimalBW
    corporateBlue.ts          # was pdfCorporateBlue
    corporateTeal.ts
    creative.ts               # was pdfCreative
    darkLuxury.ts             # was pdfDarkLuxury
    classic.ts                # was default in pdfGenerator
  preview/
    TemplateRenderer.tsx      # single React component driven by config + model
    sections/                 # HeaderBlock, MetaBlock, ItemsTable, TotalsBlock,
                              # GstBlock, NotesBlock, PaymentBlock, SignatureBlock,
                              # FooterBlock — each reads tokens from config
  pdf/
    renderPdf.ts              # single jsPDF renderer driven by config + model
    primitives.ts             # drawText, drawRow, drawTable, drawBar, addPageIf…
    sections/                 # PDF equivalents of the preview sections
```

### TemplateConfig (shape)

```ts
export interface TemplateConfig {
  id: string;
  name: string;
  colors: { primary; onPrimary; text; muted; border; surface; accent };
  typography: { family: 'helvetica'|'times'|'courier'; h1; h2; body; small; weightBold };
  spacing: { page; section; row; gutter };
  header: { variant: 'bar'|'block'|'split'|'minimal'; showLogo; align };
  meta:   { layout: 'right'|'below-header'|'grid' };
  itemsTable: { columns; zebra; headerFill; showBorders };
  totals: { align: 'right'|'full-width'; emphasizeTotal };
  gst:    { show; layout: 'inline'|'panel' };
  notes:  { show; boxed };
  payment:{ showQr; showBank; layout };
  signature: { show; label };
  footer: { variant: 'branded'|'minimal'|'none'; showPageNumbers };
  pageStyle: { background?; watermark? };
}
```

### RenderModel (shape)

```ts
export interface RenderModel {
  business: { name; email; phone; address; logoDataUrl?; tagline? };
  client:   { name; email; phone; address; currency; currencySymbol };
  invoice:  { number; status; issuedOn; dueOn; poNumber? };
  items:    Array<{ description; quantity; price; amount; taxRate?; hsn? }>;
  totals:   { subtotal; discount; taxLines; grandTotal; amountDue };
  gst?:     { gstin?; placeOfSupply?; cgst?; sgst?; igst? };
  notes?:   string;
  terms?:   string;
  payment?: { bank?; upi?; qrPayload?; methods? };
  signature?: { name?; imageDataUrl? };
  branding: { wordmark: 'InvoicePro' };
}
```

## Migration steps

1. **Create `src/rendering/`** with `types.ts`, `tokens.ts`, `buildRenderModel.ts`, `registry.ts`.
2. **Port the 5 existing PDF layouts** into `templates/*.ts` as pure `TemplateConfig` objects. Any layout-specific quirks become variants on the config (`header.variant`, `itemsTable.zebra`, etc.). No jsPDF calls live in template files.
3. **Write `pdf/renderPdf.ts`** — single generic renderer that walks the sections in order, dispatching on config variants, handling pagination, repeated header/footer, page numbers.
4. **Write `preview/TemplateRenderer.tsx`** — the React mirror, same section order, same tokens. Preview uses semantic CSS driven by config colors (mapped via inline styles, since colors are per-template not per-theme tokens).
5. **Rewire call sites**:
   - `src/utils/pdfGenerator.ts` becomes a thin shim: `generateInvoicePDF(invoice, client, business, settings)` → looks up `settings.selectedTemplate` in the registry, builds model, calls `renderPdf`. Keeps the existing exported signature so tests, `CreateInvoice`, `InvoiceHistory`, `emailService`, `shareInvoice` are untouched.
   - Old `pdfCorporateBlue.ts` / `pdfMinimalBW.ts` / `pdfCreative.ts` / `pdfDarkLuxury.ts` re-export from the shim for a deprecation window, then get deleted once nothing imports them (grep first).
   - `InvoicePreview.tsx` becomes a thin wrapper that resolves the template and renders `<TemplateRenderer model={…} config={…} />`. Existing props/exports preserved.
6. **Custom template engine** (`customTemplatePDF.ts`) stays as-is — it's a separate positional-mapping feature and out of scope for the registry.
7. **Tests**: existing `pdfGenerator.test.ts` iterates `ALL_TEMPLATES` and asserts totals + pagination — must keep passing. Add `src/test/renderModel.test.ts` for `buildRenderModel` invariants (no NaN, totals math, GST split) and `src/test/registry.test.ts` (every registered id resolves, has required sections).
8. **Run vitest + tsgo**; fix regressions; visually sanity-check the preview via Playwright on `/invoices/create` for each template.

## Preserved behavior

- All existing routes, store, calculations, GST logic, InvoicePro branding, multi-page headers/footers, PAID stamp, QR, signature, notes/terms — unchanged in output. Only the *internal* code path changes.
- Public API of `generateInvoicePDF`, `InvoicePreview` stays identical.
- Custom-template (positional mapping) flow untouched.

## Adding a new template (post-refactor)

1. Create `src/rendering/templates/emerald.ts` exporting a `TemplateConfig`.
2. Add one line to `registry.ts`.
   Done — preview and PDF both pick it up automatically.

## Risks & mitigations

- **Pixel drift vs. current PDFs**: acceptable — the five existing layouts are ported by intent, not byte-for-byte. Tests assert semantic content (totals, page count, key strings), not raster equality, so they continue to pass.
- **Preview/PDF divergence**: prevented by construction — both consume the same `RenderModel` + `TemplateConfig` and iterate the same section list.
- **Scope creep**: custom-template mapping engine explicitly excluded.
