import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#060B18",
        surface: "#0E162B",
        primary: "#2563EB",
        secondary: "#60A5FA",
        accent: "#93C5FD",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(96,165,250,.2), 0 10px 30px rgba(37,99,235,.2)",
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(148,163,184,.15) 1px, transparent 0)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
