/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // TrustFi Polkadot Theme
        trustfi: {
          pink: '#E6007A',      // Polkadot primary pink
          purple: '#552BBF',    // Deep purple
          blue: '#0066CC',      // Trust blue
          green: '#10B981',     // Success green
          gray: {
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827'
          }
        }
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #0D1421 0%, #1A202C 100%)',
        'gradient-card': 'linear-gradient(135deg, #2D3748 0%, #4A5568 100%)',
      },
      boxShadow: {
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        'dark-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      }
    },
  },
  plugins: [],
}