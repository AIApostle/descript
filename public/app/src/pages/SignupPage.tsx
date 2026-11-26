import { useState } from 'react';
import { ArrowLeft, Building2, Check, Fingerprint, Lock, Mail, Shield, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/layout/Footer';
import Navigation from '../components/layout/Navigation';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { validateEmail, validatePassword } from '../utils/validators';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { showToast } = useNotification();

  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    const emailErr = validateEmail(formData.email);
    if (emailErr) newErrors.email = emailErr;
    const passErr = validatePassword(formData.password);
    if (passErr) newErrors.password = passErr;
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms to continue';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name.trim(),
        organization: formData.organization.trim() || undefined,
      });
      showToast('Account created. Welcome to Descript!', 'success');
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Unable to create account';
      setSubmitError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (submitError) setSubmitError(null);
  };

  const benefits = [
    'Persistent global Agent IDs across Byte Networks',
    'Client-side Ed25519 key generation & rotation',
    'Signed Bytecript digital identity cards',
    'Official Python SDK for programmatic registration',
    'Challenge-response verification endpoints',
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-base-950 flex flex-col bg-grid-pattern">
      <Navigation />

      <main className="flex-1 pt-28 sm:pt-36 pb-20">
        <div className="container-narrow">
          <div className="max-w-4xl mx-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-base-600 dark:text-base-400 hover:text-base-900 dark:hover:text-white mb-10 group text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to home
            </Link>

            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-descript-50 dark:bg-descript-950/60 text-descript-700 dark:text-descript-300 rounded-full text-xs font-medium uppercase tracking-wider mb-5">
                    <Fingerprint className="h-3 w-3" />
                    Create Controller Account
                  </div>

                  <h1 className="text-3xl md:text-4xl font-semibold text-base-900 dark:text-white mb-3">
                    Issue verifiable agent identities
                  </h1>

                  <p className="text-base-600 dark:text-base-300 text-sm sm:text-base">
                    Create your Descript workspace to register agents, rotate Ed25519 credentials, and integrate the Python SDK.
                  </p>
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300"
                  >
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="signup-name"
                      className="block text-sm font-medium text-base-700 dark:text-base-200 mb-1.5"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-base-400" />
                      </div>
                      <input
                        id="signup-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`pl-10 w-full px-4 py-3 border ${
                          errors.name ? 'border-red-400' : 'border-base-300 dark:border-base-700'
                        } bg-white dark:bg-base-900 text-base-900 dark:text-base-100 rounded-lg focus:ring-2 focus:ring-descript-500/20 focus:border-descript-500 outline-none`}
                        placeholder="Elena Vance"
                      />
                    </div>
                    {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
                  </div>

                  <div>
                    <label
                      htmlFor="signup-org"
                      className="block text-sm font-medium text-base-700 dark:text-base-200 mb-1.5"
                    >
                      Organization (optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Building2 className="h-4 w-4 text-base-400" />
                      </div>
                      <input
                        id="signup-org"
                        type="text"
                        name="organization"
                        value={formData.organization}
                        onChange={handleChange}
                        className="pl-10 w-full px-4 py-3 border border-base-300 dark:border-base-700 bg-white dark:bg-base-900 text-base-900 dark:text-base-100 rounded-lg focus:ring-2 focus:ring-descript-500/20 focus:border-descript-500 outline-none"
                        placeholder="Bytecraft Labs"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="signup-email"
                      className="block text-sm font-medium text-base-700 dark:text-base-200 mb-1.5"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-base-400" />
                      </div>
                      <input
                        id="signup-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`pl-10 w-full px-4 py-3 border ${
                          errors.email ? 'border-red-400' : 'border-base-300 dark:border-base-700'
                        } bg-white dark:bg-base-900 text-base-900 dark:text-base-100 rounded-lg focus:ring-2 focus:ring-descript-500/20 focus:border-descript-500 outline-none`}
                        placeholder="elena@bytecraft.dev"
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
                  </div>

                  <div>
                    <label
                      htmlFor="signup-password"
                      className="block text-sm font-medium text-base-700 dark:text-base-200 mb-1.5"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-base-400" />
                      </div>
                      <input
                        id="signup-password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`pl-10 w-full px-4 py-3 border ${
                          errors.password ? 'border-red-400' : 'border-base-300 dark:border-base-700'
                        } bg-white dark:bg-base-900 text-base-900 dark:text-base-100 rounded-lg focus:ring-2 focus:ring-descript-500/20 focus:border-descript-500 outline-none`}
                        placeholder="Minimum 8 characters"
                      />
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="signup-confirm"
                      className="block text-sm font-medium text-base-700 dark:text-base-200 mb-1.5"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Shield className="h-4 w-4 text-base-400" />
                      </div>
                      <input
                        id="signup-confirm"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`pl-10 w-full px-4 py-3 border ${
                          errors.confirmPassword ? 'border-red-400' : 'border-base-300 dark:border-base-700'
                        } bg-white dark:bg-base-900 text-base-900 dark:text-base-100 rounded-lg focus:ring-2 focus:ring-descript-500/20 focus:border-descript-500 outline-none`}
                        placeholder="Repeat password"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 rounded border-base-300 text-descript-600 focus:ring-descript-500"
                    />
                    <label htmlFor="acceptTerms" className="text-sm text-base-600 dark:text-base-300">
                      I agree to manage agent private keys securely and understand lost private keys cannot be recovered by Descript.
                    </label>
                  </div>
                  {errors.acceptTerms && (
                    <p className="text-xs text-red-600 dark:text-red-400">{errors.acceptTerms}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-descript-600 hover:bg-descript-700 active:bg-descript-800 text-white font-semibold py-3.5 px-6 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>

                  <p className="text-center text-base-600 dark:text-base-400 text-sm">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="text-descript-600 dark:text-descript-400 hover:underline font-medium"
                    >
                      Sign in here
                    </Link>
                  </p>
                </form>
              </div>

              <div className="bg-base-50 dark:bg-base-900 rounded-2xl p-8 border border-base-200 dark:border-base-800 self-start">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-base-900 dark:text-white mb-3">
                    Included in Descript
                  </h2>
                  <p className="text-sm text-base-600 dark:text-base-300">
                    Cryptographic identity infrastructure built for autonomous agents and Python runtimes.
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="shrink-0 h-6 w-6 rounded-full bg-descript-100 dark:bg-descript-950 text-descript-600 dark:text-descript-400 flex items-center justify-center mt-0.5">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-medium text-base-700 dark:text-base-200">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-white dark:bg-base-950 rounded-xl border border-base-200 dark:border-base-800 p-5">
                  <div className="text-xs uppercase tracking-widest text-base-500 mb-2">
                    PYTHON SDK READY
                  </div>
                  <pre className="font-mono text-xs text-base-800 dark:text-base-200 overflow-x-auto">
                    <code>{`pip install descript\n\nclient = DescriptClient(api_key="dsc_...")\nagent, kp = client.agents.create_with_generated_key(\n    name="My Agent"\n)`}</code>
                  </pre>
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
