import { cn } from '@/lib/utils';
import { AppLogo } from '@/components/AppLogo';

interface BrandWordmarkProps {
  /** Show the logo mark to the left of the wordmark */
  withLogo?: boolean;
  /** Show the "Professional Invoicing" tagline below */
  withTagline?: boolean;
  /** Sizing preset */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Layout direction */
  align?: 'left' | 'center';
  className?: string;
}

const SIZE_PRESETS: Record<NonNullable<BrandWordmarkProps['size']>, {
  logoBox: string;
  logoImg: string;
  text: string;
  tagline: string;
  gap: string;
}> = {
  sm: { logoBox: 'w-8 h-8', logoImg: 'w-6 h-6', text: 'text-base', tagline: 'text-[10px]', gap: 'gap-2' },
  md: { logoBox: 'w-9 h-9', logoImg: 'w-7 h-7', text: 'text-lg', tagline: 'text-[10px]', gap: 'gap-2.5' },
  lg: { logoBox: 'w-10 h-10', logoImg: 'w-8 h-8', text: 'text-xl', tagline: 'text-xs', gap: 'gap-3' },
  xl: { logoBox: 'w-12 h-12', logoImg: 'w-9 h-9', text: 'text-2xl', tagline: 'text-xs', gap: 'gap-3' },
};

/**
 * Canonical InvoicePro brand wordmark.
 *
 * - "Invoice" uses `text-foreground`
 * - "Pro" uses `text-primary`
 * - Optional tagline "Professional Invoicing" in `text-muted-foreground`
 *
 * Use this component everywhere the product name appears (header, sidebar,
 * auth pages, footer, client portal) so the brand styling stays identical.
 */
export function BrandWordmark({
  withLogo = false,
  withTagline = false,
  size = 'md',
  align = 'left',
  className,
}: BrandWordmarkProps) {
  const preset = SIZE_PRESETS[size];

  return (
    <span
      className={cn(
        'inline-flex items-center',
        preset.gap,
        align === 'center' && 'justify-center',
        className,
      )}
    >
      {withLogo && (
        <span className={cn(
          'rounded-xl bg-card border border-border flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden',
          preset.logoBox,
        )}>
          <AppLogo className={preset.logoImg} />
        </span>
      )}
      <span className={cn('flex flex-col', align === 'center' && 'items-center')}>
        <span
          className={cn(
            'font-bold tracking-tight leading-none text-foreground',
            preset.text,
          )}
        >
          Invoice<span className="text-primary">Pro</span>
        </span>
        {withTagline && (
          <span className={cn('text-muted-foreground leading-none mt-1', preset.tagline)}>
            Professional Invoicing
          </span>
        )}
      </span>
    </span>
  );
}
