import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'status-green': '#10B981',
        'status-yellow': '#F59E0B',
        'status-red': '#EF4444',
        'status-green-bg': '#D1FAE5',
        'status-yellow-bg': '#FEF3C7',
        'status-red-bg': '#FEE2E2',
      },
    },
  },
  plugins: [],
};

export default config;
