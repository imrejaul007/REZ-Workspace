import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rez: {
          primary: "#6366F1",
          secondary: "#8B5CF6",
          accent: "#EC4899",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          dark: "#1E1B4B",
          light: "#F8FAFC",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
