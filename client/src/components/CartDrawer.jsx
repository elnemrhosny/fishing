import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext.jsx';
import { Link } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';

export default function CartDrawer() {
  const { t, i18n } = useTranslation();
  const { items, total, count, isOpen, setIsOpen, updateItem, removeItem } = useCart();
  const isAr = i18n.language === 'ar';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      <div className={`fixed inset-y-0 ${isAr ? 'left-0' : 'right-0'} max-w-full flex`}>
        <div className="w-screen max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col border-l dark:border-gray-800">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h2 className="text-lg font-bold">{t('cart.title')}</h2>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full font-semibold">
                {count}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-3xl mb-4">
                  🎣
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {t('cart.empty')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mb-6">
                  {t('cart.emptySubtitle')}
                </p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="btn-primary text-xs"
                >
                  {t('cart.continueShopping')}
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product_id}
                  className="flex gap-3.5 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
                >
                  <img
                    src={item.main_image_url}
                    alt={isAr ? item.name_ar : item.name_en}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-white dark:bg-gray-800"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=150';
                    }}
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm line-clamp-1">
                        {isAr ? item.name_ar : item.name_en}
                      </h4>
                      <p className="text-brand-600 dark:text-brand-400 font-bold text-xs sm:text-sm mt-0.5">
                        {Number(item.price).toFixed(2)} {t('common.egp')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900">
                        <button
                          onClick={() => updateItem(item.product_id, Math.max(1, item.quantity - 1))}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                          title="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateItem(item.product_id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                          title="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title={t('cart.remove')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout button */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('cart.subtotal')}</span>
                <span className="font-semibold">{total.toFixed(2)} {t('common.egp')}</span>
              </div>
              <div className="flex justify-between items-center text-base font-bold">
                <span>{t('cart.total')}</span>
                <span className="text-brand-600 dark:text-brand-400">
                  {total.toFixed(2)} {t('common.egp')}
                </span>
              </div>

              <Link
                to="/checkout"
                onClick={() => setIsOpen(false)}
                className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <span>{t('cart.checkout')}</span>
                {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
