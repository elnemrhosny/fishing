import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';
import ProductCard from '../components/ProductCard.jsx';
import { ProductCardSkeleton } from '../components/Skeleton.jsx';
import { ShieldCheck, Truck, CreditCard, Fish, ArrowRight, ArrowLeft } from 'lucide-react';

export default function Home() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'home-featured'],
    queryFn: () => api.get('/products?limit=8').then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-slate-900 to-brand-900 text-white py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs sm:text-sm font-medium">
            <Fish className="w-4 h-4" />
            <span>{isAr ? 'المتجر الأول لمعدات الصيد الإحترافية' : 'Egypt\'s Premier Fishing Destination'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            {isAr ? 'أفضل معدات الصيد لأفضل تجربة' : 'Gear Up for Your Next Catch'}
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-lg text-slate-300 leading-relaxed">
            {isAr
              ? 'تشكيلة واسعة من الصنارات، البكرات، الخيوط، والطعوم الصناعية من أشهر الماركات العالمية مع خدمة التوصيل والدفع عند الاستلام.'
              : 'Discover top-grade fishing rods, spinning reels, lures, and accessories engineered for freshwater and deep-sea angling.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/products"
              className="btn-primary text-sm sm:text-base px-6 py-3 font-semibold shadow-lg shadow-brand-500/25 flex items-center gap-2"
            >
              <span>{t('products.title')}</span>
              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Link>
            <Link
              to="/about"
              className="btn-secondary text-sm sm:text-base px-6 py-3 font-semibold"
            >
              {t('nav.about')}
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="card p-6 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base mb-1">
                {isAr ? 'شحن سريع لجميع المحافظات' : 'Fast Countrywide Delivery'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isAr ? 'توصيل مباشر حتى باب منزلك بأمان وسرعة.' : 'Reliable shipping to all governorates across Egypt.'}
              </p>
            </div>
          </div>

          <div className="card p-6 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base mb-1">
                {isAr ? 'دفع عند الاستلام وبطاقات' : 'Flexible Payment Options'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isAr ? 'كاش عند الاستلام، بطاقات بنكية، ومحافظ إلكترونية.' : 'Cash on delivery, bank cards, or mobile wallets via Paymob.'}
              </p>
            </div>
          </div>

          <div className="card p-6 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base mb-1">
                {isAr ? 'معدات صيد أصلية 100%' : '100% Genuine Gear'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isAr ? 'منتجات عالية الجودة مجربة ومضمونة.' : 'Tested and verified equipment for high-performance fishing.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      {categories && categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">{t('products.allCategories')}</h2>
            <Link to="/products" className="text-xs sm:text-sm text-brand-600 dark:text-brand-400 hover:underline">
              {isAr ? 'عرض الكل' : 'View all'}
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="flex-shrink-0 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-brand-500 hover:text-brand-600 transition-colors text-xs sm:text-sm font-medium shadow-sm"
              >
                {isAr ? cat.name_ar : cat.name_en}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">{t('products.title')}</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isAr ? 'أحدث وأفضل المنتجات المتوفرة في متجرنا' : 'Handpicked recommendations for your next fishing trip'}
            </p>
          </div>
          <Link
            to="/products"
            className="btn-outline text-xs px-3.5 py-2 inline-flex items-center gap-1.5"
          >
            <span>{isAr ? 'جميع المنتجات' : 'See All'}</span>
            {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : data?.products?.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <Fish className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t('products.noProducts')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {data?.products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
