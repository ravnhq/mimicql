module.exports = {
  extends: 'kentcdodds',
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    // Disable for now until the Boolean ? a : b issue is fixed
    '@typescript-eslint/no-unnecessary-condition': 'off',
  },
  overrides: [
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
      },
    },
  ],
  parserOptions: {
    project: './tsconfig.eslint.json',
  },
}
