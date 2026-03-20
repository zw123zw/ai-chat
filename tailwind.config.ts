/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        dark: {
          bg: 'var(--bg-color)',
          sidebar: 'var(--sidebar-color)',
          input: 'var(--input-color)',
          border: 'var(--border-color)',
          text: 'var(--text-color)',
          muted: 'var(--muted-color)',
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}
