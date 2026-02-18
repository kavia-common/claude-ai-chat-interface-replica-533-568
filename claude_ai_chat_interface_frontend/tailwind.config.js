/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'claude-primary': '#374151',
        'claude-secondary': '#6B7280',
        'claude-success': '#059669',
        'claude-error': '#EF4444',
      },
    },
  },
  plugins: [],
}
