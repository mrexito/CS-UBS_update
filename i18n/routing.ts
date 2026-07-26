import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
    locales: ["en", "de", "fr", "es", "it"],
    defaultLocale: "de",
    localePrefix: "as-needed",
}); 