import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { OrderSkeleton } from '../components/Skeleton.jsx';
import { Package, Clock, ArrowRight, ArrowLeft } from 'lucide-react';

const STATUS_BADGES = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
};

export default function OrderHistory() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders').then((r) => r.data),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {t('orders.title')}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isAr ? 'تابع حالة طلباتك السابقة ومواعيد التوصيل' : 'Track current and previous orders'}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <OrderSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="card p-8 text-center text-red-500">
          <p>{t('common.error')}</p>
        </div>
      ) : orders?.length === 0 ? (
        <div className="card p-16 text-center text-gray-400 space-y-3">
          <Package className="w-16 h-16 mx-auto opacity-30 text-brand-600" />
          <h3 className="font-bold text-gray-700 dark:text-gray-300 text-base">
            {t('orders.noOrders')}
          </h3>
          <Link to="/products" className="btn-primary text-xs mt-2 inline-block">
            {t('products.title')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-500/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                    {t('orders.orderNumber')}{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      STATUS_BADGES[order.status] || ''
                    }`}
                  >
                    {t(`orders.statuses.${order.status}`)}
                  </span>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(order.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>

                <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100 pt-1">
                  {Number(order.total).toFixed(2)} {t('common.egp')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {t('orders.paymentStatus')}:{' '}
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {t(`orders.paymentStatuses.${order.payment_status}`)}
                  </span>
                </span>

                <Link
                  to={`/orders/${order.id}`}
                  className="btn-outline text-xs px-3.5 py-2 inline-flex items-center gap-1.5"
                >
                  <span>{t('orders.viewDetails')}</span>
                  {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
