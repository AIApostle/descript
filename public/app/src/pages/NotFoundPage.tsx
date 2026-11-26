import { Link } from 'react-router-dom';
import Footer from '../components/layout/Footer';
import Navigation from '../components/layout/Navigation';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-base-950 flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-20">
        <div className="text-center max-w-md">
          <div className="text-6xl font-bold font-mono text-descript-600 dark:text-descript-400 mb-4">
            404
          </div>
          <h1 className="text-2xl font-semibold text-base-900 dark:text-white mb-2">
            Route not found
          </h1>
          <p className="text-sm text-base-600 dark:text-base-400 mb-6">
            The agent profile or platform page you requested does not exist.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/"
              className="px-5 py-2.5 rounded-lg bg-descript-600 text-white text-sm font-semibold hover:bg-descript-700 transition-colors"
            >
              Return Home
            </Link>
            <Link
              to="/verify"
              className="px-5 py-2.5 rounded-lg border border-base-300 dark:border-base-700 text-base-700 dark:text-base-200 text-sm font-semibold hover:bg-base-50 dark:hover:bg-base-900 transition-colors"
            >
              Verify Agent ID
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
