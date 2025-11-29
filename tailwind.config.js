module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#f4582f', // primary brand orange from logo
          dark: '#d34724'
        }
      },
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        'soft': '0 4px 24px -2px rgba(0,0,0,0.08)'
      }
    },
  },
  plugins: [],
}
