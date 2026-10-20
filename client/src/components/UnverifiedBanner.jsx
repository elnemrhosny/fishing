import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function UnverifiedBanner() {
  const { user, resendVerification } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // If user is not logged in or is already verified, do not show
  if (!user || user.is_verified === 1) return null;

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendVerification(user.email);
      setSent(true);
      toast.success(t('auth.verificationSent'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 px-4 py-2.5 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span>{t('auth.unverifiedNotice')}</span>
        </div>
        <button
          onClick={handleResend}
          disabled={loading || sent}
          className="font-medium underline hover:text-amber-950 dark:hover:text-amber-100 disabled:opacity-50 inline-flex items-center gap-1"
        >
          {sent ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('auth.verificationSent')}</span>
            </>
          ) : (
            t('auth.resendVerification')
          )}
        </button>
      </div>
    </div>
  );
}
