import Fuse from "fuse.js";
import type { SearchItemData } from "../types/search";

/**
 * Fetch the current user's saved favorite searches via AML.
 * Must be called lazily (not at module load) because aras APIs
 * aren't available until the client finishes startup.
 */
export function fetchFavorites(aras: ArasGlobal): SearchItemData[] {
	const aml = `<AML>
		<Item action="get" type="Favorite"
			select="id,label,keyed_name,context_type,category,additional_data">
			<category condition="eq">Search</category>
			<owned_by_id>${aras.getIsAliasIdentityIDForLoggedUser()}</owned_by_id>
		</Item>
	</AML>`;

	const res = aras.IomInnovator.applyAML(aml);

	// Aras reports an empty result set as isError() with "No items … found"
	if (!res || typeof res.getItemCount !== "function") return [];
	const resAsItem = res as unknown as ArasItem;
	if (typeof resAsItem.isError === "function" && resAsItem.isError()) {
		const msg =
			typeof resAsItem.getErrorString === "function"
				? resAsItem.getErrorString()
				: "";
		if (/no items/i.test(msg)) return [];
		console.error("[power-search] favorites query error:", msg);
		return [];
	}

	const typeIdCache: Record<string, string> = {};
	const resolveTypeId = (name: string): string => {
		if (!name) return "";
		if (typeIdCache[name] != null) return typeIdCache[name];
		let id = "";
		try {
			const it = aras.getItemTypeForClient(name, "name");
			if (it) id = it.getID();
		} catch {
			/* type may not exist client-side yet */
		}
		typeIdCache[name] = id;
		return id;
	};

	const out: SearchItemData[] = [];
	for (let i = 0; i < res.getItemCount(); i++) {
		const item = res.getItemByIndex(i);
		const itemTypeName = item.getProperty("context_type") || "";
		const favoriteId = item.getProperty("id");
		out.push({
			name:
				item.getProperty("label") ||
				item.getProperty("keyed_name") ||
				"(unnamed)",
			description: itemTypeName,
			itemId: favoriteId,
			itemConfigId: favoriteId,
			label_plural: "",
			itemTypeId: resolveTypeId(itemTypeName),
			itemTypeName,
			image: null,
			imageFileId: null,
			favoriteId,
		});
	}
	return out;
}

/** Filter a pre-fetched favorites list with Fuse.js. */
export function searchFavorites(
	favorites: SearchItemData[],
	query: string,
): SearchItemData[] {
	if (!query.trim()) return favorites.slice(0, 9);

	const fuse = new Fuse(favorites, {
		keys: ["name", "itemTypeName"],
	});
	return fuse
		.search(query)
		.map((r) => r.item)
		.slice(0, 9);
}
