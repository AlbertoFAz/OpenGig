import { es } from "./es";
import { en } from "./en";

export type Locale = "es" | "en";

type StringLeaves<T> = {
  [K in keyof T]: T[K] extends string ? string : StringLeaves<T[K]>;
};
export type Translations = StringLeaves<typeof es>;

export const locales: Record<Locale, Translations> = { es, en };

export const LOCALE_LABELS: Record<Locale, string> = { es: "ES", en: "EN" };

export { es, en };
