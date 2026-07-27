import { defineConfig } from "vite";

export default defineConfig({
	define: {
		"process.env.NODE_ENV": JSON.stringify("production"),
	},
	// React is aliased to preact/compat: same API surface, ~1/6th the bundle.
	// Order matters — the more specific paths must come before bare "react".
	resolve: {
		alias: {
			"react/jsx-runtime": "preact/jsx-runtime",
			"react-dom/client": "preact/compat/client",
			"react-dom": "preact/compat",
			react: "preact/compat",
		},
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
