module.exports = {
  root: true,
  parserOptions: {
    project: "./tsconfig.eslint.json",
  },
  extends: [
    "@ravn-dev/eslint-config-ravn/base",
    "@ravn-dev/eslint-config-ravn/jest",
    "@ravn-dev/eslint-config-ravn/typescript",
  ],
  rules: {},
  overrides: [
    {
      files: ["**/*.test.{ts,tsx}"],
      rules: {
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
      },
    },
  ],
  parserOptions: {
    project: "./tsconfig.eslint.json",
  },
}
