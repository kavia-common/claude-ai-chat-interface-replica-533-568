/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors from design spec
        'dark-primary': '#1a1a1a',
        'dark-secondary': '#212121',
        'dark-elevated': '#2a2a2a',
        'dark-hover': '#2d2d2d',
        'dark-active': '#333333',
        'border-primary': '#363636',
        'border-subtle': '#2a2a2a',
        'border-focus': '#404040',
        'text-primary': '#e8e8e8',
        'text-secondary': '#a8a8a8',
        'text-tertiary': '#808080',
        'text-muted': '#666666',
        'accent-primary': '#c17950',
        'accent-hover': '#d68b61',
        'accent-pressed': '#a86842',
        // Keep existing claude colors for compatibility
        'claude-primary': '#374151',
        'claude-secondary': '#6B7280',
        'claude-success': '#059669',
        'claude-error': '#EF4444',
      },
      boxShadow: {
        'dropdown': '0 8px 24px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)',
        'elevated': '0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)',
      },
      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(8px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.2s ease forwards',
      },
    },
  },
  plugins: [],
}
