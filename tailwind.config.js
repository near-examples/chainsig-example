// tailwind.config.js
const defaultTheme = require("tailwindcss/defaultTheme");
const plugin = require("tailwindcss/plugin");
const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./build/**/*.{js,ts,jsx,tsx,mdx,html}*",
    "./build/**/*.{js,ts,jsx,tsx,mdx,html}*"
  ], 
  theme: {
    extend: {
      fontFamily: {
        sans: ["CircularXXSub", ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        xs: "0.8rem",
      },
      colors: {
        ethereum: "#5577F6",
        aurora: "#41C87B",
        near: "#000",
        nearGreen: "#6CE89E",
        sky: colors.sky,
      },
      textColor: (theme) => ({
        primary: theme("colors.gray.900"),
        secondary: "#8a8a8a",
      }),
      scale: {
        103: "1.03",
      },
      boxShadow: {
        card: "0 5px 15px 0 rgba(0, 0, 0, 0.15)",
      },
      spacing: {
        "2px": "2px",
      },
      maxWidth: (theme) => ({
        ...theme("width"),
      }),
      minWidth: (theme) => ({
        ...theme("width"),
      }),
      maxHeight: (theme) => ({
        ...theme("height"),
        "screen-1/2": "50vh",
      }),
      minHeight: (theme) => ({
        ...theme("height"),
      }),
      animation: {
        "spin-slow": "spin 3s linear infinite",
      },
      typography: (theme) => ({
        light: {
          css: [
            {
              color: theme("colors.gray.200"),
              '[class~="lead"]': {
                color: theme("colors.gray.300"),
              },
              a: {
                color: theme("colors.white"),
              },
              strong: {
                color: theme("colors.white"),
              },
              "ol > li::before": {
                color: theme("colors.gray.400"),
              },
              "ul > li::before": {
                backgroundColor: theme("colors.gray.600"),
              },
              hr: {
                borderColor: theme("colors.gray.200"),
              },
              blockquote: {
                color: theme("colors.gray.200"),
                borderLeftColor: theme("colors.gray.600"),
              },
              h1: {
                color: theme("colors.white"),
              },
              h2: {
                color: theme("colors.white"),
              },
              h3: {
                color: theme("colors.white"),
              },
              h4: {
                color: theme("colors.white"),
              },
              "figure figcaption": {
                color: theme("colors.gray.400"),
              },
              code: {
                color: theme("colors.white"),
              },
              "a code": {
                color: theme("colors.white"),
              },
              pre: {
                color: theme("colors.gray.200"),
                backgroundColor: theme("colors.gray.800"),
              },
              thead: {
                color: theme("colors.white"),
                borderBottomColor: theme("colors.gray.400"),
              },
              "tbody tr": {
                borderBottomColor: theme("colors.gray.600"),
              },
            },
          ],
        },
      }),
    },
  },
  plugins: [],
};
