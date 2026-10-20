import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import toast from 'react-hot-toast';
import { UserPlus, User, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const { t, i18n } = useTranslation();
  const { register } = useAuth();
  const { mergeGuestCart, fetchCart } = useCart();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await register(form.email, form.password, form.name);
      await mergeGuestCart();
      await fetchCart();

      toast.success(t('messages.registerSuccess'));
      setVerificationPending(true);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.errors?.[0]?.msg ||
          t('common.error')
      );
    } finally {
      setLoading(false);
    }
  };

  if (verificationPending) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md card p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">{t('auth.emailVerification')}</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            {t('auth.verificationSent')}
          </p>
          <div className="pt-4 flex flex-col gap-2">
            <Link to="/" className="btn-primary text-xs py-2.5">
              {isAr ? 'متابعة إلى المتجر' : 'Continue to Store'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="card p-6 sm:p-8 space-y-6 shadow-md border-gray-200/80 dark:border-gray-800">
          <div className="text-center space-y-1">
            <span className="text-4xl">🎣</span>
            <h1 className="text-2xl font-bold tracking-tight">{t('auth.register')}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isAr ? 'أنشئ حسابك واستمتع بتجربة تسوق سريعة' : 'Join FishingPro and enjoy exclusive angler gear'}
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
                {t('auth.name')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input ps-9"
                  placeholder={isAr ? 'أحمد محمد' : 'Ahmed Mohamed'}
                  autoComplete="name"
                />
              </div>
            </div>

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
              <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="input ps-9"
                  placeholder={isAr ? '8 أحرف على الأقل' : 'At least 8 characters'}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={form.confirm}
                  onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                  className="input ps-9"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? t('common.loading') : t('auth.register')}</span>
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
