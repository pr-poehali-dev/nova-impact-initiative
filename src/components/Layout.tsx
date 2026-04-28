import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const navItems = [
  { path: '/', label: 'Дашборд', icon: 'LayoutDashboard' },
  { path: '/trends', label: 'Тренды', icon: 'TrendingUp' },
  { path: '/posts', label: 'Посты', icon: 'FileText' },
  { path: '/create', label: 'Создать пост', icon: 'PenSquare' },
  { path: '/calendar', label: 'Планировщик', icon: 'CalendarDays' },
  { path: '/settings', label: 'Настройки', icon: 'Settings' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Icon name="Zap" size={16} className="text-white" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sidebar-foreground text-sm">AI Постер</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`
              }
            >
              <Icon name={item.icon} size={18} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center p-4 text-sidebar-foreground hover:text-sidebar-primary transition-colors border-t border-sidebar-border"
        >
          <Icon name={collapsed ? 'ChevronRight' : 'ChevronLeft'} size={16} />
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <h1 className="text-lg font-semibold text-foreground">
            {navItems.find((n) => n.path === location.pathname)?.label || 'AI Постер'}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Система активна</span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">{children}</div>
      </main>
    </div>
  );
}