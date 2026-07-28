import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactNativePlugin from "eslint-plugin-react-native";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.jsx"],
    plugins: {
      react: reactPlugin,
      "react-native": reactNativePlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // React Native globals
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        alert: "readonly",
        __DEV__: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        process: "readonly",
        global: "readonly",
        FormData: "readonly",
        AbortController: "readonly",
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // Core JS errors
      "no-undef": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-unreachable": "error",
      "no-duplicate-case": "error",
      "no-empty": "warn",
      "no-extra-semi": "warn",
      "no-func-assign": "error",
      "no-dupe-keys": "error",
      "no-dupe-args": "error",
      "no-constant-condition": "warn",
      "no-irregular-whitespace": "warn",
      
      // React
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      "react/no-direct-mutation-state": "error",
      "react/jsx-no-duplicate-props": "error",
      
      // Security - no console.log in production
      "no-console": "off", // just check, don't block
    },
  },
  {
    ignores: ["node_modules/**", "*.config.*", "babel.config.js"],
  },
];
