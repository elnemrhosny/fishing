import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext.jsx';
import toast from 'react-hot-toast';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';

export default function ProductCard({ product }) {
  const { t, i18n } = useTranslation();
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const isAr = i18n.language === 'ar';

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    try {
      await addItem(product.id, 1);
      toast.success(t('messages.addedToCart'));
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setAdding(false);
    }
  };

  const title = isAr ? product.name_ar : product.name_en;
  const categoryName = isAr ? product.category_name_ar : product.category_name_en;

  return (
    <div className="card group overflow-hidden flex flex-col hover:border-brand-500/50 hover:shadow-md transition-all duration-300">
      <Link to={`/products/${product.id}`} className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={product.main_image_url}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500';
          }}
          loading="lazy"
        />
        {categoryName && (
          <span className="absolute top-2.5 start-2.5 bg-brand-600/90 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
            {categoryName}
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <Link to={`/products/${product.id}`}>
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              {title}
            </h3>
          </Link>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800/80">
          <div>
            <span className="text-base sm:text-lg font-bold text-brand-600 dark:text-brand-400">
              {Number(product.price).toFixed(2)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ms-1">
              {t('common.egp')}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
            title={t('products.addToCart')}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('products.addToCart')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
