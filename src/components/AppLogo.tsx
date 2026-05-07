import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';

interface AppLogoProps {
  className?: string;
  alt?: string;
}

/**
 * Shared brand logo. Use everywhere we previously rendered a Receipt/Sparkles
 * placeholder so the visual identity stays consistent across the app.
 */
export function AppLogo({ className, alt = 'InvoicePro logo' }: AppLogoProps) {
  return (
    <img
      src={logo}
      alt={alt}
      className={cn('object-contain', className)}
      draggable={false}
    />
  );
}
