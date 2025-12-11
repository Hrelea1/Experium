import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationRO from './locales/ro.json';
import translationEN from './locales/en.json';

const resources = {
  ro: {
    translation: translationRO
  },
  en: {
    translation: translationEN
  }
};

// Get saved language from localStorage or default to Romanian
const savedLanguage = typeof window !== 'undefined' 
  ? localStorage.getItem('i18nextLng') || 'ro'
  : 'ro';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage, // Default to saved language or Romanian
    fallbackLng: 'ro',
    supportedLngs: ['ro', 'en'],
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;