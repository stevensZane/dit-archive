/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class', // On activera le mode via une classe 'dark' sur le body ou html
  theme: {
    extend: {
      colors: {
        'dit-blue': '#004751',
        'dit-yellow': '#FDB813',
        'dit-pink': '#E91E63',
        'dit-teal': '#007A87',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}