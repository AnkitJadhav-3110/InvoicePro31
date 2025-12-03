import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Menu, Bell, Clock, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const navigate = useNavigate();
  const { settings, toggleTheme, invoices, clients } = useStore();
  const title = pageTitles[location.pathname] || 'InvoicePro';
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications = useMemo(() => {
    const now = new Date();
    const items: Array<{
      id: string;
      type: 'pending' | 'overdue';
      invoiceNumber: string;
      clientName: string;
      amount: number;
      dueDate: string;
    }> = [];

    invoices.forEach(invoice => {
      // Skip paid invoices
      if (invoice.isPaid || invoice.status === 'paid') return;
      
      const client = clients.find(c => c.id === invoice.clientId);
      const dueDate = new Date(invoice.dueDate);
      const isOverdue = dueDate < now;
      
      items.push({
        id: invoice.id,
        type: isOverdue ? 'overdue' : 'pending',
        invoiceNumber: invoice.invoiceNumber,
        clientName: client?.name || 'Unknown Client',
        amount: invoice.total,
        dueDate: invoice.dueDate,
      });
    });

    // Sort by type (overdue first) then by date
    return items.sort((a, b) => {
      if (a.type === 'overdue' && b.type !== 'overdue') return -1;
      if (a.type !== 'overdue' && b.type === 'overdue') return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [invoices, clients]);

  const overdueCount = notifications.filter(n => n.type === 'overdue').length;
  const pendingCount = notifications.filter(n => n.type === 'pending').length;

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewInvoice = (invoiceId: string) => {
    setNotificationsOpen(false);
    navigate('/invoices/history');
  };

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          {/* Mobile Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 lg:hidden"
          >
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </button>

          <div className="hidden sm:block">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Notifications */}
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 sm:w-96 p-0" align="end">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  {overdueCount > 0 && <span className="text-destructive">{overdueCount} overdue</span>}
                  {overdueCount > 0 && pendingCount > 0 && ' • '}
                  {pendingCount > 0 && <span>{pendingCount} pending</span>}
                  {notifications.length === 0 && 'All caught up!'}
                </p>
              </div>
              <ScrollArea className="max-h-80">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No pending notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map(notification => (
                      <button
                        key={notification.id}
                        onClick={() => handleViewInvoice(notification.id)}
                        className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            notification.type === 'overdue' 
                              ? 'bg-destructive/10 text-destructive' 
                              : 'bg-warning/10 text-warning'
                          }`}>
                            {notification.type === 'overdue' ? (
                              <AlertCircle className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-sm text-foreground truncate">
                                {notification.invoiceNumber}
                              </p>
                              <Badge 
                                variant={notification.type === 'overdue' ? 'destructive' : 'secondary'}
                                className="text-xs shrink-0"
                              >
                                {notification.type === 'overdue' ? 'Overdue' : 'Pending'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {notification.clientName}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm font-semibold text-foreground">
                                {formatCurrency(notification.amount)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Due {formatDate(notification.dueDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {notifications.length > 0 && (
                <div className="p-3 border-t border-border">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="sm"
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate('/invoices/history');
                    }}
                  >
                    View All Invoices
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Theme Toggle */}
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
