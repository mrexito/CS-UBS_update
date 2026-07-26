import type { Config } from "tailwindcss";
import lineClamp from "@tailwindcss/line-clamp";
import typography from "@tailwindcss/typography";

const config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-geist-mono)", "Menlo", "monospace"],
      },
      boxShadow: {
        surface: "0 10px 40px rgba(15, 23, 42, 0.06)",
        card: "0 20px 45px rgba(15, 23, 42, 0.08)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms ease-out",
        "scale-in": "scale-in 160ms ease-out",
        "fade-up": "fade-up 220ms ease-out",
      },
      colors: {
        bg: "hsl(var(--bg))",
        surface: "hsl(var(--surface))",
        "surface-2": "hsl(var(--surface-2))",
        border: "hsl(var(--border))",
        text: "hsl(var(--text))",
        muted: "hsl(var(--muted))",
        primary: "hsl(var(--primary))",
        "primary-hover": "hsl(var(--primary-hover))",
        ring: "hsl(var(--ring))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            color: theme("colors.text"),
            "--tw-prose-headings": theme("colors.text"),
            "--tw-prose-links": theme("colors.primary"),
            "--tw-prose-bold": theme("colors.text"),
            "--tw-prose-quotes": theme("colors.text"),
            "--tw-prose-counters": theme("colors.muted"),
            "--tw-prose-bullets": theme("colors.border"),
            "--tw-prose-hr": theme("colors.border"),
            "--tw-prose-th-borders": theme("colors.border"),
            "--tw-prose-td-borders": theme("colors.border"),
          },
        },
        invert: {
          css: {
            "--tw-prose-headings": theme("colors.text"),
            "--tw-prose-links": theme("colors.primary"),
            "--tw-prose-bold": theme("colors.text"),
            "--tw-prose-quotes": theme("colors.text"),
            "--tw-prose-counters": theme("colors.muted"),
            "--tw-prose-bullets": theme("colors.border"),
            "--tw-prose-hr": theme("colors.border"),
            "--tw-prose-th-borders": theme("colors.border"),
            "--tw-prose-td-borders": theme("colors.border"),
          },
        },
      }),
    },
  },
  plugins: [typography, lineClamp],
} satisfies Config;

export default config;
