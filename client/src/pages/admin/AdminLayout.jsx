import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Fish, FolderTree, ShoppingBag, FileText, ArrowLeft, ArrowRight } from 'lucide-react';

export default function AdminLayout({ children }) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const isAr = i18n.language === 'ar';

  const navItems = [
    { to: '/admin', label: t('admin.dashboard'), icon: LayoutDashboard, exact: true },
    { to: '/admin/products', label: t('admin.products'), icon: Fish },
    { to: '/admin/categories', label: t('admin.categories'), icon: FolderTree },
    { to: '/admin/orders', label: t('admin.orders'), icon: ShoppingBag },
    { to: '/admin/pages/about', label: t('admin.about'), icon: FileText },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Admin Navigation Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="card p-3 space-y-1">
            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              {t('nav.admin')}
            </div>

            {navItems.map((item) => {
              const active = item.exact
                ? pathname === item.to
                : pathname.startsWith(item.to);
              const Icon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    active
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
              <Link
                to="/"
                className="flex items-center gap-2 px-3.5 py-2 text-xs text-gray-500 hover:text-brand-600 transition-colors"
              >
                {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                <span>{isAr ? 'العودة للمتجر' : 'Return to Store'}</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Admin Content area */}
        <main className="flex-1 min-w-0 w-full">{children}</main>
      </div>
    </div>
  );
}
