import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "recipe-pink": "#E8608A",
        "recipe-navy": "#1B3A5C",
        "recipe-cream": "#FDF6EE",
        "recipe-gold": "#F4C842",
        "recipe-rose": "#FAE0E8",
        "recipe-light": "#FFF9F5",
      },
      fontFamily: {
        playfair: ["var(--font-playfair)", "serif"],
        nunito: ["var(--font-nunito)", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 16px rgba(27,58,92,0.08)",
        "card-hover": "0 8px 32px rgba(27,58,92,0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
