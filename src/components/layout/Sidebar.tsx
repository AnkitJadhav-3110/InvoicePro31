import { NavLink } from 'react-router-dom';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
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

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center border-b border-sidebar-border px-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">InvoicePro</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Tooltip key={item.path} delayDuration={0}>
            <TooltipTrigger asChild>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    collapsed ? "justify-center" : "",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )
                }
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", collapsed ? "" : "")} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </NavLink>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="font-medium">
                {item.label}
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </nav>

      {/* Toggle Button */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-2 text-sidebar-foreground hover:bg-sidebar-accent",
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
    </aside>
  );
}
