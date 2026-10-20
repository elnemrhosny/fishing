import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';
import { useCart } from '../context/CartContext.jsx';
import toast from 'react-hot-toast';
import {
  ShoppingCart,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { addItem } = useCart();
  const isAr = i18n.language === 'ar';

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [adding, setAdding] = useState(false);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}`).then((r) => r.data),
  });

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await addItem(product.id, quantity);
      toast.success(t('messages.addedToCart'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="skeleton aspect-square rounded-2xl w-full" />
          <div className="space-y-4">
            <div className="skeleton h-5 w-24 rounded-full" />
            <div className="skeleton h-8 w-3/4 rounded" />
            <div className="skeleton h-8 w-1/3 rounded" />
            <div className="skeleton h-28 w-full rounded" />
            <div className="skeleton h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">{t('common.error')}</h2>
        <Link to="/products" className="btn-primary text-xs">
          {t('products.title')}
        </Link>
      </div>
    );
  }

  const title = isAr ? product.name_ar : product.name_en;
  const description = isAr ? product.description_ar : product.description_en;
  const categoryName = isAr ? product.category_name_ar : product.category_name_en;

  const allImages = [
    product.main_image_url,
    ...(product.images ? product.images.map((img) => img.url) : []),
  ].filter(Boolean);

  const activeImage = selectedImage || product.main_image_url;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb back */}
      <Link
        to="/products"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-600 dark:text-gray-400 transition-colors"
      >
        {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        <span>{t('products.title')}</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm">
            <img
              src={activeImage}
              alt={title}
              className="w-full h-full object-cover transition-all duration-300"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=700';
              }}
            />
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {allImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-gray-100 dark:bg-gray-800 ${
                    activeImage === imgUrl
                      ? 'border-brand-600 ring-2 ring-brand-500/20 shadow-sm'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=150';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            {categoryName && (
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                {categoryName}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {title}
            </h1>
          </div>

          <div className="flex items-baseline gap-2 pb-4 border-b border-gray-200 dark:border-gray-800">
            <span className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">
              {Number(product.price).toFixed(2)}
            </span>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {t('common.egp')}
            </span>
          </div>

          {description && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('products.description')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {t('cart.quantity')}:
              </span>
              <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-sm">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{t('products.addToCart')}</span>
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 pt-6 border-t border-gray-200 dark:border-gray-800 text-center text-[11px] text-gray-500 dark:text-gray-400">
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900 flex flex-col items-center gap-1">
              <Truck className="w-4 h-4 text-brand-600" />
              <span>{isAr ? 'توصيل سريع' : 'Fast Delivery'}</span>
            </div>
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900 flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'ضمان أصلي' : 'Genuine Gear'}</span>
            </div>
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900 flex flex-col items-center gap-1">
              <RotateCcw className="w-4 h-4 text-purple-600" />
              <span>{isAr ? 'استرجاع ميسر' : 'Easy Return'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
