const { defineConfig } = require("vite");
const vue = require("@vitejs/plugin-vue");

module.exports = defineConfig({
    root: "./frontend",
    plugins: [vue()],
    build: {
        outDir: "../dist",
    },
    server: {
        proxy: {
            "/api": {
                target: `http://localhost:${process.env.BACKEND_PORT || 3000}`,
                changeOrigin: true,
            },
        },
    },
    test: {
        environment: "jsdom",
        globals: true,
        root: ".",
        include: ["frontend/**/*.test.js"],
    },
});
