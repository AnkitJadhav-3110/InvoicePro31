import { NavLink, useNavigate } from 'react-router-dom';
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
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FileText, label: 'Create Invoice', path: '/invoices/create' },
  { icon: FolderOpen, label: 'Invoice History', path: '/invoices/history' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: Building2, label: 'Business', path: '/business' },
  { icon: PenTool, label: 'Template Editor', path: '/templates' },
  { icon: Briefcase, label: 'Business Tools', path: '/tools' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar({ collapsed, onToggle, isMobileOpen, onMobileClose }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-sidebar border-r border-sidebar-border flex flex-col",
          "transition-all duration-300 ease-in-out",
          // Desktop styles
          "hidden lg:flex",
          collapsed ? "lg:w-16" : "lg:w-64",
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
          "fixed left-0 top-0 z-50 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col",
          "transition-transform duration-300 ease-in-out lg:hidden",
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
  return (
    <>
      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center border-b border-sidebar-border px-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        <button 
          onClick={onLogoClick}
          className={cn(
            "flex items-center gap-2 hover:opacity-80 transition-opacity",
            collapsed ? "justify-center" : ""
          )}
        >
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-foreground">InvoicePro</span>
          )}
        </button>
        {showMobileClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Tooltip key={item.path} delayDuration={0}>
            <TooltipTrigger asChild>
              <NavLink
                to={item.path}
                onClick={onNavClick}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                    collapsed ? "justify-center" : "",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </NavLink>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="font-medium bg-popover text-popover-foreground border border-border">
                {item.label}
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </nav>

      {/* Toggle Button - Desktop Only */}
      {showToggle && (
        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              "w-full flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-accent",
              collapsed ? "justify-center" : "justify-start"
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );
}
