import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api.js';
import { CheckCircle2, XCircle, Clock, ShoppingBag } from 'lucide-react';

export default function PaymentResult() {
  const { t, i18n } = useTranslation();
  const [params] = useSearchParams();
  const isAr = i18n.language === 'ar';

  // Read all potential identifier parameters from Paymob's redirection URL
  const queryOrderId =
    params.get('order_id') ||
    params.get('special_reference') ||
    params.get('merchant_order_id') ||
    params.get('extra_order_id');

  const paymobOrderId = params.get('order');
  const transactionId = params.get('id') || params.get('transaction_id') || params.get('txn_id');
  const successParam = params.get('success');

  const [paymentStatus, setPaymentStatus] = useState('checking'); // checking | paid | failed | pending
  const [resolvedOrderId, setResolvedOrderId] = useState(queryOrderId || '');

  useEffect(() => {
    // If we have neither an order identifier nor a transaction ID
    if (!queryOrderId && !paymobOrderId && !transactionId) {
      setPaymentStatus('failed');
      return;
    }

    let isMounted = true;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const lookupTarget = queryOrderId || paymobOrderId || transactionId || 'verify';

        const res = await api.get(`/payments/status/${lookupTarget}`, {
          params: {
            order_id: queryOrderId || undefined,
            paymob_order_id: paymobOrderId || undefined,
            transaction_id: transactionId || undefined,
            success: successParam || undefined,
          },
        });

        if (!isMounted) return;

        if (res.data?.order_id) {
          setResolvedOrderId(res.data.order_id);
        }

        if (res.data.payment_status === 'paid') {
          setPaymentStatus('paid');
        } else if (res.data.payment_status === 'failed' || successParam === 'false') {
          setPaymentStatus('failed');
        } else if (attempts < 6) {
          attempts++;
          setTimeout(checkStatus, 2500);
        } else {
          setPaymentStatus('pending');
        }
      } catch (err) {
        if (!isMounted) return;

        // If client reported success=true, show pending rather than hard failure
        if (successParam === 'true') {
          setPaymentStatus('pending');
        } else {
          setPaymentStatus('failed');
        }
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [queryOrderId, paymobOrderId, transactionId, successParam]);

  const displayOrderRef = resolvedOrderId || queryOrderId || paymobOrderId;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full card p-8 sm:p-10 text-center space-y-6 shadow-xl border-gray-200/80 dark:border-gray-800">
        {paymentStatus === 'checking' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center mx-auto animate-pulse">
              <Clock className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold">{t('common.loading')}</h1>
            <p className="text-xs text-gray-500">
              {isAr ? 'جاري تأكيد عملية الدفع وتحديث حالة الطلب...' : 'Verifying transaction status with payment gateway...'}
            </p>
          </div>
        )}

        {paymentStatus === 'paid' && (
          <div className="space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {t('messages.paymentSuccess')}
            </h1>
            <p className="text-xs text-gray-500">
              {isAr
                ? 'تم تأكيد الدفع بنجاح وجاري تجهيز طلبك للشحن والتوصيل.'
                : 'Your payment was successfully confirmed and your order is now in processing.'}
            </p>

            {displayOrderRef && (
              <p className="text-xs font-mono font-bold bg-gray-100 dark:bg-gray-800 py-1.5 px-3 rounded-lg text-gray-700 dark:text-gray-300 inline-block">
                {t('orders.orderNumber')}{displayOrderRef.slice(0, 8).toUpperCase()}
              </p>
            )}

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              {resolvedOrderId && (
                <Link to={`/orders/${resolvedOrderId}`} className="btn-primary text-xs py-2.5 px-5">
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
          <div className="space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-sm">
              <XCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-extrabold text-red-600 dark:text-red-400">
              {t('messages.paymentFailed')}
            </h1>
            <p className="text-xs text-gray-500">
              {isAr
                ? 'تعذر إتمام عملية الدفع. يمكنك إعادة المحاولة أو اختيار الدفع عند الاستلام.'
                : 'The payment could not be completed. You can retry with a different method or select Cash on Delivery.'}
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
              {isAr ? 'الدفع قيد المراجعة' : 'Payment Being Processed'}
            </h1>
            <p className="text-xs text-gray-500">
              {isAr
                ? 'طلبك مسجل ونحن في انتظار إشعار التأكيد النهائي من المحفظة أو البنك.'
                : 'Your order was registered. We are awaiting final confirmation from the provider.'}
            </p>
            {displayOrderRef && (
              <p className="text-xs font-mono font-bold bg-gray-100 dark:bg-gray-800 py-1.5 px-3 rounded-lg text-gray-700 dark:text-gray-300 inline-block">
                {t('orders.orderNumber')}{displayOrderRef.slice(0, 8).toUpperCase()}
              </p>
            )}
            <div className="pt-4 flex justify-center gap-3">
              {resolvedOrderId && (
                <Link to={`/orders/${resolvedOrderId}`} className="btn-primary text-xs py-2.5 px-5">
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
