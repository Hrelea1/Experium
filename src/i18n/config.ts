import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

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

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: (code) => {
      // If the detected language is Romanian, use Romanian
      if (code && code.toLowerCase().startsWith('ro')) {
        return 'ro';
      }
      // For all other languages, use English
      return 'en';
    },
    supportedLngs: ['ro', 'en'],
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    },
    load: 'languageOnly',
    nonExplicitSupportedLngs: true
  });

export default i18n;
