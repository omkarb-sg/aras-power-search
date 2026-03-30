import { defineConfig } from "vite";

export default defineConfig({
	define: {
		"process.env.NODE_ENV": JSON.stringify("production"),
	},
	build: {
		lib: {
			entry: "src/main.tsx",
			name: "ArasPowerSearch",
		},
		outDir: "output",
		emptyOutDir: true,
		// minify: "terser",
		// terserOptions: {
		// 	mangle: {
		// 		properties: true,
		// 		toplevel: true,
		// 		// nth_identifier: {
		// 		// 	get: (n) => {
		// 		// 		return `_aps_${n}`;
		// 		// 	},
		// 		// },
		// 	},
		// },
		rollupOptions: {
			external: [],
			output: [
				{
					format: "iife",
					name: "ArasPowerSearch",
					entryFileNames: "compiled.js",
				},
				{
					format: "cjs",
					entryFileNames: "compiled.cjs",
				},
			],
		},
	},
});
