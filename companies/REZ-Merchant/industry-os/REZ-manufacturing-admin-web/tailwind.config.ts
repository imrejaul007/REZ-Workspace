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
        primary: { 50: "#f0f9ff", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca" },
        secondary: { 500: "#8b5cf6", 600: "#7c3aed" },
        accent: { 500: "#ec4899", 600: "#db2777" },
      },
    },
  },
  plugins: [],
};
export default config;