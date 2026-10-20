import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { ShoppingBag, DollarSign, Fish, Users, ArrowUpRight } from 'lucide-react';

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="card p-5 sm:p-6 flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100">
          {value}
        </p>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('admin.dashboard')}</h1>
        <p className="text-xs text-gray-500 mt-1">
          {isAr ? 'نظرة عامة على المبيعات، الطلبات، والمنتجات' : 'Key sales performance and inventory metrics'}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t('admin.stats.totalOrders')}
            value={data?.total_orders ?? 0}
            icon={ShoppingBag}
            color="bg-blue-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400"
          />
          <StatCard
            title={t('admin.stats.totalRevenue')}
            value={`${Number(data?.total_revenue || 0).toFixed(2)} ${t('common.egp')}`}
            icon={DollarSign}
            color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
          />
          <StatCard
            title={t('admin.stats.totalProducts')}
            value={data?.total_products ?? 0}
            icon={Fish}
            color="bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400"
          />
          <StatCard
            title={t('admin.stats.totalCustomers')}
            value={data?.total_customers ?? 0}
            icon={Users}
            color="bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
          />
        </div>
      )}

      {/* Quick shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/products"
          className="card p-5 hover:border-brand-500 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600">
              <Fish className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">{t('admin.products')}</p>
              <p className="text-[11px] text-gray-500">{isAr ? 'إضافة وتعديل المنتجات' : 'Manage equipment catalog'}</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-gray-400" />
        </Link>

        <Link
          to="/admin/categories"
          className="card p-5 hover:border-brand-500 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">{t('admin.categories')}</p>
              <p className="text-[11px] text-gray-500">{isAr ? 'تصنيفات وفئات المنتجات' : 'Manage product categories'}</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-gray-400" />
        </Link>

        <Link
          to="/admin/orders"
          className="card p-5 hover:border-brand-500 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">{t('admin.orders')}</p>
              <p className="text-[11px] text-gray-500">{isAr ? 'متابعة الشحن والتوصيل' : 'View customer orders'}</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-gray-400" />
        </Link>
      </div>

      {/* Recent orders */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-sm sm:text-base">
            {isAr ? 'أحدث الطلبات المستلمة' : 'Recent Customer Orders'}
          </h2>
          <Link to="/admin/orders" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
            {isAr ? 'عرض كل الطلبات' : 'View all orders'}
          </Link>
        </div>

        {data?.recent_orders?.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
            {t('orders.noOrders')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-gray-50/80 dark:bg-gray-800/50 text-gray-500 font-semibold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="py-3 px-4 text-start">{t('orders.orderNumber')}</th>
                  <th className="py-3 px-4 text-start">{t('checkout.name')}</th>
                  <th className="py-3 px-4 text-start">{t('orders.status')}</th>
                  <th className="py-3 px-4 text-start">{t('orders.paymentStatus')}</th>
                  <th className="py-3 px-4 text-start">{t('orders.total')}</th>
                  <th className="py-3 px-4 text-start">{t('orders.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:border-gray-800">
                {data?.recent_orders?.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-brand-600">
                      {order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 px-4">{order.shipping_name}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-gray-800">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-gray-800">
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold">
                      {Number(order.total).toFixed(2)} {t('common.egp')}
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
