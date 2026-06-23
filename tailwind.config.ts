import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#be185d", // rosa/magenta — clínica de estética
          soft: "#fce7f3",
          dark: "#9d174d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
