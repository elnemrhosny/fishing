import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';
import ProductCard from '../components/ProductCard.jsx';
import { ProductCardSkeleton } from '../components/Skeleton.jsx';
import { Search, Filter, Fish, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Products() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAr = i18n.language === 'ar';

  const categoryFromUrl = searchParams.get('category') || '';
  const searchFromUrl = searchParams.get('search') || '';
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);

  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
  const [searchTerm, setSearchTerm] = useState(searchFromUrl);
  const [page, setPage] = useState(pageFromUrl);

  // Sync state when URL params change
  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
    setSearchTerm(searchFromUrl);
    setPage(pageFromUrl);
  }, [categoryFromUrl, searchFromUrl, pageFromUrl]);

  const updateFilters = (newCat, newSearch, newPage) => {
    const params = {};
    if (newCat) params.category = newCat;
    if (newSearch) params.search = newSearch;
    if (newPage > 1) params.page = newPage.toString();
    setSearchParams(params);
  };

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', selectedCategory, searchTerm, page],
    queryFn: () =>
      api
        .get('/products', {
          params: {
            category: selectedCategory || undefined,
            search: searchTerm || undefined,
            page,
            limit: 12,
          },
        })
        .then((r) => r.data),
  });

  const totalPages = data?.total ? Math.ceil(data.total / data.limit) : 1;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    updateFilters(selectedCategory, searchTerm, 1);
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setPage(1);
    updateFilters(catId, searchTerm, 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Filter bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('products.title')}
          </h1>
          {data?.total !== undefined && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('products.showing')} {data.products?.length || 0} {t('products.of')} {data.total} {t('products.items')}
            </p>
          )}
        </div>

        {/* Search input form */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('products.search')}
              className="input ps-9 pe-3"
            />
          </div>
          <button type="submit" className="btn-primary text-xs px-4">
            {t('common.search')}
          </button>
        </form>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => handleCategoryChange('')}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            !selectedCategory
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
          }`}
        >
          {t('products.allCategories')}
        </button>

        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedCategory === cat.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {isAr ? cat.name_ar : cat.name_en}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="card p-12 text-center text-red-500">
          <p>{t('common.error')}</p>
        </div>
      ) : data?.products?.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">
          <Fish className="w-16 h-16 mx-auto mb-4 opacity-30 text-brand-600" />
          <h3 className="font-bold text-gray-700 dark:text-gray-300 text-base mb-1">
            {t('products.noProducts')}
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {isAr
              ? 'جرب البحث بكلمات أخرى أو اختر فئة مختلفة لمشاهدة المنتجات المتوفرة.'
              : 'Try searching with different keywords or clear the category filters.'}
          </p>
          {(selectedCategory || searchTerm) && (
            <button
              onClick={() => {
                setSelectedCategory('');
                setSearchTerm('');
                updateFilters('', '', 1);
              }}
              className="btn-secondary text-xs mt-4"
            >
              {isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {data?.products?.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => {
              const p = Math.max(1, page - 1);
              setPage(p);
              updateFilters(selectedCategory, searchTerm, p);
            }}
            disabled={page <= 1}
            className="btn-secondary p-2 disabled:opacity-40"
            aria-label="Previous Page"
          >
            {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <span className="text-xs font-semibold px-4 text-gray-700 dark:text-gray-300">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => {
              const p = Math.min(totalPages, page + 1);
              setPage(p);
              updateFilters(selectedCategory, searchTerm, p);
            }}
            disabled={page >= totalPages}
            className="btn-secondary p-2 disabled:opacity-40"
            aria-label="Next Page"
          >
            {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
