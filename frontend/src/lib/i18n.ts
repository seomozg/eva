import { translations, Language } from './translations';

export function getLanguage(): Language {
  return (localStorage.getItem('lang') as Language) || 'ru';
}

export function setLanguage(lang: Language) {
  localStorage.setItem('lang', lang);
}

export function t(key: keyof typeof translations.en): string {
  const lang = getLanguage();
  return translations[lang][key] || translations.en[key] || key;
}

export function useTranslation() {
  return { t, getLanguage, setLanguage };
}