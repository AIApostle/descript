import { useState } from 'react';
import {
  ArrowRight,
  Fingerprint,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { label: 'How It Works', to: '/#how-it-works', isHash: true },
    { label: 'Verify Agent', to: '/verify', isHash: false },
    { label: 'Python SDK', to: '/docs', isHash: false },
    { label: 'Protocol Specs', to: '/developers', isHash: false },
  ];

  const isActive = (path: string) => {
    if (path.startsWith('/#')) return false;
    return location.pathname === path;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-3 sm:pt-4 pointer-events-none no-print">
      <nav
        aria-label="Main Navigation"
        className="pointer-events-auto max-w-6xl mx-auto glass rounded-full px-4 sm:px-6 py-2.5 sm:py-3 shadow-xl shadow-black/[0.04] dark:shadow-black/20 flex items-center justify-between transition-all duration-300"
      >
        {/* Brand */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-descript-500 rounded-full pr-2"
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-descript-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-descript-600/20 group-hover:scale-105 transition-transform duration-200">
            <Fingerprint className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base sm:text-lg text-base-900 dark:text-white tracking-tight">
              Descript
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-identity-50 dark:bg-identity-950/80 text-identity-700 dark:text-identity-300 border border-identity-200/80 dark:border-identity-800/80">
              <span className="status-beacon">
                <span className="status-beacon-ping bg-identity-400" />
                <span className="status-beacon-dot bg-identity-500" />
              </span>
              Neon Active
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) =>
            item.isHash ? (
              <a
                key={item.label}
                href={item.to}
                className="px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-medium text-base-600 dark:text-base-300 hover:text-base-900 dark:hover:text-white hover:bg-base-100/60 dark:hover:bg-white/5 transition-all duration-150"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                to={item.to}
                className={`px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-medium transition-all duration-150 ${
                  isActive(item.to)
                    ? 'bg-descript-50 text-descript-700 dark:bg-descript-950/80 dark:text-descript-300 font-semibold'
                    : 'text-base-600 dark:text-base-300 hover:text-base-900 dark:hover:text-white hover:bg-base-100/60 dark:hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        {/* Right CTA / Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-full text-base-500 hover:text-base-900 dark:text-base-400 dark:hover:text-white hover:bg-base-100/80 dark:hover:bg-white/5 transition-colors"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-2 bg-base-900 dark:bg-white text-white dark:text-base-950 hover:bg-base-800 dark:hover:bg-base-100 text-xs sm:text-sm font-medium px-4 py-2 rounded-full shadow-sm transition-all duration-150 active:scale-[0.98]"
              >
                <span>Console</span>
                <span className="h-5 w-5 rounded-full bg-white/10 dark:bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="hidden sm:inline-block text-xs font-medium text-base-500 hover:text-base-800 dark:hover:text-base-200 px-2.5 py-1"
              >
                Exit
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hidden sm:inline-flex text-xs sm:text-sm font-medium text-base-700 dark:text-base-200 hover:text-base-950 dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-base-100/60 dark:hover:bg-white/5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-descript-600 to-indigo-600 hover:from-descript-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-full shadow-sm shadow-descript-600/30 transition-all duration-150 active:scale-[0.98]"
              >
                <span>Register Agent</span>
                <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          )}

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-full text-base-600 dark:text-base-300 hover:bg-base-100/80 dark:hover:bg-white/5"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="pointer-events-auto md:hidden mt-2 max-w-6xl mx-auto glass rounded-2xl p-4 shadow-2xl border border-base-200 dark:border-white/10 space-y-2 animate-fade-in">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-base-700 dark:text-base-200 hover:bg-base-100 dark:hover:bg-white/5"
            >
              <span>{item.label}</span>
              <ArrowRight className="h-4 w-4 opacity-40" />
            </Link>
          ))}
          <div className="pt-2 border-t border-base-200 dark:border-base-800 flex flex-col gap-2">
            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl text-sm font-medium text-base-700 dark:text-base-200 bg-base-100 dark:bg-base-800"
              >
                Sign In
              </Link>
            )}
            <Link
              to={isAuthenticated ? '/dashboard' : '/signup'}
              onClick={() => setIsMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white bg-descript-600"
            >
              {isAuthenticated ? 'Open Console' : 'Get Started'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
