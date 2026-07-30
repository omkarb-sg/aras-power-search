import type { SearchItemData } from "../types/search";

function deriveBaseUrl(serverUrl: string): string {
	return serverUrl
		.replace(/\/Server\/InnovatorServer\.aspx.*$/i, "")
		.replace(/\/+$/, "");
}

function getConnContext(aras: ArasGlobal) {
	const url = deriveBaseUrl(aras.getServerURL());
	const database = aras.getDatabase();
	const header = aras.OAuthClient.getAuthorizationHeader();
	const token = header?.Authorization || "";
	return { url, database, token };
}

function checkPackage(
	aras: ArasGlobal,
	configId: string,
): { inPackage: boolean; packageName: string } {
	const aml = `<AML><Item type='PackageElement' action='get' select='source_id(source_id(name))'><element_id>${configId}</element_id></Item></AML>`;
	const res = aras.IomInnovator.applyAML(aml);

	if (res.isError()) {
		const errStr = res.getErrorString();
		if (/no items of type/i.test(errStr)) return { inPackage: false, packageName: "" };
		return { inPackage: false, packageName: "" };
	}

	if (res.getItemCount() === 0) return { inPackage: false, packageName: "" };

	const pe = res.getItemByIndex(0);
	let packageName = "";
	try {
		const grp = pe.getPropertyItem("source_id");
		const pkg = grp?.getPropertyItem("source_id");
		packageName = pkg?.getProperty("name") || "";
	} catch {
		// leave empty
	}
	return { inPackage: true, packageName };
}

interface ExportResult {
	ok: boolean;
	filename?: string;
	xml?: string;
	error?: string;
}

/**
 * Ping the quick-export extension's content script and wait for its pong.
 *
 * Export only works when that extension is loaded, so the UI probes for it up front rather
 * than letting the user click an export button that can only fail 30s later. Resolves false
 * on timeout — absence is the expected answer, not an error.
 */
export function probeExtension(topWindow: Window, timeoutMs = 800): Promise<boolean> {
	return new Promise((resolve) => {
		const id = `ps-ping-${Date.now()}`;

		const cleanup = () => {
			topWindow.removeEventListener("message", handler);
			clearTimeout(timer);
		};

		const handler = (ev: MessageEvent) => {
			const d = ev.data;
			if (!d || d.__ps !== "pong" || d.id !== id) return;
			cleanup();
			resolve(true);
		};

		topWindow.addEventListener("message", handler);
		topWindow.postMessage({ __ps: "ping", id }, "*");

		const timer = setTimeout(() => {
			cleanup();
			resolve(false);
		}, timeoutMs);
	});
}

function callExtension(
	topWindow: Window,
	body: Record<string, unknown>,
): Promise<ExportResult> {
	return new Promise((resolve, reject) => {
		const id = `ps-${Date.now()}`;

		const handler = (ev: MessageEvent) => {
			const d = ev.data;
			if (!d || d.__ps !== "export-res" || d.id !== id) return;
			topWindow.removeEventListener("message", handler);
			clearTimeout(timer);
			if (d.ok) resolve(d.result as ExportResult);
			else reject(new Error(d.error || "export failed"));
		};

		topWindow.addEventListener("message", handler);
		topWindow.postMessage({ __ps: "export-req", id, body }, "*");

		const timer = setTimeout(() => {
			topWindow.removeEventListener("message", handler);
			reject(new Error("Export timed out — is the quick-export extension installed?"));
		}, 30000);
	});
}

export async function exportItem(
	topWindow: Window,
	item: SearchItemData,
): Promise<void> {
	const aras = topWindow.aras;
	if (!aras) return;

	const pkg = checkPackage(aras, item.itemConfigId);
	if (!pkg.inPackage || !pkg.packageName) {
		aras.AlertError(`Cannot export: "${item.name}" is not in a PackageDefinition.`);
		return;
	}

	const conn = getConnContext(aras);
	const reqId = `ps-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

	const body = {
		reqId,
		conn,
		item: {
			itemType: item.itemTypeName,
			itemId: item.itemId,
			keyedName: item.name,
			package: pkg.packageName,
		},
		options: { exportReferenced: true },
	};

	try {
		const result = await callExtension(topWindow, body);

		if (!result.ok) {
			aras.AlertError(`Export failed: ${result.error || "unknown error"}`);
			return;
		}

		if (result.xml && result.filename) {
			const blob = new Blob([result.xml], { type: "application/xml" });
			const url = URL.createObjectURL(blob);
			const a = topWindow.document.createElement("a");
			a.href = url;
			a.download = result.filename;
			a.click();
			URL.revokeObjectURL(url);
			aras.AlertSuccess(`Exported ${result.filename}`);
		}
	} catch (e) {
		aras.AlertError(
			(e as Error).message ||
				"Export service unreachable. Is quick-export running?",
		);
	}
}
