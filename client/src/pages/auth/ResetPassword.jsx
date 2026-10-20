import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md card p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold">{isAr ? 'رابط غير صالح' : 'Invalid Link'}</h2>
          <p className="text-xs text-gray-500">
            {isAr ? 'رمز إعادة تعيين كلمة المرور غير متوفر أو غير صالح.' : 'Password reset token is missing or malformed.'}
          </p>
          <Link to="/forgot-password" className="btn-primary text-xs">
            {t('auth.forgotPassword')}
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      toast.success(isAr ? 'تم تحديث كلمة المرور بنجاح' : 'Password updated successfully!');
      setTimeout(() => navigate('/login'), 2500);
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
            <h1 className="text-2xl font-bold tracking-tight">{t('auth.resetPassword')}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isAr ? 'أدخل كلمة المرور الجديدة لحسابك' : 'Enter your new strong password'}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {isAr
                  ? 'تم إعادة تعيين كلمة المرور بنجاح. جاري توجيهك لصفحة تسجيل الدخول...'
                  : 'Your password has been reset. Redirecting to login...'}
              </p>
              <Link to="/login" className="btn-primary text-xs">
                {t('auth.signIn')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {t('auth.newPassword')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input ps-9"
                    placeholder="••••••••"
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
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="input ps-9"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 text-sm font-semibold"
              >
                {loading ? t('common.loading') : t('auth.resetPassword')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
