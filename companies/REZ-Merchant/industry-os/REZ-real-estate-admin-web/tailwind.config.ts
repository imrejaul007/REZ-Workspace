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
        primary: { 50: "#fdf4ff", 500: "#a855f7", 600: "#9333ea", 700: "#7e22ce" },
        secondary: { 500: "#3b82f6", 600: "#2563eb" },
        accent: { 500: "#14b8a6", 600: "#0d9488" },
      },
    },
  },
  plugins: [],
};
export default config;