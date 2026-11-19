import { connect, exportPackages, type Session } from "import-export-libs-js/browser";
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

/** Last path segment of an export-tree path. */
function basename(p: string): string {
	const idx = p.lastIndexOf("/");
	return idx >= 0 ? p.slice(idx + 1) : p;
}

/** Second-to-last path segment: the ItemType folder in a native export tree. */
function parentSegment(p: string): string {
	const parts = p.split("/");
	return parts.length >= 2 ? parts[parts.length - 2]! : "";
}

function stripXml(name: string): string {
	return name.replace(/\.xml$/i, "");
}

/**
 * Choose the one .xml file that is the requested item's export. A native export lays each
 * element out as `<package>/Import/<ItemType>/<keyedName>.xml`, and referenced items land
 * beside it, so keep only files in the item's package (when any) and match on the ItemType
 * folder and the file name:
 *   1. exact: folder == itemType AND file == keyedName.xml
 *   2. the single file under the itemType folder
 *   3. the single file named keyedName.xml
 *   4. the single file overall
 */
function pickItemXml(allPaths: string[], packageName: string, itemType: string, keyedName: string): string {
	const pkgLc = packageName.toLowerCase();
	const inPackage = allPaths.filter((f) => f.split("/")[0]!.toLowerCase() === pkgLc);
	const paths = inPackage.length > 0 ? inPackage : allPaths;
	const typeLc = itemType.toLowerCase();
	const nameLc = keyedName.toLowerCase();

	const exact = paths.find(
		(f) => parentSegment(f).toLowerCase() === typeLc && stripXml(basename(f)).toLowerCase() === nameLc,
	);
	if (exact) return exact;

	const underType = paths.filter((f) => parentSegment(f).toLowerCase() === typeLc);
	if (underType.length === 1) return underType[0]!;

	const byName = paths.filter((f) => stripXml(basename(f)).toLowerCase() === nameLc);
	if (byName.length === 1) return byName[0]!;

	if (paths.length === 1) return paths[0]!;

	throw new Error(
		`Export is ambiguous: ${paths.length} files, none uniquely match ${itemType}/${keyedName}: ${paths
			.map(basename)
			.join(", ")}`,
	);
}

/**
 * Export one packaged item the way the Package Import/Export utility does (level 1,
 * referenced items included, references to unknown packages kept) and download exactly
 * that item's XML file. Runs in the page through import-export-libs-js, reusing the
 * signed-in Aras client's session token.
 */
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

	const { url, database } = getConnContext(aras);
	let session: Session | undefined;
	try {
		session = await connect({
			url,
			database,
			tokenProvider: {
				// Asked again when the server refuses a token, so read the client's current one.
				getAccessToken: async () =>
					getConnContext(aras).token.replace(/^Bearer\s+/i, ""),
			},
		});

		const { files, summary } = await exportPackages(session, {
			items: [{ type: item.itemTypeName, id: item.itemId }],
			level: "1",
			exportReferencedItems: true,
			unknownReferences: "do-not-remove",
		});

		if (summary.messages.errors > 0) {
			aras.AlertError(
				`Export failed: export engine reported ${summary.messages.errors} error(s) — result is partial`,
			);
			return;
		}

		const xmlPaths = [...files.keys()].filter((p) => /\.xml$/i.test(p));
		if (xmlPaths.length === 0) {
			aras.AlertError("Export failed: export produced no .xml files");
			return;
		}

		const picked = pickItemXml(xmlPaths, pkg.packageName, item.itemTypeName, item.name);
		const filename = basename(picked);
		const blob = new Blob([files.get(picked) as Uint8Array<ArrayBuffer>], { type: "application/xml" });
		const href = URL.createObjectURL(blob);
		const a = topWindow.document.createElement("a");
		a.href = href;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(href);
		aras.AlertSuccess(`Exported ${filename}`);
	} catch (e) {
		aras.AlertError(`Export failed: ${(e as Error).message || "unknown error"}`);
	} finally {
		await session?.close().catch(() => {});
	}
}
