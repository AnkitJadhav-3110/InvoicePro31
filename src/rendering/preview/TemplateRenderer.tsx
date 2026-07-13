import { useEffect, useState, type CSSProperties } from 'react';
import QRCode from 'qrcode';
import type { RenderModel, TemplateConfig, ItemsColumn } from '../types';
import { formatCurrency, formatDate } from '../buildRenderModel';

interface Props {
  model: RenderModel;
  config: TemplateConfig;
}

/**
 * Single React renderer for the on-screen preview. Consumes the exact same
 * `RenderModel` + `TemplateConfig` the PDF renderer uses, so the two views
 * always match. All colors/typography flow from the config — no hardcoded
 * styles per template.
 */
export function TemplateRenderer({ model, config }: Props) {
  const [qr, setQr] = useState('');
  useEffect(() => {
    if (model.invoice.paymentQR && config.payment.showQr) {
      QRCode.toDataURL(model.invoice.paymentQR, { width: 100, margin: 1 })
        .then(setQr)
        .catch(() => setQr(''));
    } else {
      setQr('');
    }
  }, [model.invoice.paymentQR, config.payment.showQr]);

  const cs = model.client.currencySymbol;
  const c = config.colors;
  const t = config.typography;

  const pageStyle: CSSProperties = {
    backgroundColor: c.pageBackground,
    color: c.text,
    fontFamily: t.familyCss,
    padding: '32px',
    minHeight: 800,
    position: 'relative',
    fontSize: 14,
  };

  const mutedStyle: CSSProperties = { color: c.muted };
  const primaryStyle: CSSProperties = { color: c.primary };

  const accentBar =
    config.header.variant === 'accent-left' ? (
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: config.header.accentBarWidthMm ? config.header.accentBarWidthMm * 3 : 12,
          backgroundColor: c.primary,
        }}
      />
    ) : config.header.variant === 'bar' ? (
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 6,
          backgroundColor: c.primary,
        }}
      />
    ) : null;

  return (
    <div className="invoice-template w-full shadow-xl relative" style={pageStyle}>
      {accentBar}

      {model.invoice.isPaid && (
        <div
          style={{
            position: 'absolute',
            top: 80,
            right: 32,
            transform: 'rotate(12deg)',
            border: `4px solid ${c.success}`,
            color: c.success,
            padding: '8px 24px',
            borderRadius: 8,
            fontSize: 24,
            fontWeight: 700,
            opacity: 0.8,
            zIndex: 10,
          }}
        >
          PAID
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start" style={{ gap: 24 }}>
        <div style={{ flex: 1 }}>
          {config.header.showLogo && model.business.logoDataUrl && (
            <img src={model.business.logoDataUrl} alt="" style={{ height: 48, marginBottom: 8, objectFit: 'contain' }} />
          )}
          <div style={{ fontSize: 20, fontWeight: 700, color: c.text }}>
            {config.header.uppercaseBusinessName
              ? model.business.name.toUpperCase()
              : model.business.name}
          </div>
          <div style={{ ...mutedStyle, fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
            {model.business.address && <div>{model.business.address}</div>}
            {(model.business.city || model.business.country) && (
              <div>{[model.business.city, model.business.country].filter(Boolean).join(', ')}</div>
            )}
            {model.business.email && <div>{model.business.email}</div>}
            {model.business.phone && <div>{model.business.phone}</div>}
            {model.business.taxId && <div>Tax ID: {model.business.taxId}</div>}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ ...primaryStyle, fontSize: 32, fontWeight: 700, letterSpacing: 1 }}>
            {config.header.titleLabel}
          </div>
          <div style={{ ...mutedStyle, fontSize: 14, marginTop: 4 }}>{model.invoice.number}</div>
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <div style={{ ...mutedStyle, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>INVOICE DATE</div>
            <div style={{ fontSize: 13 }}>{formatDate(model.invoice.issuedOn)}</div>
            <div style={{ ...mutedStyle, fontSize: 10, fontWeight: 700, letterSpacing: 1, marginTop: 6 }}>DUE DATE</div>
            <div style={{ fontSize: 13 }}>{formatDate(model.invoice.dueOn)}</div>
          </div>
        </div>
      </div>

      <hr style={{ border: 0, borderTop: `1px solid ${c.border}`, margin: '20px 0' }} />

      {/* Bill To (+ optional From) */}
      <div style={{ display: 'grid', gridTemplateColumns: config.billTo.layout === 'to-from' ? '1fr 1fr' : '1fr', gap: 24, marginBottom: 24 }}>
        <PartyBlock label="BILL TO" name={model.client.name}
          lines={[
            model.client.address,
            [model.client.city, model.client.country].filter(Boolean).join(', '),
            model.client.email,
            model.client.phone,
            model.client.taxId ? `Tax ID: ${model.client.taxId}` : '',
          ]}
          colors={c}
        />
        {config.billTo.layout === 'to-from' && (
          <PartyBlock label="FROM" name={model.business.name}
            lines={[
              model.business.address,
              [model.business.city, model.business.country].filter(Boolean).join(', '),
              model.business.email,
            ]}
            colors={c}
          />
        )}
      </div>

      {/* Items table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ backgroundColor: config.itemsTable.headerFill ? c.surfaceAlt : 'transparent' }}>
            {config.itemsTable.columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: col.align,
                  padding: '10px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: c.muted,
                  letterSpacing: 1,
                  borderBottom: `1px solid ${c.border}`,
                  width: `${col.widthFraction * 100}%`,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.items.map((item, i) => (
            <tr
              key={i}
              style={{
                backgroundColor: config.itemsTable.zebra && i % 2 === 0 ? c.surfaceAlt : 'transparent',
                borderBottom: config.itemsTable.showRowDivider ? `1px solid ${c.border}` : 'none',
              }}
            >
              {config.itemsTable.columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    textAlign: col.align,
                    padding: '10px 8px',
                    fontSize: 13,
                    color: col.key === 'amount' ? c.text : c.muted,
                    fontWeight: col.key === 'amount' ? 600 : 400,
                  }}
                >
                  {renderCell(col, item, cs)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <div style={{ width: 260 }}>
          <TotalRow label="Subtotal" value={formatCurrency(model.totals.subtotal, cs)} colors={c} />
          <TotalRow label="Tax" value={formatCurrency(model.totals.taxTotal, cs)} colors={c} />
          {model.totals.discountTotal > 0 && (
            <TotalRow label="Discount" value={`-${formatCurrency(model.totals.discountTotal, cs)}`} colors={c} valueColor={c.danger} />
          )}
          <div style={{ borderTop: `2px solid ${c.text}`, marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', color: c.primary, fontWeight: 700, fontSize: 16 }}>
            <span>Total</span>
            <span>{formatCurrency(model.totals.grandTotal, cs)}</span>
          </div>
        </div>
      </div>

      {/* Notes + QR + signature */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
        <div style={{ flex: 1 }}>
          {config.notes.show && model.invoice.notes && (
            <div style={config.notes.boxed ? { backgroundColor: c.surfaceAlt, padding: 12, borderRadius: 6 } : {}}>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 4 }}>Notes</div>
              <div style={{ fontSize: 12, color: c.muted, whiteSpace: 'pre-wrap' }}>{model.invoice.notes}</div>
            </div>
          )}
        </div>
        {qr && (
          <div style={{ textAlign: 'center' }}>
            <img src={qr} alt="Payment QR" style={{ width: 96, height: 96 }} />
            <div style={{ fontSize: 10, color: c.muted, marginTop: 4 }}>Scan to Pay</div>
          </div>
        )}
        {config.signature.show && model.business.signatureDataUrl && (
          <div style={{ textAlign: 'right' }}>
            <img src={model.business.signatureDataUrl} alt="Signature" style={{ height: 48, marginLeft: 'auto' }} />
            <div style={{ fontSize: 11, color: c.muted }}>{config.signature.label}</div>
          </div>
        )}
      </div>

      {/* Footer */}
      {config.footer.variant !== 'none' && (
        <div style={{ marginTop: 32, paddingTop: 12, borderTop: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
          {config.footer.showBrandWordmark && (
            <div>
              <span style={{ fontWeight: 700, color: c.text }}>Invoice</span>
              <span style={{ fontWeight: 700, color: c.primary }}>Pro</span>
              <span style={{ color: c.muted, marginLeft: 6 }}>· {model.branding.tagline}</span>
            </div>
          )}
          <div style={{ color: c.muted, textAlign: 'center', flex: 1 }}>
            {model.business.footerText || 'Thank you for your business.'}
          </div>
          {config.footer.showPageNumbers && <div style={{ color: c.muted }}>Page 1</div>}
        </div>
      )}
    </div>
  );
}

function PartyBlock({
  label, name, lines, colors,
}: {
  label: string;
  name: string;
  lines: string[];
  colors: TemplateConfig['colors'];
}) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: colors.muted, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>{name}</div>
      <div style={{ fontSize: 12, color: colors.muted, marginTop: 4, lineHeight: 1.5 }}>
        {lines.filter(Boolean).map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}

function TotalRow({
  label, value, colors, valueColor,
}: {
  label: string;
  value: string;
  colors: TemplateConfig['colors'];
  valueColor?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
      <span style={{ color: colors.muted }}>{label}</span>
      <span style={{ color: valueColor ?? colors.text }}>{value}</span>
    </div>
  );
}

function renderCell(col: ItemsColumn, item: RenderModel['items'][number], cs: string): string {
  switch (col.key) {
    case 'description': return item.description;
    case 'quantity': return String(item.quantity);
    case 'price': return formatCurrency(item.price, cs);
    case 'tax': return `${item.taxRate}%`;
    case 'amount': return formatCurrency(item.amount, cs);
  }
}
