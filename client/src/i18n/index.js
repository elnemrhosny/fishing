import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.js';
import ar from './ar.js';

const initialLang = localStorage.getItem('lang') || 'en';

i18n.use(initReactI18next).init({
  resources: { en, ar },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Sync dir attribute
if (typeof document !== 'undefined') {
  document.documentElement.dir = initialLang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = initialLang;
}

export default i18n;
