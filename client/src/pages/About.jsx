import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Edit3 } from 'lucide-react';

export default function About() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isAr = i18n.language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['page', 'about'],
    queryFn: () => api.get('/pages/about').then((r) => r.data),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {t('about.title')}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isAr ? 'تعرف على قصة شغفنا بالصيد ومهمتنا لخدمة الصيادين' : 'Our passion for angling and dedication to modern fishing equipment'}
          </p>
        </div>

        {user?.role === 'admin' && (
          <Link
            to="/admin/pages/about"
            className="btn-outline text-xs px-3.5 py-2 inline-flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t('about.edit')}</span>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="skeleton h-8 w-2/3 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
          <div className="skeleton h-4 w-4/5 rounded" />
        </div>
      ) : (
        <div
          className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: isAr ? data?.content_ar : data?.content_en,
          }}
        />
      )}
    </div>
  );
}
