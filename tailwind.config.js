/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#f8f9fb',
        panel: '#ffffff',
        border: '#e2e5e9',
        text: '#1a1d21',
        'text-muted': '#6b7280',
        accent: '#16a34a',
        'accent-hover': '#15803d',
        'accent-light': '#dcfce7',
        wifi: '#2563eb',
        'wifi-light': '#dbeafe',
        offline: '#9ca3af',
        error: '#dc2626',
        'error-light': '#fef2f2',
        warning: '#d97706',
        'warning-light': '#fffbeb',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
