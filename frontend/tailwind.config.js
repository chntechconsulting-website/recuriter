/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        status: {
          new: '#2563EB',             // Blue
          contacted: '#7C3AED',       // Purple
          followup: '#EA580C',        // Orange
          interested: '#16A34A',      // Green
          confirmed: '#15803D',       // Dark Green
          notinterested: '#DC2626',   // Red
          noresponse: '#6B7280',      // Gray
          closed: '#1F2937',          // Black/Dark Slate
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
