/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1F3A7D',
        secondary: '#4B7CE6',
        accent: '#FF6B6B',
        light: '#F8F9FA',
        dark: '#2C3E50',
      },
    },
  },
  plugins: [],
}
