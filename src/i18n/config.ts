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
    fallbackLng: 'ro',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage']
    }
  });

export default i18n;
