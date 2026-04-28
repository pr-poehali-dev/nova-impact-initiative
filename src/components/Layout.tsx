import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Дашборд", icon: "LayoutDashboard" },
  { to: "/trends", label: "Тренды", icon: "TrendingUp" },
  { to: "/create", label: "Создать пост", icon: "PenLine" },
  { to: "/posts", label: "Мои посты", icon: "FileText" },
  { to: "/calendar", label: "Планировщик", icon: "CalendarDays" },
  { to: "/settings", label: "Настройки", icon: "Settings" },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-sidebar-border", collapsed && "justify-center px-0")}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Icon name="Zap" size={16} className="text-white" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sidebar-foreground text-sm leading-tight">
              AI Content<br />
              <span className="text-muted-foreground font-normal text-xs">Manager</span>
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-sidebar-primary text-white"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <Icon name={item.icon} size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center gap-2 px-4 py-3 border-t border-sidebar-border text-muted-foreground hover:text-sidebar-foreground transition-colors text-xs",
            collapsed && "justify-center px-0"
          )}
        >
          <Icon name={collapsed ? "ChevronRight" : "ChevronLeft"} size={16} />
          {!collapsed && <span>Свернуть</span>}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-6xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}