/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        lemon: ["Lemon", "cursive"],
        robotoCondensed: ["Roboto Condensed", "sans-serif"],
        roboto: ["Roboto", "sans-serif"]
      },
      colors: {
        rabbitPrimary: "#F8EFE8", // Soft beige
        rabbitAccent: "#000", // Warm orange
        rabbitSecondary: "#4F4F4F" // Muted gray-brown
      }
    }
  },
  plugins: []
};
