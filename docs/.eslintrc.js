module.exports = {
    root: true,
    env: { node: true, browser: true, es2021: true },
    settings: {
        react: { version: 'detect' },
    },
    extends: ['@self-kit/eslint-config-react-ts'],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    rules: {
        'unicorn/filename-case': 'off',
        '@typescript-eslint/no-shadow': 'off',
        '@typescript-eslint/naming-convention': 'off',
        "@typescript-eslint/consistent-type-imports": [
            "error",
            {
                "prefer": "type-imports"
            }
        ]
    },
    ignorePatterns: ['config/*', 'public/*'],
};
