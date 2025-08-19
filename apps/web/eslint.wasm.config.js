export default [
  {
    files: ["public/wasm/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        self: "readonly",
        console: "readonly",
        performance: "readonly",
        SharedArrayBuffer: "readonly",
        Uint32Array: "readonly",
        Worker: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        fetch: "readonly",
        URL: "readonly",
        WebAssembly: "readonly",
        Math: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      "no-undef": "error",
      "prefer-const": "warn",
      "no-var": "error",
    },
  },
];
