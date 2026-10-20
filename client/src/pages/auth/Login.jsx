import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import toast from 'react-hot-toast';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const { t, i18n } = useTranslation();
  const { login, googleLogin, user } = useAuth();
  const { mergeGuestCart, fetchCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const isAr = i18n.language === 'ar';

  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Google Sign-In button mounting
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || typeof window === 'undefined' || !window.google) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            await googleLogin(response.credential);
            await mergeGuestCart();
            await fetchCart();
            toast.success(t('messages.loginSuccess'));
            navigate(from, { replace: true });
          } catch (err) {
            toast.error(err.response?.data?.error || t('common.error'));
          }
        },
      });

      const btnElement = document.getElementById('google-signin-btn');
      if (btnElement) {
        window.google.accounts.id.renderButton(btnElement, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'continue_with',
        });
      }
    } catch (e) {
      console.warn('Google sign-in init:', e);
    }
  }, [googleLogin, mergeGuestCart, fetchCart, navigate, from, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      await mergeGuestCart();
      await fetchCart();
      toast.success(t('messages.loginSuccess'));
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="card p-6 sm:p-8 space-y-6 shadow-md border-gray-200/80 dark:border-gray-800">
          <div className="text-center space-y-1">
            <span className="text-4xl">🎣</span>
            <h1 className="text-2xl font-bold tracking-tight">{t('auth.login')}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isAr ? 'أهلاً بك مجدداً في متجر FishingPro' : 'Welcome back to FishingPro'}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="input ps-9"
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t('auth.password')}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="input ps-9"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? t('common.loading') : t('auth.login')}</span>
            </button>
          </form>

          {/* Google Sign-In Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <span className="relative px-3 bg-white dark:bg-gray-900 text-xs text-gray-400 uppercase tracking-wider font-medium">
              {isAr ? 'أو' : 'OR'}
            </span>
          </div>

          <div className="flex justify-center">
            <div id="google-signin-btn" />
          </div>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
              {t('auth.signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
