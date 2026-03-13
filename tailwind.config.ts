import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        ink: {
          DEFAULT: "#0A0A0F",
          50: "#F2F2F7",
          100: "#E4E4ED",
          200: "#C8C8DA",
          300: "#9999B8",
          400: "#6666A0",
          500: "#3D3D6B",
          600: "#252550",
          700: "#161633",
          800: "#0D0D22",
          900: "#0A0A0F",
        },
        accent: {
          DEFAULT: "#6E56CF",
          light: "#9B8DD4",
          dark: "#4A3399",
        },
        ember: {
          DEFAULT: "#FF6B35",
          light: "#FF9268",
          dark: "#CC4A1A",
        },
        jade: {
          DEFAULT: "#2DD4BF",
          light: "#67E8D6",
          dark: "#0F9B8A",
        },
        surface: {
          DEFAULT: "#13131E",
          raised: "#1A1A2E",
          overlay: "#21213A",
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(110,86,207,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(110,86,207,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "32px 32px",
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease forwards",
        "fade-in": "fadeIn 0.3s ease forwards",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
