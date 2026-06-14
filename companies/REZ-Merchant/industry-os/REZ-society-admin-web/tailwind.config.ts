import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { 50: "#eff6ff", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1" },
        secondary: { 500: "#22c55e", 600: "#16a34a" },
        accent: { 500: "#f97316", 600: "#ea580c" },
      },
    },
  },
  plugins: [],
};
export default config;