import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
  const { t, i18n } = useTranslation();
  const { forgotPassword } = useAuth();
  const isAr = i18n.language === 'ar';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
      toast.success(isAr ? 'تم إرسال تعليمات إعادة التعيين' : 'Reset link sent!');
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
            <h1 className="text-2xl font-bold tracking-tight">{t('auth.forgotPassword')}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isAr
                ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.'
                : 'Enter your registered email address to receive password reset instructions.'}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {isAr
                  ? 'إذا كان هذا البريد مسجلاً لدينا، فقد تم إرسال رابط إعادة التعيين إليه.'
                  : 'If that email address is in our system, we have sent a password reset link to it.'}
              </p>
              <Link to="/login" className="btn-secondary text-xs inline-flex items-center gap-1.5 mt-2">
                {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                <span>{t('auth.backToLogin')}</span>
              </Link>
            </div>
          ) : (
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input ps-9"
                    placeholder="name@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 text-sm font-semibold"
              >
                {loading ? t('common.loading') : t('auth.sendResetLink')}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 inline-flex items-center gap-1"
                >
                  {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                  <span>{t('auth.backToLogin')}</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
