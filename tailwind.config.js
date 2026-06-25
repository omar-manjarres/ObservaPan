/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#faf6f0",
          100: "#f3e9d9",
          200: "#e7d2b3",
          300: "#d8b483",
          400: "#c8965a",
          500: "#bb7f42",
          600: "#a16836",
          700: "#82512f",
          800: "#6b432c",
          900: "#593a28",
        },
        crust: "#6b432c",
        beige: "#f3e9d9",
        gold: "#d8b483",
        favorable: "#16a34a",
        warning: "#eab308",
        critical: "#dc2626",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
