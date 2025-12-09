const { defineConfig } = require("vite");
const vue = require("@vitejs/plugin-vue");

module.exports = defineConfig({
    root: "./frontend",
    plugins: [vue()],
    build: {
        outDir: "../dist",
    },
});
