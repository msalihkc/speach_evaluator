import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "#090D16",
        foreground: "#F3F4F6",
        charcoal: {
          900: "#090D16",
          800: "#111827",
          700: "#1F2937",
          600: "#374151",
        },
        emerald: {
          500: "#10B981",
          600: "#059669",
          400: "#34D399",
        },
        violet: {
          500: "#8B5CF6",
          600: "#7C3AED",
          400: "#A78BFA",
        }
      },
    },
  },
  plugins: [],
};
export default config;
