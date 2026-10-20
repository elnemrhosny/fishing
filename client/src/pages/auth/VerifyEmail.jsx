import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuth();
  const isAr = i18n.language === 'ar';

  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(isAr ? 'رمز التأكيد غير متوفر' : 'Verification token is missing');
      return;
    }

    let isMounted = true;
    verifyEmail(token)
      .then((data) => {
        if (isMounted) {
          setStatus('success');
          setMessage(data.message || t('auth.verifiedSuccess'));
        }
      })
      .catch((err) => {
        if (isMounted) {
          setStatus('error');
          setMessage(err.response?.data?.error || t('common.error'));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, verifyEmail, t, isAr]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card p-8 text-center space-y-4 shadow-md">
        {status === 'verifying' && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-brand-600 animate-spin mx-auto" />
            <h2 className="text-lg font-bold">{t('common.loading')}</h2>
            <p className="text-xs text-gray-500">
              {isAr ? 'جاري التحقق من بريدك الإلكتروني...' : 'Verifying your email address...'}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold">{t('auth.verifiedSuccess')}</h2>
            <p className="text-xs text-gray-600 dark:text-gray-300">{message}</p>
            <div className="pt-4">
              <Link to="/" className="btn-primary text-xs py-2.5 px-6">
                {isAr ? 'الذهاب إلى المتجر' : 'Continue Shopping'}
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold">{isAr ? 'فشل تأكيد البريد' : 'Verification Failed'}</h2>
            <p className="text-xs text-red-600 dark:text-red-400">{message}</p>
            <div className="pt-4">
              <Link to="/login" className="btn-secondary text-xs py-2.5 px-6">
                {t('auth.signIn')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
