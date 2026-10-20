import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import toast from 'react-hot-toast';
import {
  ShoppingCart,
  Sun,
  Moon,
  Globe,
  User,
  ShieldCheck,
  Package,
  LogOut,
  LogIn,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { count, setIsOpen } = useCart();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLang = () => {
    const nextLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('lang', nextLang);
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLang;
  };

  const handleLogout = async () => {
    await logout();
    toast.success(t('messages.logoutSuccess'));
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-brand-700 dark:text-brand-400">
            <span className="text-2xl select-none">🎣</span>
            <span className="tracking-tight font-extrabold bg-gradient-to-r from-brand-600 to-sky-500 bg-clip-text text-transparent">
              FishingPro
            </span>
          </Link>

          {/* Desktop Navigation links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-gray-700 hover:text-brand-600 dark:text-gray-200 dark:hover:text-brand-400 transition-colors"
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/products"
              className="text-sm font-medium text-gray-700 hover:text-brand-600 dark:text-gray-200 dark:hover:text-brand-400 transition-colors"
            >
              {t('nav.products')}
            </Link>
            <Link
              to="/about"
              className="text-sm font-medium text-gray-700 hover:text-brand-600 dark:text-gray-200 dark:hover:text-brand-400 transition-colors"
            >
              {t('nav.about')}
            </Link>
            {user && (
              <Link
                to="/orders"
                className="text-sm font-medium text-gray-700 hover:text-brand-600 dark:text-gray-200 dark:hover:text-brand-400 transition-colors inline-flex items-center gap-1.5"
              >
                <Package className="w-4 h-4" />
                <span>{t('nav.orders')}</span>
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t('nav.admin')}</span>
              </Link>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switch */}
            <button
              onClick={toggleLang}
              className="btn-secondary px-3 py-1.5 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t('common.language')}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Toggle Dark Mode"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Cart Drawer Trigger */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 rounded-lg text-gray-700 hover:text-brand-600 dark:text-gray-200 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Shopping Cart"
              aria-label="Open Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 rtl:-left-1 rtl:right-auto bg-brand-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900 shadow-sm animate-in zoom-in-50">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>

            {/* User Profile / Auth buttons */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 rtl:pr-2 border-l rtl:border-l-0 rtl:border-r border-gray-200 dark:border-gray-800">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 max-w-[120px] truncate" title={user.name}>
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 dark:text-red-400 inline-flex items-center gap-1"
                  title={t('nav.logout')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1">
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('nav.login')}</span>
                </Link>
                <Link to="/register" className="btn-primary text-xs px-3 py-1.5">
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile buttons */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 text-gray-700 dark:text-gray-200"
              aria-label="Open Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute top-0 right-0 rtl:left-0 rtl:right-auto bg-brand-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 pt-2 pb-4 space-y-3">
          <div className="flex flex-col space-y-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {t('nav.products')}
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {t('nav.about')}
            </Link>
            {user && (
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {t('nav.orders')}
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40"
              >
                {t('nav.admin')}
              </Link>
            )}
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={toggleLang} className="btn-secondary px-3 py-1.5 text-xs">
                {t('common.language')}
              </button>
              <button onClick={toggle} className="btn-secondary p-1.5" aria-label="Toggle theme">
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="btn-secondary text-xs text-red-600"
              >
                {t('nav.logout')}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
