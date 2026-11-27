import React, { useState } from 'react';
import {
  Bot,
  Code2,
  Fingerprint,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  Settings,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: '/agents/new', label: 'Register Agent', icon: <Plus className="h-4 w-4" /> },
    { to: '/verify', label: 'Verify Agent', icon: <ShieldCheck className="h-4 w-4" /> },
    { to: '/developers', label: 'Python SDK & Keys', icon: <Code2 className="h-4 w-4" /> },
    { to: '/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-base-900 border-r border-base-200 dark:border-base-800">
      <div className="h-16 px-5 flex items-center justify-between border-b border-base-200 dark:border-base-800">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-descript-600 text-white flex items-center justify-center shadow-md shadow-descript-600/25">
            <Fingerprint className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg text-base-900 dark:text-white">Descript</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
              <span className="status-beacon">
                <span className="status-beacon-ping bg-emerald-400" />
                <span className="status-beacon-dot bg-emerald-500" />
              </span>
              Neon Active
            </span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-base-500 hover:bg-base-100 dark:hover:bg-base-800"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1.5" aria-label="Dashboard navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-descript-50 text-descript-700 dark:bg-descript-950/60 dark:text-descript-300'
                  : 'text-base-600 dark:text-base-300 hover:bg-base-100 dark:hover:bg-base-800 hover:text-base-900 dark:hover:text-white'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="pt-4 mt-4 border-t border-base-200 dark:border-base-800">
          <Link
            to="/agents"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-base-600 dark:text-base-300 hover:bg-base-100 dark:hover:bg-base-800"
          >
            <Bot className="h-4 w-4" />
            <span>All Agents</span>
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t border-base-200 dark:border-base-800 space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-medium text-base-500 dark:text-base-400">Theme</span>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="p-2 rounded-lg border border-base-200 dark:border-base-700 text-base-600 dark:text-base-300 hover:bg-base-100 dark:hover:bg-base-800 transition-colors"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        <div className="px-3 py-2.5 rounded-xl bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800">
          <div className="text-xs font-semibold text-base-900 dark:text-base-100 truncate">
            {user?.name || 'Controller'}
          </div>
          <div className="text-[11px] text-base-500 dark:text-base-400 truncate">{user?.email}</div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-base-50 dark:bg-base-950 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen no-print">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-base-950/50 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10">{sidebarContent}</aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 px-4 sm:px-8 bg-white dark:bg-base-900 border-b border-base-200 dark:border-base-800 flex items-center justify-between gap-4 sticky top-0 z-30 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg text-base-600 dark:text-base-300 hover:bg-base-100 dark:hover:bg-base-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                {title && (
                  <h1 className="text-lg font-semibold text-base-900 dark:text-white truncate">
                    {title}
                  </h1>
                )}
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
                  <span className="status-beacon">
                    <span className="status-beacon-ping bg-emerald-400" />
                    <span className="status-beacon-dot bg-emerald-500" />
                  </span>
                  Neon Active
                </span>
              </div>
              {subtitle && (
                <p className="text-xs text-base-500 dark:text-base-400 truncate hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {actions}
            <Link
              to="/agents/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-descript-600 hover:bg-descript-700 text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Register Agent</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
