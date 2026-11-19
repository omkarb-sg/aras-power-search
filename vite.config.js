import { defineConfig } from "vite";

// import-export-libs-js's createEngineWorker loads its Worker with
// `new Worker(new URL("./browser-worker.js", import.meta.url))`, which makes Vite emit a
// 600 kB worker asset beside the bundle. Power search runs the export on the page and never
// starts that Worker, so cut the reference before Vite sees it.
const skipLibsJsWorker = {
	name: "skip-import-export-libs-js-worker",
	enforce: "pre",
	transform(code, id) {
		if (!id.includes("import-export-libs-js")) return null;
		const ref = 'new URL("./browser-worker.js", import.meta.url)';
		if (!code.includes(ref)) return null;
		return {
			code: code.replace(ref, '(() => { throw new Error("createEngineWorker is not bundled in power-search"); })()'),
			map: null,
		};
	},
};

export default defineConfig({
	plugins: [skipLibsJsWorker],
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
