import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';
import { Package, Truck, CreditCard, ArrowRight, ArrowLeft } from 'lucide-react';

const STATUS_BADGES = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
};

export default function OrderDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">{t('common.error')}</h2>
        <Link to="/orders" className="btn-primary text-xs">
          {t('orders.title')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-600 dark:text-gray-400 transition-colors"
      >
        {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        <span>{t('orders.title')}</span>
      </Link>

      <div className="card p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-mono">
              {t('orders.orderNumber')}{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(order.created_at).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                STATUS_BADGES[order.status] || ''
              }`}
            >
              {t(`orders.statuses.${order.status}`)}
            </span>
          </div>
        </div>

        {/* Shipping & Payment Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100 dark:border-gray-800 text-xs sm:text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-gray-100">
              <Truck className="w-4 h-4 text-brand-600" />
              <span>{t('checkout.shipping')}</span>
            </div>
            <div className="text-gray-600 dark:text-gray-300 space-y-0.5">
              <p className="font-semibold">{order.shipping_name}</p>
              <p>{order.shipping_phone}</p>
              <p>{order.shipping_address}, {order.shipping_city}</p>
              {order.guest_email && <p className="text-gray-400">{order.guest_email}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-gray-100">
              <CreditCard className="w-4 h-4 text-brand-600" />
              <span>{t('checkout.paymentMethod')}</span>
            </div>
            <div className="text-gray-600 dark:text-gray-300 space-y-0.5">
              <p className="font-semibold uppercase">{order.payment_method}</p>
              <p>
                {t('orders.paymentStatus')}:{' '}
                <span className="font-medium">
                  {t(`orders.paymentStatuses.${order.payment_status}`)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm text-gray-900 dark:text-gray-100">
            {isAr ? 'المنتجات المطلوبة' : 'Ordered Items'}
          </h2>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {isAr ? item.name_ar_snapshot : item.name_en_snapshot}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {item.quantity} × {Number(item.price_snapshot).toFixed(2)} {t('common.egp')}
                  </p>
                </div>
                <span className="font-bold">
                  {(Number(item.price_snapshot) * item.quantity).toFixed(2)} {t('common.egp')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing totals */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-gray-500">
            <span>{t('cart.subtotal')}</span>
            <span>{Number(order.subtotal).toFixed(2)} {t('common.egp')}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>{t('cart.shipping')}</span>
            <span>{Number(order.shipping_fee).toFixed(2)} {t('common.egp')}</span>
          </div>
          <div className="flex justify-between font-extrabold text-base pt-2 border-t border-gray-200 dark:border-gray-800">
            <span>{t('cart.total')}</span>
            <span className="text-brand-600 dark:text-brand-400">
              {Number(order.total).toFixed(2)} {t('common.egp')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
