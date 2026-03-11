import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dashboard/.next/**",
      "coverage/**",
      "tmp/**",
      "*.min.js"
    ]
  },
  {
    files: ["server/**/*.js", "dashboard/**/*.js", "tests/**/*.js"],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "no-console": "off"
    }
  },
  {
    files: ["eslint.config.mjs"],
    rules: {
      "import/no-anonymous-default-export": "off"
    }
  }
];

export default config;
