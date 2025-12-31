import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        'aviator-dark': '#0A0E1A',
        'aviator-dark-2': '#0D1224',
        'aviator-green': '#00C853',
        'aviator-green-dark': '#00A843',
        'aviator-red': '#FF1744',
        'aviator-red-dark': '#D50032',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0, 200, 83, 0.7)" },
          "50%": { boxShadow: "0 0 0 15px rgba(0, 200, 83, 0)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 200, 83, 0.5)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 200, 83, 0.8)" },
        },
      },
      animation: {
        rise: "rise 0.8s ease both",
        float: "float 8s ease-in-out infinite",
        pulse: "pulse 2s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite",
      },
      boxShadow: {
        'green-glow': '0 0 30px rgba(0, 200, 83, 0.5)',
        'red-glow': '0 0 30px rgba(255, 23, 68, 0.5)',
      },
    },
  },
  plugins: [],
};

export default config;
