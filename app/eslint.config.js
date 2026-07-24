const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const prettierConfig = require("eslint-config-prettier");

module.exports = tseslint.config(
    {
        // dist/node_modules/coverage/logs: generated or vendored output.
        // test-update-*.js: untracked local debug scripts (see .gitignore's
        // generic `app/**/*.js` rule) — not part of the application or test suite.
        ignores: [
            "dist/**",
            "node_modules/**",
            "coverage/**",
            "logs/**",
            "test-update-axios.js",
            "test-update-fetch.js",
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettierConfig,
    {
        rules: {
            // Existing code intentionally uses `any` at Prisma/JSON boundaries.
            // Downgraded to warn rather than rewritten wholesale; see STAB-004 baseline.
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": "warn",
        },
    },
    {
        // Plain CommonJS Node tooling config files, not application source.
        files: ["eslint.config.js", "jest.config.js"],
        languageOptions: {
            sourceType: "commonjs",
            globals: {
                require: "readonly",
                module: "writable",
                __dirname: "readonly",
                process: "readonly",
                console: "readonly",
            },
        },
        rules: {
            "@typescript-eslint/no-require-imports": "off",
        },
    },
);
