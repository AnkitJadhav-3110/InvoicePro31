import { useLocation } from 'react-router-dom';
import { Moon, Sun, Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';

interface HeaderProps {
  onMenuToggle: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/invoices/create': 'Create Invoice',
  '/invoices/history': 'Invoice History',
  '/clients': 'Clients',
  '/business': 'Business Profiles',
  '/templates': 'Template Editor',
  '/tools': 'Business Tools',
  '/settings': 'Settings',
};

export function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation();
  const { settings, toggleTheme } = useStore();
  const title = pageTitles[location.pathname] || 'InvoicePro';

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
