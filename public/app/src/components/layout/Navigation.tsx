import { useState } from 'react';
import { ChevronRight, Fingerprint, Menu, Moon, Sun, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const navItems = [
    { label: 'How It Works', to: '/#how-it-works', isHash: true },
    { label: 'Verify Agent', to: '/verify', isHash: false },
    { label: 'Python SDK', to: '/docs', isHash: false },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-base-950/90 backdrop-blur-md border-b border-base-200 dark:border-base-800 no-print">
      <div className="container-wide">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-descript-600 text-white">
              <Fingerprint className="h-4 w-4" />
            </div>
            <span className="font-semibold text-xl text-base-900 dark:text-white">Descript</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) =>
              item.isHash ? (
                <a
                  key={item.label}
                  href={item.to}
                  className="text-base-600 dark:text-base-300 hover:text-base-900 dark:hover:text-white transition-colors font-medium text-sm"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.to}
                  className="text-base-600 dark:text-base-300 hover:text-base-900 dark:hover:text-white transition-colors font-medium text-sm"
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="p-2 rounded-lg text-base-600 dark:text-base-300 hover:bg-base-100 dark:hover:bg-base-800 transition-colors"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 bg-descript-600 text-white hover:bg-descript-700 transition-colors font-semibold text-sm px-4 py-2 rounded-lg"
                >
                  <span>Dashboard</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  title={user?.email}
                  className="text-base-600 dark:text-base-300 hover:text-base-900 dark:hover:text-white font-medium text-sm px-2"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-base-600 dark:text-base-300 hover:text-base-900 dark:hover:text-white transition-colors font-medium text-sm px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-1.5 bg-descript-600 text-white hover:bg-descript-700 active:bg-descript-800 transition-colors font-semibold text-sm px-4 py-2 rounded-lg"
                >
                  <span>Get Started</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-base-100 dark:hover:bg-base-800 transition-colors text-base-700 dark:text-base-200"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-base-200 dark:border-base-800 py-4 space-y-3">
            {navItems.map((item) =>
              item.isHash ? (
                <a
                  key={item.label}
                  href={item.to}
                  className="block text-base-700 dark:text-base-200 font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.to}
                  className="block text-base-700 dark:text-base-200 font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )
            )}
            <div className="flex flex-col gap-2 pt-3 border-t border-base-200 dark:border-base-800">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 bg-descript-600 text-white font-semibold text-sm px-5 py-3 rounded-lg"
                >
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-base-700 dark:text-base-200 font-medium py-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-2 bg-descript-600 text-white font-semibold text-sm px-5 py-3 rounded-lg"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
