import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api.js';
import toast from 'react-hot-toast';
import { Package, Truck, Check, ChevronRight, X } from 'lucide-react';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_BADGES = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
};

export default function AdminOrders() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const isAr = i18n.language === 'ar';

  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => api.get('/orders').then((r) => r.data),
  });

  const { data: selectedOrder, isLoading: loadingDetail } = useQuery({
    queryKey: ['order', selectedOrderId],
    queryFn: () => api.get(`/orders/${selectedOrderId}`).then((r) => r.data),
    enabled: !!selectedOrderId,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['order', selectedOrderId] });
      toast.success(t('messages.saved'));
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || t('common.error'));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('admin.orders')}</h1>
        <p className="text-xs text-gray-500 mt-1">
          {isAr ? 'متابعة وتحديث حالات الشحن وتفاصيل طلبات العملاء' : 'Review orders, check payment status, and update fulfillments'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Orders list (7 cols) */}
        <div className="lg:col-span-7 card overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-bold">{t('orders.title')} ({orders?.length || 0})</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : orders?.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              {t('orders.noOrders')}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:border-gray-800 max-h-[600px] overflow-y-auto">
              {orders.map((order) => {
                const isSelected = selectedOrderId === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`p-4 cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs ${
                      isSelected
                        ? 'bg-brand-50/70 dark:bg-brand-950/40 border-s-4 border-brand-600'
                        : 'hover:bg-gray-50/60 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                          {order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            STATUS_BADGES[order.status] || ''
                          }`}
                        >
                          {t(`orders.statuses.${order.status}`)}
                        </span>
                      </div>
                      <p className="text-gray-500">
                        {order.shipping_name} — {order.shipping_city}
                      </p>
                      <p className="text-gray-400 text-[11px]">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-end space-y-1">
                      <span className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
                        {Number(order.total).toFixed(2)} {t('common.egp')}
                      </span>
                      <p className="text-[10px] uppercase font-semibold text-gray-400">
                        {order.payment_method} / {order.payment_status}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Order Detail Sidebar (5 cols) */}
        <div className="lg:col-span-5">
          {!selectedOrderId ? (
            <div className="card p-12 text-center text-gray-400 text-xs">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30 text-brand-600" />
              <p>{isAr ? 'اضغط على أي طلب من القائمة لمشاهدة تفاصيله وتحديث حالته' : 'Select an order from the list to view details and update fulfillment status.'}</p>
            </div>
          ) : loadingDetail ? (
            <div className="card p-12 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : selectedOrder ? (
            <div className="card p-5 sm:p-6 space-y-5 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="font-bold text-base font-mono">
                    {selectedOrder.id.slice(0, 8).toUpperCase()}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Update controls */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  {t('admin.updateStatus')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((st) => (
                    <button
                      key={st}
                      onClick={() =>
                        statusMutation.mutate({ id: selectedOrder.id, status: st })
                      }
                      disabled={statusMutation.isPending}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        selectedOrder.status === st
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {t(`orders.statuses.${st}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer and shipping info */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-850 text-xs space-y-1">
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  {selectedOrder.shipping_name}
                </p>
                <p className="text-gray-500">{selectedOrder.shipping_phone}</p>
                <p className="text-gray-500">
                  {selectedOrder.shipping_address}, {selectedOrder.shipping_city}
                </p>
                {selectedOrder.guest_email && (
                  <p className="text-gray-400 text-[11px]">{selectedOrder.guest_email}</p>
                )}
              </div>

              {/* Ordered items */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-gray-700 dark:text-gray-300">
                  {isAr ? 'المنتجات' : 'Items'}
                </h4>
                <div className="divide-y divide-gray-100 dark:border-gray-800">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="py-2 flex justify-between">
                      <span className="font-medium">
                        {isAr ? item.name_ar_snapshot : item.name_en_snapshot} × {item.quantity}
                      </span>
                      <span className="font-semibold">
                        {(Number(item.price_snapshot) * item.quantity).toFixed(2)} {t('common.egp')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex justify-between font-extrabold text-sm">
                  <span>{t('cart.total')}</span>
                  <span className="text-brand-600 dark:text-brand-400">
                    {Number(selectedOrder.total).toFixed(2)} {t('common.egp')}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
