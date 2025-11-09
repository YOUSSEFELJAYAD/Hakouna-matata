/**
 * Internationalization Configuration
 */

export const defaultLocale = "en";

export const locales = ["en", "fr", "es", "de", "ja", "zh"] as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  ja: "日本語",
  zh: "中文",
};

export function getLocaleFromHeader(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const preferred = acceptLanguage.split(",")[0].split("-")[0];
  return locales.includes(preferred as Locale)
    ? (preferred as Locale)
    : defaultLocale;
}
