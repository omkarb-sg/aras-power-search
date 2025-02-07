import { defineConfig } from "vite";

export default defineConfig({
	build: {
		lib: {
			entry: "src/main.js",
			name: "ArasPowerSearch",
			fileName: "aras-power-search",
			formats: ["es", "cjs", "iife", "system", "umd"],
		},
		outDir: "output",
		minify: "terser",
		terserOptions: {
			mangle: {
				properties: true,
				toplevel: true,
				nth_identifier: {
					get: (n) => {
						return `_aps_${n}`;
					},
				},
			},
		},
		rollupOptions: {
			external: [],
		},
	},
});
