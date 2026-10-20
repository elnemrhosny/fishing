import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Anchor } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎣</span>
            <div>
              <p className="font-extrabold text-base bg-gradient-to-r from-brand-600 to-sky-500 bg-clip-text text-transparent">
                FishingPro
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Premium Equipment for Sea & River Anglers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
            <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              {t('nav.home')}
            </Link>
            <Link to="/products" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              {t('nav.products')}
            </Link>
            <Link to="/about" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              {t('nav.about')}
            </Link>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center md:text-right rtl:md:text-left">
            © {new Date().getFullYear()} FishingPro Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
