import { translations } from './translations';
import { LanguageCode, Translator } from './types';

export const getT = (lang: LanguageCode): Translator => {
  return (key: string, replacements?: { [key: string]: string | number }): string => {
    let translation = translations[lang][key] || translations['en'][key] || key;
    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            translation = translation.replace(`{{${placeholder}}}`, String(replacements[placeholder]));
        });
    }
    return translation;
  };
};