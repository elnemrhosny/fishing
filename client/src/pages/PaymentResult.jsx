import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api.js';
import { CheckCircle2, XCircle, Clock, ArrowRight, ArrowLeft } from 'lucide-react';

export default function PaymentResult() {
  const { t, i18n } = useTranslation();
  const [params] = useSearchParams();
  const isAr = i18n.language === 'ar';

  const orderId =
    params.get('order') ||
    params.get('merchant_order_id') ||
    params.get('extra_order_id');

  const [paymentStatus, setPaymentStatus] = useState('checking'); // checking | paid | failed | pending
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setPaymentStatus('failed');
      return;
    }

    let isMounted = true;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const res = await api.get(`/payments/status/${orderId}`);
        if (!isMounted) return;

        setOrderDetails(res.data);

        if (res.data.payment_status === 'paid') {
          setPaymentStatus('paid');
        } else if (res.data.payment_status === 'failed') {
          setPaymentStatus('failed');
        } else if (attempts < 6) {
          // Poll every 2.5 seconds up to 6 times to give webhook time
          attempts++;
          setTimeout(checkStatus, 2500);
        } else {
          setPaymentStatus('pending');
        }
      } catch {
        if (isMounted) setPaymentStatus('pending');
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full card p-8 sm:p-10 text-center space-y-6 shadow-lg">
        {paymentStatus === 'checking' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center mx-auto animate-pulse">
              <Clock className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold">{t('common.loading')}</h1>
            <p className="text-xs text-gray-500">
              {isAr ? 'جاري التحقق من نجاح عملية الدفع...' : 'Verifying transaction status with the payment gateway...'}
            </p>
          </div>
        )}

        {paymentStatus === 'paid' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {t('messages.paymentSuccess')}
            </h1>
            <p className="text-xs text-gray-500">
              {isAr
                ? 'تم تأكيد الدفع واستلام طلبك بنجاح وجاري تجهيزه للشحن.'
                : 'Your payment was successfully authorized and your order is now in processing.'}
            </p>
            {orderId && (
              <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 py-1.5 px-3 rounded-lg text-gray-600 dark:text-gray-300">
                {t('orders.orderNumber')}{orderId.slice(0, 8).toUpperCase()}
              </p>
            )}
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              {orderId && (
                <Link to={`/orders/${orderId}`} className="btn-primary text-xs py-2.5 px-5">
                  {t('orders.viewDetails')}
                </Link>
              )}
              <Link to="/products" className="btn-secondary text-xs py-2.5 px-5">
                {isAr ? 'متابعة التسوق' : 'Continue Shopping'}
              </Link>
            </div>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-extrabold text-red-600 dark:text-red-400">
              {t('messages.paymentFailed')}
            </h1>
            <p className="text-xs text-gray-500">
              {isAr
                ? 'تعذر إتمام عملية الدفع. يمكنك إعادة المحاولة أو اختيار الدفع عند الاستلام.'
                : 'The payment could not be processed. Please retry or choose Cash on Delivery.'}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/checkout" className="btn-primary text-xs py-2.5 px-5">
                {t('common.retry')}
              </Link>
              <Link to="/" className="btn-secondary text-xs py-2.5 px-5">
                {t('nav.home')}
              </Link>
            </div>
          </div>
        )}

        {paymentStatus === 'pending' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10" />
            </div>
            <h1 className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {isAr ? 'الدفع قيد المراجعة' : 'Payment Processing'}
            </h1>
            <p className="text-xs text-gray-500">
              {isAr
                ? 'طلبك مسجل ونحن في انتظار إشعار التأكيد النهائي من البنك/المحفظة.'
                : 'Your order was registered. We are awaiting the final confirmation callback from your provider.'}
            </p>
            <div className="pt-4 flex justify-center gap-3">
              {orderId && (
                <Link to={`/orders/${orderId}`} className="btn-primary text-xs py-2.5 px-5">
                  {t('orders.viewDetails')}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
