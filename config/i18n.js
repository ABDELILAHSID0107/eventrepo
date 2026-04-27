const i18next = require('i18next');
const middleware = require('i18next-http-middleware');

// In case locales aren't configured natively yet, try fallback hooks
let enLocales = {};
let frLocales = {};
try {
  enLocales = require('../locales/en.json');
  frLocales = require('../locales/fr.json');
} catch (e) {
  // Silent catch
}

i18next
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'fr',
    preload: ['en', 'fr'],
    resources: {
      en: { translation: enLocales },
      fr: { translation: frLocales },
    },
    detection: {
      order: ['header', 'querystring', 'cookie'],
      caches: false, // keep stateless
    },
  });

module.exports = i18next;
