import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import api from '../lib/api.js';
import toast from 'react-hot-toast';
import {
  Truck,
  CreditCard,
  Banknote,
  Smartphone,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { items, total, fetchCart } = useCart();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: '',
    address: '',
    city: '',
    guest_email: '',
    method: 'cod', // cod | card | wallet
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">{t('cart.empty')}</h2>
        <p className="text-xs text-gray-500">{t('cart.emptySubtitle')}</p>
        <Link to="/products" className="btn-primary text-xs">
          {t('cart.continueShopping')}
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const orderPayload = {
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        shipping: {
          name: form.name,
          phone: form.phone,
          address: form.address,
          city: form.city,
        },
        payment_method: form.method,
        guest_email: !user ? form.guest_email : undefined,
      };

      const checkoutRes = await api.post('/orders/checkout', orderPayload);
      const { order_id, payment_method } = checkoutRes.data;

      await fetchCart();

      if (payment_method === 'cod') {
        toast.success(t('messages.orderPlaced'));
        navigate(`/orders/${order_id}`);
        return;
      }

      // Online payment via Paymob
      toast.loading(isAr ? 'جاري توجيهك إلى بوابة الدفع...' : 'Connecting to secure payment gateway...');
      const payRes = await api.post('/payments/initiate', {
        order_id,
        method: payment_method,
      });

      const { client_secret, public_key } = payRes.data;

      // Redirect user to Paymob's Unified Checkout page
      const paymobCheckoutUrl = `https://accept.paymob.com/unifiedcheckout/?publicKey=${public_key}&clientSecret=${client_secret}`;
      window.location.href = paymobCheckoutUrl;
    } catch (err) {
      toast.dismiss();
      setError(
        err.response?.data?.error ||
          err.response?.data?.errors?.[0]?.msg ||
          t('common.error')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {t('checkout.title')}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isAr
            ? 'يرجى مراجعة تفاصيل العنوان واختيار وسيلة الدفع المفضلة لديك'
            : 'Please review your delivery details and choose your preferred payment option'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Checkout Form (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Shipping section */}
          <div className="card p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <Truck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h2 className="font-bold text-base">{t('checkout.shipping')}</h2>
            </div>

            {!user && (
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {t('auth.email')} ({t('checkout.guestCheckout')})
                </label>
                <input
                  type="email"
                  required
                  value={form.guest_email}
                  onChange={(e) => setForm((f) => ({ ...f, guest_email: e.target.value }))}
                  className="input"
                  placeholder="name@example.com"
                />
                <p className="text-[11px] text-gray-400 mt-1">{t('checkout.guestEmailNotice')}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {t('checkout.name')}
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input"
                  placeholder={isAr ? 'أحمد محمد' : 'Ahmed Mohamed'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {t('checkout.phone')}
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="input"
                  placeholder="01012345678"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {t('checkout.address')}
                </label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="input"
                  placeholder={isAr ? 'الشارع، رقم العمارة، الشقة' : 'Street name, building, apt'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {t('checkout.city')}
                </label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="input"
                  placeholder={isAr ? 'القاهرة / الإسكندرية...' : 'Cairo / Alexandria...'}
                />
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="card p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <CreditCard className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h2 className="font-bold text-base">{t('checkout.paymentMethod')}</h2>
            </div>

            <div className="space-y-3">
              {/* COD */}
              <label
                className={`flex items-center gap-3.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  form.method === 'cod'
                    ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/30'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  value="cod"
                  checked={form.method === 'cod'}
                  onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                />
                <Banknote className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-bold">{t('checkout.cod')}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {isAr ? 'ادفع نقداً لمندوب التوصيل عند استلام الطلب' : 'Pay in cash directly upon receipt of your package'}
                  </p>
                </div>
              </label>

              {/* Card (Paymob) */}
              <label
                className={`flex items-center gap-3.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  form.method === 'card'
                    ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/30'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  value="card"
                  checked={form.method === 'card'}
                  onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                />
                <CreditCard className="w-5 h-5 text-brand-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-bold">{t('checkout.card')}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Visa, MasterCard, Meeza (Paymob 3D-Secure)
                  </p>
                </div>
              </label>

              {/* Wallet (Paymob) */}
              <label
                className={`flex items-center gap-3.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  form.method === 'wallet'
                    ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/30'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  value="wallet"
                  checked={form.method === 'wallet'}
                  onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                />
                <Smartphone className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-bold">{t('checkout.wallet')}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Vodafone Cash, Orange, Etisalat, WE Pay
                  </p>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
          >
            <span>{loading ? t('common.loading') : t('checkout.placeOrder')}</span>
            {isAr ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        {/* Order Summary Sidebar (5 cols) */}
        <div className="lg:col-span-5 card p-5 sm:p-6 space-y-4 sticky top-24">
          <h2 className="font-bold text-base pb-3 border-b border-gray-100 dark:border-gray-800">
            {t('checkout.orderSummary')}
          </h2>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.product_id} className="flex gap-3 items-center text-xs sm:text-sm">
                <img
                  src={item.main_image_url}
                  alt={isAr ? item.name_ar : item.name_en}
                  className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-gray-800 flex-shrink-0"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=100';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{isAr ? item.name_ar : item.name_en}</p>
                  <p className="text-gray-400 text-xs">
                    {item.quantity} × {Number(item.price).toFixed(2)} {t('common.egp')}
                  </p>
                </div>
                <span className="font-semibold flex-shrink-0">
                  {(Number(item.price) * item.quantity).toFixed(2)} {t('common.egp')}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>{t('cart.subtotal')}</span>
              <span>{total.toFixed(2)} {t('common.egp')}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>{t('cart.shipping')}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {isAr ? 'مجاني' : 'Free'}
              </span>
            </div>
            <div className="flex justify-between font-extrabold text-base pt-2 border-t border-gray-200 dark:border-gray-800">
              <span>{t('cart.total')}</span>
              <span className="text-brand-600 dark:text-brand-400">
                {total.toFixed(2)} {t('common.egp')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
