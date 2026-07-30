import { getUrlFromFileId } from "../aras/utils";
import type { SearchItemData } from "../types/search";

const PAGE_SIZE = 500;

const getMetadataProperty = (item: Element, name: string) =>
	item.getElementsByTagName(name)[0]?.textContent || "";

const getMetadataIcon = (
	aras: ArasGlobal,
	item: Element,
	defaultImage: string,
	imageCache: Record<string, string>,
) => {
	const icon =
		getMetadataProperty(item, "open_icon") ||
		getMetadataProperty(item, "large_icon") ||
		defaultImage;
	if (!icon.includes("vault:")) return { image: icon, imageFileId: null };

	const imageFileId = icon.split("=")[1] || null;
	return {
		image: imageFileId
			? imageCache[imageFileId] || getUrlFromFileId(aras, imageFileId)
			: defaultImage,
		imageFileId,
	};
};

export const getItemTypeIcon = (
	aras: ArasGlobal,
	itemTypeName: string,
	defaultImage: string,
	imageCache: Record<string, string>,
) => {
	const item = aras.MetadataCache?.GetItemType(
		itemTypeName,
		"name",
	)?.results?.getElementsByTagName("Item")[0];
	return item
		? getMetadataIcon(aras, item, defaultImage, imageCache)
		: { image: defaultImage, imageFileId: null };
};

function parseItem(
	item: ArasItem,
	itemTypeName: string,
	defaultImage: string,
	imageCache: Record<string, string>,
	aras: ArasGlobal,
): SearchItemData {
	let image: string | null = null;
	let imageFileId: string | null = null;

	if (
		item.getProperty("open_icon") &&
		item.getPropertyAttribute("open_icon", "is_null") !== "1"
	) {
		if (item.getProperty("open_icon").includes("vault:")) {
			imageFileId = item.getProperty("open_icon").split("=")[1] ?? null;
			image = imageFileId
				? imageCache[imageFileId] ?? getUrlFromFileId(aras, imageFileId)
				: null;
		} else {
			image = item.getProperty("open_icon");
		}
	}

	if (!image) {
		image = defaultImage;
	}

	if (imageFileId && image) {
		imageCache[imageFileId] = image;
	}

	return {
		image,
		name: item.getProperty("name") || item.getProperty("keyed_name"),
		description: item.getProperty("config_id"),
		itemId: item.getProperty("id"),
		itemConfigId: item.getProperty("config_id"),
		label_plural: item.getProperty("label_plural"),
		itemTypeId: item.getProperty("itemtype"),
		itemTypeName,
		imageFileId,
	};
}

export const getAllItems = (
	aras: ArasGlobal,
	itemTypeName: string,
	defaultImage: string,
	imageCache: Record<string, string>,
): SearchItemData[] => {
	const result: SearchItemData[] = [];
	let page = 1;

	for (;;) {
		const items = aras.IomInnovator.applyAML(`
    <AML>
        <Item
            type="${itemTypeName}"
            action="get"
            select="config_id,id,name,keyed_name,open_icon,label_plural"
            serverEvents="0"
            page="${page}"
            pagesize="${PAGE_SIZE}"
        >
        </Item>
    </AML>
    `);

		if (items.isError() || items.getItemCount() === 0) break;

		const count = items.getItemCount();
		for (let i = 0; i < count; i++) {
			result.push(
				parseItem(items.getItemByIndex(i), itemTypeName, defaultImage, imageCache, aras),
			);
		}

		const pagemax = parseInt(items.getItemByIndex(0).getAttribute("pagemax"), 10);
		if (pagemax > 0 ? page >= pagemax : count < PAGE_SIZE) break;

		page++;
	}

	return result;
};
