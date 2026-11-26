import { useState } from 'react';
import { ArrowLeft, Fingerprint, Lock, Mail, Shield } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/layout/Footer';
import Navigation from '../components/layout/Navigation';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { validateEmail } from '../utils/validators';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useNotification();

  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const newErrors: Record<string, string> = {};
    const emailErr = validateEmail(formData.email);
    if (emailErr) newErrors.email = emailErr;
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      showToast('Signed in to Descript', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Invalid email or password';
      setSubmitError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (submitError) setSubmitError(null);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-base-950 flex flex-col">
      <Navigation />

      <main className="flex-1 pt-24 pb-20">
        <div className="container-narrow">
          <div className="max-w-md mx-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-base-600 dark:text-base-400 hover:text-base-900 dark:hover:text-white mb-10 group text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to home
            </Link>

            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-descript-50 dark:bg-descript-950/60 text-descript-700 dark:text-descript-300 rounded-full text-xs font-medium uppercase tracking-wider mb-5">
                <Fingerprint className="h-3 w-3" />
                Sign In
              </div>

              <h1 className="text-3xl md:text-4xl font-semibold text-base-900 dark:text-white mb-3">
                Welcome back
              </h1>

              <p className="text-base-600 dark:text-base-300 text-sm sm:text-base">
                Sign in to your Descript account to manage agent identities and Bytecripts.
              </p>
            </div>

            {submitError && (
              <div
                role="alert"
                className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300"
              >
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-base-700 dark:text-base-200 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-base-400" />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`pl-10 w-full px-4 py-3 border ${
                      errors.email ? 'border-red-400' : 'border-base-300 dark:border-base-700'
                    } bg-white dark:bg-base-900 text-base-900 dark:text-base-100 rounded-lg focus:ring-2 focus:ring-descript-500/20 focus:border-descript-500 outline-none transition-colors`}
                    placeholder="you@company.com"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-base-700 dark:text-base-200 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-base-400" />
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`pl-10 w-full px-4 py-3 border ${
                      errors.password ? 'border-red-400' : 'border-base-300 dark:border-base-700'
                    } bg-white dark:bg-base-900 text-base-900 dark:text-base-100 rounded-lg focus:ring-2 focus:ring-descript-500/20 focus:border-descript-500 outline-none transition-colors`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-descript-600 hover:bg-descript-700 active:bg-descript-800 text-white font-semibold py-3.5 px-6 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              <p className="text-center text-base-600 dark:text-base-400 text-sm">
                Do not have an account?{' '}
                <Link
                  to="/signup"
                  className="text-descript-600 dark:text-descript-400 hover:underline font-medium"
                >
                  Sign up here
                </Link>
              </p>
            </form>

            <div className="mt-10 p-5 bg-base-50 dark:bg-base-900 rounded-xl border border-base-200 dark:border-base-800">
              <div className="flex items-start gap-3.5">
                <div className="shrink-0 h-9 w-9 rounded-lg bg-descript-50 dark:bg-descript-950 text-descript-600 dark:text-descript-400 flex items-center justify-center">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-base-900 dark:text-white mb-1">
                    Zero Key Custody
                  </h4>
                  <p className="text-xs text-base-600 dark:text-base-400 leading-relaxed">
                    Agent private keys are generated client-side or inside your Python runtime and are never stored on Descript servers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
