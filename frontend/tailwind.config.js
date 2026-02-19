/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--hms-primary)',
        'primary-dark': 'var(--hms-primary-dark)',
        'primary-light': 'var(--hms-primary-light)',
        secondary: 'var(--hms-secondary)',
        accent: 'var(--hms-accent)',
        surface: 'var(--hms-surface)',
        'surface-muted': 'var(--hms-surface-muted)',
      },
    },
  },
  plugins: [],
};
