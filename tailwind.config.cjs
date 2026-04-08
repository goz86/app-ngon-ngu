module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#e6f6f9',
          DEFAULT: '#008eb4',
          dark: '#007494',
        },
        secondary: {
          light: '#f1f5f9',
          DEFAULT: '#64748b',
          dark: '#475569',
        },
        accent: {
          success: '#10b981',
          danger: '#ef4444',
          warn: '#f59e0b',
        }
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'pill': '9999px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'premium': '0 10px 30px -5px rgba(0, 142, 180, 0.1)',
      }
    },
  },
  plugins: [],
}
