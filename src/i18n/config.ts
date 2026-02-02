import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationRO from './locales/ro.json';

const resources = {
  ro: {
    translation: translationRO
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ro', // Romanian only
    fallbackLng: 'ro',
    supportedLngs: ['ro'],
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;