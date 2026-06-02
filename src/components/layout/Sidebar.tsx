import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  Settings,
  FolderOpen,
  PenTool,
  Briefcase,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AppLogo } from '@/components/AppLogo';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'Create Invoice', path: '/invoices/create' },
  { icon: FolderOpen, label: 'Invoice History', path: '/invoices/history' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: Building2, label: 'Business', path: '/business' },
  { icon: RefreshCw, label: 'Recurring', path: '/recurring' },
  { icon: PenTool, label: 'Template Editor', path: '/templates' },
  { icon: Briefcase, label: 'Business Tools', path: '/tools' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar({ collapsed, onToggle, isMobileOpen, onMobileClose }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/dashboard');
    onMobileClose?.();
  };

  const handleNavClick = () => {
    onMobileClose?.();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onMobileClose}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen flex flex-col",
          "bg-card border-r border-border shadow-lg",
          "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "hidden lg:flex",
          collapsed ? "lg:w-[72px]" : "lg:w-64",
        )}
      >
        <SidebarContent 
          collapsed={collapsed} 
          onToggle={onToggle} 
          onLogoClick={handleLogoClick}
          onNavClick={handleNavClick}
          showToggle
        />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 flex flex-col",
          "bg-card border-r border-border shadow-2xl",
          "transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent 
          collapsed={false} 
          onToggle={onToggle} 
          onLogoClick={handleLogoClick}
          onNavClick={handleNavClick}
          showMobileClose
          onMobileClose={onMobileClose}
        />
      </aside>
    </>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  onToggle: () => void;
  onLogoClick: () => void;
  onNavClick: () => void;
  showToggle?: boolean;
  showMobileClose?: boolean;
  onMobileClose?: () => void;
}

function SidebarContent({ 
  collapsed, 
  onToggle, 
  onLogoClick, 
  onNavClick,
  showToggle,
  showMobileClose,
  onMobileClose 
}: SidebarContentProps) {
  const location = useLocation();

  return (
    <>
      {/* Logo Header - Fixed */}
      <div 
        className={cn(
          "h-16 flex items-center border-b border-border px-4 flex-shrink-0",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <button 
          onClick={onLogoClick}
          className={cn(
            "flex items-center gap-3 transition-all duration-200",
            "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg",
            collapsed ? "justify-center" : ""
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden">
            <AppLogo className="w-8 h-8" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight text-foreground">
              Invoice<span className="text-primary">Pro</span>
            </span>
          )}
        </button>
        {showMobileClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="text-foreground hover:bg-accent"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    onClick={onNavClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                      "font-medium text-sm no-underline",
                      collapsed ? "justify-center px-2" : "",
                      isActive
                        ? "bg-primary text-white shadow-md"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                      "group-hover:scale-110"
                    )} />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent 
                    side="right" 
                    className="font-medium bg-popover text-popover-foreground border border-border shadow-lg"
                    sideOffset={8}
                  >
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
      </nav>

      {/* Toggle Button - Desktop Only */}
      {showToggle && (
        <div className="p-3 border-t border-border flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              "w-full flex items-center gap-2 transition-all duration-200",
              "text-foreground hover:bg-accent hover:text-accent-foreground",
              collapsed ? "justify-center" : "justify-start"
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );
}
